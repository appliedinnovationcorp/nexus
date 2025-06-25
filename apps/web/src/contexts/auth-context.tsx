"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { User } from "@/types/user";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  confirmEmail: (token: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("nexus_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const userData = await authApi.getProfile();
      setUser(userData);
    } catch (error) {
      localStorage.removeItem("nexus_token");
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      localStorage.setItem("nexus_token", response.token);
      setUser(response.user);
      
      toast.success(`Welcome back, ${response.user.firstName}!`);
      
      // Redirect based on user status
      if (!response.user.emailVerified) {
        router.push("/verify-email");
      } else if (!response.user.profileCompleted) {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Login failed");
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      
      toast.success("Registration successful! Please check your email to verify your account.");
      router.push("/verify-email?email=" + encodeURIComponent(data.email));
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
      throw error;
    }
  };

  const confirmEmail = async (token: string) => {
    try {
      const response = await authApi.confirmEmail(token);
      localStorage.setItem("nexus_token", response.token);
      setUser(response.user);
      
      toast.success("Email verified successfully!");
      
      if (!response.user.profileCompleted) {
        router.push("/complete-profile");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Email verification failed");
      throw error;
    }
  };

  const resendConfirmation = async (email: string) => {
    try {
      await authApi.resendConfirmation(email);
      toast.success("Confirmation email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send confirmation email");
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("nexus_token");
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/");
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const updatedUser = await authApi.updateProfile(data);
      setUser(updatedUser);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Profile update failed");
      throw error;
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await authApi.forgotPassword(email);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email");
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      await authApi.resetPassword(token, password);
      toast.success("Password reset successfully! You can now log in.");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    confirmEmail,
    resendConfirmation,
    updateProfile,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
