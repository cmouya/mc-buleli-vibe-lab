export const AUTH_COOKIE_NAME = "learnova.sid"
export const AUTH_COOKIE_MAX_AGE_SECONDS = 24 * 60 * 60

export function authCookieOptions() {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    signed: false,
  }
}
