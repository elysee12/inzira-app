import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import apiClient from "./apiClient";

export type UserRole = "admin" | "parent";

export interface UserAccount {
  name: string;
  phone?: string;
  email: string;
  password?: string;
  role: UserRole;
}

interface AuthState {
  userId: string | null;
  role: UserRole | null;
  isLoaded: boolean;
  userName: string;
  userPhone: string;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>;
  register: (name: string, phone: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  findUserByEmail: (email: string) => Promise<UserAccount | null>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
}

const STORAGE_KEY = "inzira_auth";
const TOKEN_KEY = "userToken";

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    role: null,
    isLoaded: false,
    userName: "",
    userPhone: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setState({ 
            userId: parsed.userId || null,
            role: parsed.role.toLowerCase() as UserRole, 
            userName: parsed.userName, 
            userPhone: parsed.userPhone || "", 
            isLoaded: true 
          });
        } else {
          setState((s) => ({ ...s, isLoaded: true }));
        }
      } catch {
        setState((s) => ({ ...s, isLoaded: true }));
      }
    })();
  }, []);

  const login = useCallback(async (identifier: string, password: string): Promise<{ success: boolean; role?: UserRole; error?: string }> => {
    try {
      const response = await apiClient.post('/auth/login', { identifier, password });
      const { access_token, user } = response.data;
      
      const role = user.role.toLowerCase() as UserRole;
      const data = { 
        userId: user.id.toString(),
        role, 
        userName: user.name, 
        userPhone: user.phone || "", 
        email: user.email 
      };
      
      await AsyncStorage.setItem(TOKEN_KEY, access_token);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      
      setState({ ...data, isLoaded: true });
      return { success: true, role };
    } catch (error: any) {
      // Handle specific error codes
      if (error.response?.status === 401) {
        return { 
          success: false, 
          error: "Imeli cyangwa ijambo ry'ibanga si ryo. Gerageza nanone." 
        };
      }
      
      if (error.response?.status === 404) {
        return { 
          success: false, 
          error: "Nta konti ifite iyi imeli. Andikira mbere." 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || "Injira ntibyashobotse. Gerageza nanone." 
      };
    }
  }, []);

  const register = useCallback(async (
    name: string, phone: string, email: string, password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/auth/register', { 
        name, 
        phone,
        email, 
        password,
        role: "PARENT"
      });
      return { success: true };
    } catch (error: any) {
      if (error.response?.status === 400) {
        return { 
          success: false, 
          error: error.response?.data?.message || "Iki imeli cyangwa nimero yasanzwe." 
        };
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || "Kwiyandikisha ntibyashobotse. Gerageza nanone." 
      };
    }
  }, []);

  const findUserByEmail = useCallback(async (email: string): Promise<UserAccount | null> => {
    try {
      const response = await apiClient.post('/auth/find-by-email', { email });
      return response.data;
    } catch (error) {
      return null;
    }
  }, []);

  const resetPassword = useCallback(async (
    email: string, otp: string, newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/auth/reset-password', { email, otp, newPassword });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Guhindura ijambo ry'ibanga ntibyashobotse." 
      };
    }
  }, []);

  const sendOtp = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/auth/send-otp', { email });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Gohereza kode OTP ntibyashobotse." 
      };
    }
  }, []);

  const verifyOtp = useCallback(async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/auth/verify-otp', { email, otp });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || "Kode OTP si yo cyangwa yarengeje igihe." 
      };
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    setState({ userId: null, role: null, userName: "", userPhone: "", isLoaded: true });
    router.replace("/auth/login");
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, findUserByEmail, resetPassword, sendOtp, verifyOtp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
