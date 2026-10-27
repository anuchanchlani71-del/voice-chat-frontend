import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getUserToken, setUserToken, removeUserToken } from '../services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getUserToken());
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount if userToken exists
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = getUserToken();
      if (!storedToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const res = await authApi.getMe();
        if (isMounted) {
          if (res.success && res.user) {
            setUser(res.user);
            setToken(storedToken);
          } else {
            removeUserToken();
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          removeUserToken();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = useCallback(async (identifier, password) => {
    const res = await authApi.login({ identifier, password });
    if (res.success && res.user && res.token) {
      setUserToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Authentication failed');
  }, []);

  // Register handler
  const register = useCallback(async ({ fullName, username, email, password }) => {
    const res = await authApi.register({ fullName, username, email, password });
    if (res.success && res.user && res.token) {
      setUserToken(res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Registration failed');
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    removeUserToken();
    try {
      sessionStorage.removeItem('vcf_user_profile');
      sessionStorage.removeItem('vcf_user_notifications');
      sessionStorage.removeItem('vcf_discovery_filters');
    } catch (e) {
      // ignore
    }
    setToken(null);
    setUser(null);
  }, []);

  // Complete onboarding handler
  const finishOnboarding = useCallback(async (interests) => {
    const res = await authApi.completeOnboarding(interests);
    if (res.success && res.user) {
      setUser(res.user);
      return res;
    }
    throw new Error(res.error || 'Failed to complete onboarding');
  }, []);

  // Update profile handler
  const updateUserProfile = useCallback(async (profileData) => {
    const res = await authApi.updateProfile(profileData);
    if (res.success && res.user) {
      setUser(res.user);
      try {
        sessionStorage.setItem('vcf_user_profile', JSON.stringify(res.user));
      } catch (e) {
        // ignore
      }
      return res;
    }
    throw new Error(res.error || 'Failed to update profile');
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    register,
    logout,
    setUser,
    finishOnboarding,
    updateUserProfile,
    updateProfile: updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      setUser: () => {},
      finishOnboarding: async () => {},
      updateUserProfile: async () => {},
      updateProfile: async () => {}
    };
  }
  return context;
}

