import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { useUser, useClerk } from "@clerk/nextjs";
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
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const syncedUserIdRef = useRef<string | null>(null);

  const user: User | null = useMemo(() => {
    if (!clerkUser) return null;
    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress || "",
      name: clerkUser.fullName ?? undefined,
    };
  }, [
    clerkUser?.id,
    clerkUser?.primaryEmailAddress?.emailAddress,
    clerkUser?.fullName,
  ]);

  // Sync user to our database when they sign in
  useEffect(() => {
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
  }, [user]);

  const handleSignOut = async () => {
    syncedUserIdRef.current = null;
    setCurrentUser(null);
    await clerkSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
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
