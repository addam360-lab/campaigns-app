"use client";

import { useState, useEffect } from "react";
import { User } from "@/types/models";
import { UseAuthReturn } from "@/types/auth";
import { createSupabaseClient } from "@/lib/supabaseClient";

export function useAuth(): UseAuthReturn {
  const supabase = createSupabaseClient();

  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const clearError = () => setError(null);

  const fetchUserProfile = async (userId: string, userEmail: string) => {
    try {
      const [profileResponse, usageResponse] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase
          .from("usage_tracking")
          .select("tasks_created")
          .eq("user_id", userId)
          .eq("year_month", new Date().toISOString().slice(0, 7))
          .maybeSingle(),
      ]);

      if (profileResponse.error) throw profileResponse.error;

      setUser({
        ...profileResponse.data,
        email: userEmail,
        tasks_created: usageResponse.data?.tasks_created || 0,
      });
    } catch (err) {
      console.error("Critical error fetching user profile:", err);
      await signOut();
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionState = async (newSession: any) => {
    setSession(newSession);
    setIsLoggedIn(!!newSession);

    if (newSession?.user) {
      setIsLoading(true);
      await fetchUserProfile(newSession.user.id, newSession.user.email);
    } else {
      setUser(null);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setIsLoggedIn(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setError(err.message);
      console.error("Error signing out:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error logging in:", err);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error with Google login:", err);
    }
  };

  const handleSignup = async () => {
    clearError();

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setError("Please check your email to confirm your account");
      }
    } catch (err: any) {
      setError(err.message);
      console.error("Error signing up:", err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted) {
          await updateSessionState(session);
        }
      } catch (err: any) {
        console.error("Error initializing auth:", err);
        if (mounted) {
          setError(err.message);
          await signOut();
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        updateSessionState(nextSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    session,
    email,
    password,
    isLoggedIn,
    isLoading,
    error,
    isSignUpMode,
    signOut,
    handleLogin,
    handleGoogleLogin,
    handleSignup,
    setEmail,
    setPassword,
    setIsSignUpMode,
    clearError,
  };
}