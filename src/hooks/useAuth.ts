import { useState, useEffect, createContext, useContext } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a mock auth hook for components that use it outside of provider
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const signIn = async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        // For initial setup, allow admin login without Firebase auth
        if (email === 'admin@smw.com' && dataService.getUsers().length === 0) {
          const adminUser = await dataService.createInitialAdminUser();
          setUser(adminUser);
          localStorage.setItem('smw_user', JSON.stringify(adminUser));
          return adminUser;
        }

        // Try Firebase authentication first
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          setFirebaseUser(userCredential.user);
          
          // Find corresponding user in our database
          const users = dataService.getUsers();
          const authenticatedUser = users.find(u => u.email === email);
          
          if (!authenticatedUser) {
            throw new Error('User not found in system database');
          }
          
          if (authenticatedUser.status !== 'Active') {
            throw new Error('User account is inactive');
          }
          
          // Update last login
          await dataService.updateUser(authenticatedUser.id, { lastLogin: new Date() });
          
          setUser(authenticatedUser);
          localStorage.setItem('smw_user', JSON.stringify(authenticatedUser));
          return authenticatedUser;
          
        } catch (firebaseError: any) {
          // If Firebase auth fails, try local authentication for existing users
          console.warn('Firebase auth failed, trying local auth:', firebaseError.message);
          
          const authenticatedUser = dataService.authenticateUser(email, password);
          if (!authenticatedUser) {
            throw new Error('Invalid credentials');
          }
          
          setUser(authenticatedUser);
          localStorage.setItem('smw_user', JSON.stringify(authenticatedUser));
          return authenticatedUser;
        }
        
      } catch (error: any) {
        console.error('Authentication error:', error);
        throw new Error(error.message || 'Authentication failed');
      } finally {
        setLoading(false);
      }
    };

    const signOut = async () => {
      try {
        // Sign out from Firebase if authenticated
        if (firebaseUser) {
          await firebaseSignOut(auth);
        }
        
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('smw_user');
      } catch (error) {
        console.error('Sign out error:', error);
        // Even if Firebase signout fails, clear local state
        setUser(null);
        setFirebaseUser(null);
        localStorage.removeItem('smw_user');
      }
    };

    // Check for stored user and Firebase auth state on mount
    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        
        if (firebaseUser) {
          setFirebaseUser(firebaseUser);
          
          // Find corresponding user in our database
          const users = dataService.getUsers();
          const user = users.find(u => u.email === firebaseUser.email);
          
          if (user && user.status === 'Active') {
            setUser(user);
            localStorage.setItem('smw_user', JSON.stringify(user));
          } else {
            // Firebase user exists but not in our system or inactive
            await firebaseSignOut(auth);
            setFirebaseUser(null);
            setUser(null);
            localStorage.removeItem('smw_user');
          }
        } else {
          // No Firebase user, check for stored local user
          const storedUser = localStorage.getItem('smw_user');
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Verify user still exists and is active
              const users = dataService.getUsers();
              const currentUser = users.find(u => u.id === parsedUser.id);
              
              if (currentUser && currentUser.status === 'Active') {
                setUser(currentUser);
              } else {
                localStorage.removeItem('smw_user');
                setUser(null);
              }
            } catch (error) {
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

    return {
      user,
      firebaseUser,
      loading,
      signIn,
      signOut,
      isAuthenticated: !!user
    };
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};