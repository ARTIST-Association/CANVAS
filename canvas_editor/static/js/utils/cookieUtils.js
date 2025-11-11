/**
 * Utility function that gets the cookie specified by the name
 * @param {string} name The name of the cookie you want to get.
 * @returns {string|null} The cookie or null if it couldn't be found.
 */
export function getCookie(name) {
  if (!document.cookie) {
    return null;
  }

  // document.cookie is a key=value list separated by ';'
  const cookies = document.cookie
    .split(";")
    .map((c) => c.trim())
    //filter the right cookie name
    .filter((c) => c.startsWith(name + "="));

  if (cookies.length === 0) {
    return null;
  }

  // return the decoded value of the first cookie found
  return decodeURIComponent(cookies[0].split("=")[1]);
}
