"use client";

import { createContext, useContext } from "react";

type AuthUser = {
  id: string;
  name: string;
  email: string;
};

interface AuthProviderProps {
  user: AuthUser;
  children: React.ReactNode;
}

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ user, children }: AuthProviderProps) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const user = useContext(AuthContext);

  if (!user) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }

  return user;
}
