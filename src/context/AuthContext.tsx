import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, fetchUserByEmail } from '../api/api';

// Describe a user as returned by the backend.  The API currently does not
// document the exact shape of the user object, so we conservatively model
// only those fields we depend on.
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  roles: string[];
}

// Describes the shape of our authentication context.  Consumers can access
// the current user, a boolean indicating whether authentication state is
// loading, the auth token, and helpers to log in, register and log out.
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; username: string; email: string; password: string; roles: string | string[] }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

interface Props {
  children: ReactNode;
}

/**
 * AuthProvider wraps the application and holds state related to
 * authentication.  Upon mounting it attempts to load a previously saved
 * token from AsyncStorage and, if present, fetches the associated user
 * profile.  Consumers can call `login`, `register` and `logout` to update
 * authentication state.
 */
export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Bootstraps auth state on mount.  We load the token from storage and
  // attempt to hydrate the user profile from the backend.  If no token
  // exists, we simply finish loading and leave user null.
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('@edupost/token');
        if (storedToken) {
          setToken(storedToken);
          // We don't know the user's email; attempt to decode from JWT or skip.
          // If the token is a JWT of the form header.payload.signature we can
          // decode the payload to extract the email and user id.  This is purely
          // for convenience—if decoding fails we fall back on leaving the user
          // undefined until the next login.
          try {
            const [, payload] = storedToken.split('.');
            const decoded = JSON.parse(atob(payload));
            if (decoded && decoded.email) {
              const res = await fetchUserByEmail(decoded.email);
              setUser(res.data as User);
            }
          } catch (err) {
            // If decoding fails we simply leave user null; the user will be
            // prompted to log in again.
            console.warn('Failed to hydrate user from stored token', err);
          }
        }
      } catch (e) {
        console.warn('Failed to bootstrap auth state', e);
      } finally {
        setLoading(false);
      }
    };
    bootstrapAsync();
  }, []);

  // Logs in a user by sending credentials to the backend.  On success the
  // returned access_token is stored and the user is fetched from the
  // backend.  On failure an error is propagated to the caller.
  const handleLogin = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const accessToken: string | undefined = res?.data?.access_token;
    if (!accessToken) {
      throw new Error('Invalid login response: access_token missing');
    }
    await AsyncStorage.setItem('@edupost/token', accessToken);
    setToken(accessToken);
    // Attempt to fetch the user using their email.  If the call fails we still
    // store the token but leave the user null until next attempt.
    try {
      const userRes = await fetchUserByEmail(email);
      setUser(userRes.data as User);
    } catch (err) {
      console.warn('Failed to fetch user after login', err);
    }
  };

  // Registers a new user.  After successful registration we do not
  // automatically log in the user; instead we simply return and expect
  // callers to navigate back to the login screen.
  const handleRegister = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    roles: string | string[];
  }) => {
    await apiRegister(data);
  };

  // Logs out the current user by removing the stored token and resetting
  // local state.
  const handleLogout = async () => {
    await AsyncStorage.removeItem('@edupost/token');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}