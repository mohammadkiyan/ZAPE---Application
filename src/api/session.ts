/**
 * Session seam between the API layer and the (later) auth feature. Core modules
 * must not import features, so the auth feature registers itself here instead.
 */
type AuthorizationProvider = () => string | null | Promise<string | null>;
type SessionClearedHandler = () => void | Promise<void>;

let authorizationProvider: AuthorizationProvider = () => null;
let sessionClearedHandler: SessionClearedHandler = () => undefined;

/** The `Authorization` header value for domain requests, or null while signed out. */
export function getAuthorization(): string | null | Promise<string | null> {
  return authorizationProvider();
}

export function setAuthorizationProvider(provider: AuthorizationProvider): void {
  authorizationProvider = provider;
}

/** Registers what "clear the local session" means (delete the token, drop cached data, go to Welcome). */
export function setSessionClearedHandler(handler: SessionClearedHandler): void {
  sessionClearedHandler = handler;
}

/** Called when the backend rejects the session, or when the mock backend is reset. */
export async function clearSession(): Promise<void> {
  await sessionClearedHandler();
}
