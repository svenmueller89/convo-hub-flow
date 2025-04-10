
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
  }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
  loading: boolean;
  checkAndRedirectToSetup: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check if user has any mailboxes, if not redirect to setup
  const checkAndRedirectToSetup = async () => {
    if (!user) return false;

    try {
      // Use type assertion to work with the mailboxes table
      const { data: mailboxes, error } = await supabase
        .from('mailboxes')
        .select('id')
        .eq('user_id', user.id)
        .limit(1) as any;

      if (error) throw error;

      const needsSetup = !mailboxes || mailboxes.length === 0;
      
      if (needsSetup) {
        navigate('/setup');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking mailboxes:', error);
      return false;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) {
        // After successful sign in, check if setup is needed
        // Use setTimeout to ensure auth state is updated first
        setTimeout(async () => {
          const redirected = await checkAndRedirectToSetup();
          if (!redirected) {
            navigate('/');
          }
        }, 100);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });
      if (!error) {
        // After successful signup, redirect to setup
        setTimeout(async () => {
          navigate('/setup');
        }, 100);
      }
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading,
    checkAndRedirectToSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
