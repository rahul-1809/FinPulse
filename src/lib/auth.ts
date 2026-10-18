import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

type AuthListener = (state: AuthState) => void;

class AuthService {
  private user: User | null = null;
  private session: Session | null = null;
  private loading = true;
  private listeners: Set<AuthListener> = new Set();
  private initialized = false;

  public subscribe(listener: AuthListener): () => void {
    this.listeners.add(listener);
    listener({ user: this.user, session: this.session, loading: this.loading });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state: AuthState = { user: this.user, session: this.session, loading: this.loading };
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error('Auth notification error:', err);
      }
    });
  }

  public init() {
    if (typeof window === 'undefined' || this.initialized) return;
    this.initialized = true;

    const supabase = getSupabase();
    if (!supabase) {
      this.loading = false;
      this.notify();
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      this.notify();
    }).catch(() => {
      this.loading = false;
      this.notify();
    });

    // Listen to auth changes
    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      this.notify();
    });
  }

  public getUser(): User | null {
    return this.user;
  }

  public getSession(): Session | null {
    return this.session;
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public async signUp(email: string, password: string): Promise<{ success: boolean; message: string; requiresConfirmation?: boolean }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' };
    }

    const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    // If confirmation is required, session will be null or user.identities will show confirmation needed
    if (data.user && !data.session) {
      return {
        success: true,
        message: 'Confirmation email sent! Please check your inbox and click the verification link.',
        requiresConfirmation: true,
      };
    }

    return { success: true, message: 'Account created and signed in successfully!' };
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Signed in successfully!' };
  }

  public async signOut(): Promise<void> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    this.user = null;
    this.session = null;
    this.notify();
  }

  public async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabase();
    if (!supabase) {
      return { success: false, message: 'Supabase is not configured.' };
    }

    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}` : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Password reset link sent to your email!' };
  }
}

export const authService = new AuthService();
