export const isBrowser = typeof window !== "undefined";

/**
 * Takes a desired path and query params and merges them with the current location
 *
 * The path is optional, if not provided, the current location's path with be used
 * Any existing query params will be left unless specifically overwritten in the desired query params
 * You can clear a search param by setting it to ""
 * @param desiredUrl the desired path and query params
 * @param location optional, defaults to window.location
 * @returns mergedUrl
 */
export const mergeUrl = (
  { path = "", query = {} }: { path?: string; query?: Record<string, string> },
  location?: { pathname: string; search: string }
) => {
  location = location || (isBrowser ? window.location : undefined);
  if (!location) {
    throw new Error("mergeUrl error - you must provide a current location/URL");
  }
  // Incase the path comes in with query params, strip it off to avoid duplicates
  let pathname = (path || location?.pathname)?.split("?")?.[0];
  let searchParams = new URLSearchParams(location?.search);
  Object.keys(query).forEach((key) => {
    let value = query[key];
    if (value) {
      searchParams.set(key, value);
    } else if (!value) {
      searchParams.delete(key);
    }
  });

  // check if there are any search params, if not we won't use the ?
  let search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return `${pathname}${search}`;
};

export const ensureHttps = (requestUrl: string | URL): URL => {
  let url = new URL(requestUrl);
  if (!url.origin.includes("localhost")) {
    url.protocol = "https";
  }

  return url;
};

/** Looks for an returnTo or returnTo query param. Also ensuresHttps */
export const getReturnToUrl = (
  requestUrl: string | URL,
  fallback = ""
): string => {
  if (!requestUrl) return "";

  let url = new URL(requestUrl);
  let returnTo = new URL(
    url.searchParams.get("returnTo") ||
      url.searchParams.get("returnTo") ||
      fallback,
    url.origin
  );

  return ensureHttps(returnTo).href;
};

/**
 * This function generates an authentication redirect URI based on the provided parameters.
 *
 * @param {string} returnToAbsoluteUrl The absolute URL to which the user should be redirected after authentication. Even if the returnTo url won't be appended to the redirect_uri, we pass it here to parse the hostname and protocol.
 * @param {string} callbackPath The path to the authentication callback endpoint.
 * @param {boolean} appendReturnTo A flag indicating whether the returnTo URL should be appended to the redirect URI as a query parameter. Default is true.
 *
 * The function forces the protocol to HTTPS if the URL is not localhost for security reasons.
 * If appendReturnTo is true, the returnTo URL is appended as a query parameter to the redirect URI.
 *
 * @returns {string} The generated authentication redirect URI.
 *
 * @example
 * // returns 'https://example.com/auth/callback?returnTo=http%3A%2F%2Fexample.com%2Fdashboard'
 * getAuthRedirectUri('http://example.com/dashboard', '/auth/callback', true)
 *
 * @example
 * // returns 'https://example.com/auth/callback'
 * getAuthRedirectUri('http://example.com/dashboard', '/auth/callback', false)
 */
export const getAuthRedirectUri = (
  returnToAbsoluteUrl: string,
  callbackPath: string,
  appendReturnTo = false
) => {
  if (!returnToAbsoluteUrl) return "";

  let urlParts = new URL(returnToAbsoluteUrl);
  // force it to https if it's not localhost
  if (!urlParts.origin.includes("localhost")) {
    urlParts.protocol = "https";
  }
  let redirectUri = urlParts.origin + callbackPath;
  if (appendReturnTo) {
    redirectUri += `?returnTo=${encodeURIComponent(returnToAbsoluteUrl)}`;
  }
  return redirectUri;
};

/**
 * This function takes a URL string as input and returns the parent path of the URL.
 * It is useful when you need to navigate up one level in your application's route hierarchy.
 *
 * @param {string} urlStr The URL string from which to extract the parent path.
 * @returns {string} The parent url.
 *
 * @example
 * // returns 'http://example.com/parent'
 * getParentUrl('http://example.com/parent/child')
 *
 * @example
 * // returns 'http://example.com'
 * getParentUrl('http://example.com/parent')
 */
export const getParentUrl = (urlStr: string) => {
  if (!urlStr) return "";
  let url = new URL(urlStr);

  let pathParts = url.pathname.split("/").filter(Boolean);

  // If there is only one part, it means the URL is one level deep
  if (pathParts.length === 0) return "";

  let [, ...reversedParentParts] = pathParts.reverse();

  url.pathname = reversedParentParts.reverse().join("/");

  return url.toString();
};

/**
 * This function creates a link with a returnTo query parameter.
 *
 * @param {string} to The target href to which the link should point.
 * @param {Object} currentLocation The current location object containing pathname and search.
 * @param {string} currentLocation.pathname The current path of the application.
 * @param {string} currentLocation.search The current search string, including the leading "?" (if any).
 *
 * The function first creates a returnTo value by encoding the current pathname and search.
 * If the target URL already includes a query parameter, it appends the returnTo value with an "&".
 * Otherwise, it appends the returnTo value with a "?".
 *
 * @returns {string} - The created link with the returnTo query parameter.
 *
 * @example
 * // returns '/target?returnTo=%2Fcurrent%2Fpath%3Fsearch'
 * createLinkWithReturnTo('/target', { pathname: '/current/path', search: '?search' })
 *
 * @example
 * // returns '/target?query=value&returnTo=%2Fcurrent%2Fpath%3Fsearch'
 * createLinkWithReturnTo('/target?query=value', { pathname: '/current/path', search: '?search' })
 */
export const createLinkWithReturnTo = (
  to: string,
  currentLocation: { pathname: string; search: string }
) => {
  // first create the returnTo value
  let returnTo = encodeURIComponent(
    currentLocation?.pathname + currentLocation?.search
  );

  // does the target already have a query param?
  if (to.includes("?")) {
    return `${to}&returnTo=${returnTo}`;
  }
  return `${to}?returnTo=${returnTo}`;
};

/**
 * Creates a link to a modal form, preserving the current location's pathname and search parameters.
 * When we link to a mdoal form route, we want to preserve current screen's criteria query params because the items will still be visible behind the modal form.
 * We also want to include a returnTo query param so we can redirect back to
 *
 * @param {string} path The route path to the modal form.
 * @param {{ pathname: string; search: string }} location The current location object containing pathname and search.
 *
 * @returns {string} The created link to the modal form with the returnTo query parameter set to the current location's pathname and search.
 *
 * @example
 * // returns '/modalFormPath?returnTo=%2Fcurrent%2Fpath%3Fsearch'
 * createModalFormLink('/modalFormPath', { pathname: '/current/path', search: '?search' })
 */
export function createModalFormLink(
  path: string,
  location: { pathname: string; search: string }
) {
  return mergeUrl(
    {
      path,
      query: {
        // Pass a returnTo to the form so we redirect back to
        // the exact same criteria results.
        returnTo: location.pathname + location.search,
      },
    },
    location
  );
}
