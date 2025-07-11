import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '../types';
import { dataService } from '../services/dataService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Return a mock auth hook for components that use it outside of provider
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    const signIn = async (email: string, password: string): Promise<User> => {
      setLoading(true);
      try {
        const authenticatedUser = dataService.authenticateUser(email, password);
        if (!authenticatedUser) {
          throw new Error('Invalid credentials');
        }
        setUser(authenticatedUser);
        localStorage.setItem('smw_user', JSON.stringify(authenticatedUser));
        return authenticatedUser;
      } finally {
        setLoading(false);
      }
    };

    const signOut = () => {
      setUser(null);
      localStorage.removeItem('smw_user');
    };

    // Check for stored user on mount
    useEffect(() => {
      const storedUser = localStorage.getItem('smw_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          localStorage.removeItem('smw_user');
        }
      }
    }, []);

    return {
      user,
      loading,
      signIn,
      signOut,
      isAuthenticated: !!user
    };
  }
  return context;
};