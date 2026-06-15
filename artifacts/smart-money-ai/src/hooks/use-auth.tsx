import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useRegister, useLogout } from "@workspace/api-client-react";
import { LoginInput, RegisterInput, User } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => void;
  register: (data: RegisterInput) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const token = typeof window !== "undefined" ? localStorage.getItem("smx_token") : null;
  
  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("smx_token", data.token);
        refetch();
        setLocation("/");
      },
      onError: (error) => {
        toast({ title: "Login failed", description: error.message || "Invalid credentials", variant: "destructive" });
      }
    }
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        localStorage.setItem("smx_token", data.token);
        refetch();
        setLocation("/");
      },
      onError: (error) => {
        toast({ title: "Registration failed", description: error.message || "Could not register", variant: "destructive" });
      }
    }
  });

  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("smx_token");
        setLocation("/login");
      }
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isUserLoading && !!token,
        login: (data) => loginMutation.mutate({ data }),
        register: (data) => registerMutation.mutate({ data }),
        logout: () => logoutMutation.mutate()
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
