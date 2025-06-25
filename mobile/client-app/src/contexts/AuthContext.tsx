import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { authApi } from '../services/api/auth';
import { Client } from '../types/client';

interface AuthContextType {
  client: Client | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  updateProfile: (data: Partial<Client>) => Promise<void>;
  enableBiometric: () => Promise<void>;
  authenticateWithBiometric: () => Promise<boolean>;
  isBiometricEnabled: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const isAuthenticated = !!client;

  useEffect(() => {
    checkAuth();
    checkBiometricSettings();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('client_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const clientData = await authApi.getProfile();
      setClient(clientData);
    } catch (error) {
      await SecureStore.deleteItemAsync('client_token');
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBiometricSettings = async () => {
    try {
      const enabled = await SecureStore.getItemAsync('biometric_enabled');
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Failed to check biometric settings:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      await SecureStore.setItemAsync('client_token', response.token);
      setClient(response.client);
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      await SecureStore.setItemAsync('client_token', response.token);
      setClient(response.client);
      router.replace('/(tabs)');
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('client_token');
      await SecureStore.deleteItemAsync('biometric_enabled');
      setClient(null);
      setIsBiometricEnabled(false);
      router.replace('/(auth)');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfile = async (data: Partial<Client>) => {
    try {
      const updatedClient = await authApi.updateProfile(data);
      setClient(updatedClient);
    } catch (error: any) {
      throw new Error(error.message || 'Profile update failed');
    }
  };

  const enableBiometric = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        throw new Error('Biometric authentication is not available on this device');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric authentication',
        fallbackLabel: 'Use password instead',
      });

      if (result.success) {
        await SecureStore.setItemAsync('biometric_enabled', 'true');
        setIsBiometricEnabled(true);
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Failed to enable biometric authentication');
    }
  };

  const authenticateWithBiometric = async (): Promise<boolean> => {
    try {
      if (!isBiometricEnabled) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access your account',
        fallbackLabel: 'Use password instead',
      });

      return result.success;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  };

  const value = {
    client,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    updateProfile,
    enableBiometric,
    authenticateWithBiometric,
    isBiometricEnabled,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
