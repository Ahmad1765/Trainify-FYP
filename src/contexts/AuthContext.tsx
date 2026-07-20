import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  AuthError
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Device } from '@capacitor/device';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'This email is already registered. Please try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please contact support.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    default:
      return 'An error occurred during registration. Please try again.';
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (Capacitor.isNativePlatform()) {
        // Check for stored user data on native platforms
        const { value } = await Preferences.get({ key: 'user' });
        if (value) {
          const userData = JSON.parse(value);
          setUser(userData as User);
        }
      }

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
      });

      return unsubscribe;
    };

    initializeAuth();
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      // Validate inputs
      if (!email || !password || !displayName) {
        throw new Error('All fields are required');
      }

      if (password.length < 6) {
        throw new Error('Password should be at least 6 characters long');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      try {
        await updateProfile(userCredential.user, { displayName });
      } catch (profileError) {
        console.error('Error updating profile:', profileError);
        // Don't throw here, as the user is already created
      }

      // Store user data in Preferences for native platforms
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({
          key: 'user',
          value: JSON.stringify({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL
          })
        });
      }
    } catch (error) {
      console.error('Error signing up:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      if (Capacitor.isNativePlatform()) {
        // Handle Google Sign-In for native platforms
        // You'll need to implement platform-specific Google Sign-In
        // This is a placeholder for the actual implementation
        throw new Error('Google Sign-In not implemented for native platforms yet');
      } else {
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      if (Capacitor.isNativePlatform()) {
        await Preferences.remove({ key: 'user' });
      }
    } catch (error) {
      console.error('Error signing out:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      if (user) {
        await updateProfile(user, data);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error) {
        throw new Error(getAuthErrorMessage(error as AuthError));
      }
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
