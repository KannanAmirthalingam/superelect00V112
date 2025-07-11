import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  connectionStatus: string;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      const status = dataService.getConnectionStatus();
      setConnectionStatus(status);
    };

    // Check connection status every 5 seconds
    const interval = setInterval(checkConnection, 5000);
    checkConnection(); // Initial check

    return () => clearInterval(interval);
  }, []);

  const signIn = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    console.log('🔐 Attempting to sign in:', email);
    
    try {
      // Check if Firebase is connected
      if (!dataService.isConnected()) {
        console.log('⚠️ Firebase not connected, checking for initial setup...');
        
        // For initial setup, allow admin login without Firebase auth
        if (email === 'admin@smw.com') {
          const users = dataService.getUsers();
          if (users.length === 0) {
            console.log('🚀 Creating initial admin user...');
            const adminUser = await dataService.createInitialAdminUser();
            setUser(adminUser);
            localStorage.setItem('smw_user', JSON.stringify(adminUser));
            console.log('✅ Initial admin user created and logged in');
            return adminUser;
          }
        }
        
        throw new Error('Unable to connect to Firebase. Please check your internet connection.');
      }

      // Try Firebase authentication first
      try {
        console.log('🔥 Attempting Firebase authentication...');
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setFirebaseUser(userCredential.user);
        console.log('✅ Firebase authentication successful');
        
        // Find corresponding user in our database
        const users = dataService.getUsers();
        const authenticatedUser = users.find(u => u.email === email);
        
        if (!authenticatedUser) {
          console.log('❌ User not found in system database');
          throw new Error('User not found in system database');
        }
        
        if (authenticatedUser.status !== 'Active') {
          console.log('❌ User account is inactive');
          throw new Error('User account is inactive');
        }
        
        // Update last login
        await dataService.updateUser(authenticatedUser.id, { lastLogin: new Date() });
        
        setUser(authenticatedUser);
        localStorage.setItem('smw_user', JSON.stringify(authenticatedUser));
        console.log('✅ User signed in successfully via Firebase');
        return authenticatedUser;
        
      } catch (firebaseError: any) {
        console.warn('⚠️ Firebase auth failed, trying local auth:', firebaseError.message);
        
        // If Firebase auth fails, try local authentication for existing users
        const authenticatedUser = await dataService.authenticateUser(email, password);
        if (!authenticatedUser) {
          throw new Error('Invalid credentials');
        }
        
        setUser(authenticatedUser);
        localStorage.setItem('smw_user', JSON.stringify(authenticatedUser));
        console.log('✅ User signed in successfully via local auth');
        return authenticatedUser;
      }
      
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      throw new Error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out user...');
    try {
      // Sign out from Firebase if authenticated
      if (firebaseUser) {
        await firebaseSignOut(auth);
        console.log('✅ Firebase sign out successful');
      }
      
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('smw_user');
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      // Even if Firebase signout fails, clear local state
      setUser(null);
      setFirebaseUser(null);
      localStorage.removeItem('smw_user');
    }
  };

  // Check for stored user and Firebase auth state on mount
  useEffect(() => {
    console.log('🔍 Checking authentication state...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      console.log('🔥 Firebase auth state changed:', firebaseUser ? 'signed in' : 'signed out');
      
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        // Wait for data service to be ready
        let retries = 0;
        const maxRetries = 10;
        
        while (!dataService.isConnected() && retries < maxRetries) {
          console.log(`⏳ Waiting for Firebase connection... (${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }
        
        if (dataService.isConnected()) {
          // Find corresponding user in our database
          const users = dataService.getUsers();
          const user = users.find(u => u.email === firebaseUser.email);
          
          if (user && user.status === 'Active') {
            setUser(user);
            localStorage.setItem('smw_user', JSON.stringify(user));
            console.log('✅ User restored from Firebase auth');
          } else {
            // Firebase user exists but not in our system or inactive
            console.log('⚠️ Firebase user not found in system or inactive');
            await firebaseSignOut(auth);
            setFirebaseUser(null);
            setUser(null);
            localStorage.removeItem('smw_user');
          }
        } else {
          console.log('❌ Could not connect to Firebase after retries');
        }
      } else {
        // No Firebase user, check for stored local user
        const storedUser = localStorage.getItem('smw_user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('🔍 Found stored user:', parsedUser.email);
            
            // Wait for data service to be ready
            let retries = 0;
            const maxRetries = 5;
            
            while (!dataService.isConnected() && retries < maxRetries) {
              console.log(`⏳ Waiting for Firebase connection to verify stored user... (${retries + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retries++;
            }
            
            if (dataService.isConnected()) {
              // Verify user still exists and is active
              const users = dataService.getUsers();
              const currentUser = users.find(u => u.id === parsedUser.id);
              
              if (currentUser && currentUser.status === 'Active') {
                setUser(currentUser);
                console.log('✅ Stored user verified and restored');
              } else {
                console.log('⚠️ Stored user no longer valid');
                localStorage.removeItem('smw_user');
                setUser(null);
              }
            } else {
              // If we can't connect, still allow the stored user for offline functionality
              console.log('⚠️ Using stored user without verification (offline mode)');
              setUser(parsedUser);
            }
          } catch (error) {
            console.error('❌ Error parsing stored user:', error);
            localStorage.removeItem('smw_user');
            setUser(null);
          }
        }
        setFirebaseUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const contextValue: AuthContextType = {
    user,
    firebaseUser,
    loading,
    connectionStatus,
    signIn,
    signOut,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};