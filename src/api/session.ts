/**
 * Session seam between the API layer and the auth feature. Core modules must not
 * import features, so the auth feature registers itself here instead.
 */
type AuthorizationProvider = () => string | null | Promise<string | null>;
type SessionClearedHandler = () => void | Promise<void>;
/**
 * Exchanges the refresh token for a new credential. Resolves true when the session was
 * renewed, false when the backend rejected it; throws when it could not be reached.
 */
type SessionRefresher = () => Promise<boolean>;

let authorizationProvider: AuthorizationProvider = () => null;
let sessionClearedHandler: SessionClearedHandler = () => undefined;
let sessionRefresher: SessionRefresher = async () => false;
let refreshing: Promise<boolean> | null = null;

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

export function setSessionRefresher(refresher: SessionRefresher): void {
  sessionRefresher = refresher;
}

/** Called when the backend rejects the session, or when the mock backend is reset. */
export async function clearSession(): Promise<void> {
  await sessionClearedHandler();
}

/** Renews an expired access token. Concurrent callers share one refresh request. */
export function refreshAuthorization(): Promise<boolean> {
  refreshing ??= Promise.resolve()
    .then(() => sessionRefresher())
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
