import "client-only";

export const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please sign in again.";

let redirectStarted = false;

export function isSessionExpiredResponse(response: Response) {
  return response.status === 401;
}

export function redirectToSessionExpiredLogin() {
  if (redirectStarted) return;

  redirectStarted = true;
  window.location.assign("/login?error=session_expired");
}
