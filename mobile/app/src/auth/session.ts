export type AuthProvider = "google" | "kakao";

export interface AuthSession {
  isAuthenticated: boolean;
  provider: AuthProvider | null;
}

export function createSignedOutSession(): AuthSession {
  return {
    isAuthenticated: false,
    provider: null
  };
}

export function signInWithProvider(_current: AuthSession, provider: AuthProvider): AuthSession {
  return {
    isAuthenticated: true,
    provider
  };
}

export function signOut(_current: AuthSession): AuthSession {
  return createSignedOutSession();
}
