import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import { User } from "../types/User";

const initialUserState: User = {
  email: "",
};

interface UserContextType {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string) => Promise<{ error: any }>;
  loginWithGoogle: () => Promise<{ error: any }>;
  logout: () => Promise<{ error: any }>;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(initialUserState);
  const [loading, setLoading] = useState(true);

  // Map Supabase user to our User type
  const mapSupabaseUser = (supabaseUser: any): User => {
    if (!supabaseUser) return initialUserState;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      phone: supabaseUser.phone || "",
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      last_sign_in_at: supabaseUser.last_sign_in_at,
      confirmed_at:
        supabaseUser.confirmed_at || supabaseUser.email_confirmed_at,
      is_confirmed: !!supabaseUser.email_confirmed_at,
      role: supabaseUser.role,
      user_metadata: supabaseUser.user_metadata,
      app_metadata: supabaseUser.app_metadata,
    };
  };

  // Check for active session on mount
  useEffect(() => {
    const getUser = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { user: supabaseUser } = data.session;
        setUser(mapSupabaseUser(supabaseUser));
      }

      setLoading(false);

      // Listen for auth changes
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (session && session.user) {
            setUser(mapSupabaseUser(session.user));
          } else {
            setUser(initialUserState);
          }
          setLoading(false);
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    };

    getUser();
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  // Login with Google OAuth
  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    return { error };
  };

  // Logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, login, signup, loginWithGoogle, logout, loading }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
