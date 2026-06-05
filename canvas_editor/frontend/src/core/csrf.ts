/** Reads a cookie value (used for Django's CSRF token). */
export function getCookie(name: string): string | null {
  if (!document.cookie) {
    return null;
  }
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}
