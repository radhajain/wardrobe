import { createContext, ReactNode, useContext, useMemo, useRef } from "react";
import { useAuthenticate } from "@neondatabase/neon-js/auth/react";
import { authClient } from "./client";
import { ensureUserExists } from "../services/userSync";
import { setCurrentUser } from "../services/storage";

/**
 * User type from session
 */
export interface User {
  id: string;
  email: string;
  name?: string;
}

/**
 * Auth context type
 */
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Auth provider component
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useAuthenticate();
  const syncedUserIdRef = useRef<string | null>(null);

  const user: User | null = useMemo(() => {
    if (!data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name ?? undefined,
    };
  }, [data?.user?.id, data?.user?.email, data?.user?.name]);

  // Sync user to our database and set current user for storage when they sign in
  if (user && syncedUserIdRef.current !== user.id) {
    syncedUserIdRef.current = user.id;
    setCurrentUser(user.id);
    ensureUserExists(user).catch(console.error);
  }

  // Clear current user when signed out
  if (!user && syncedUserIdRef.current !== null) {
    syncedUserIdRef.current = null;
    setCurrentUser(null);
  }

  const handleSignOut = async () => {
    syncedUserIdRef.current = null;
    setCurrentUser(null);
    await authClient.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isPending,
        isAuthenticated: !!user,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
