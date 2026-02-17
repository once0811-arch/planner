import type { AuthSession } from "../auth/session";

export type RootFlow = "auth" | "main";

export function resolveRootFlow(session: AuthSession): RootFlow {
  if (session.isAuthenticated) {
    return "main";
  }
  return "auth";
}
