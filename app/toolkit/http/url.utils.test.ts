import { describe, expect, it } from "vitest";
import {
  createLinkWithReturnTo,
  createModalFormLink,
  getAuthRedirectUri,
  getParentUrl,
  mergeUrl,
} from "./url.utils";

describe("mergeUrl", () => {
  it("should merge path and query params with current location", () => {
    // Mock window.location for testing
    const mockLocation = { pathname: "/test", search: "?param1=value1" };
    const desiredUrl = { path: "/desired", query: { param2: "value2" } };

    // We expect the function to merge the desired path and query params with the current location
    const expectedUrl = "/desired?param1=value1&param2=value2";
    const result = mergeUrl(desiredUrl, mockLocation);
    expect(result).toBe(expectedUrl);
  });

  it("should overwrite existing query params if specified in desired query params", () => {
    const mockLocation = { pathname: "/test", search: "?param1=value1" };
    const desiredUrl = { query: { param1: "newvalue" } };

    // We expect the function to overwrite the existing param1 with the new value
    const expectedUrl = "/test?param1=newvalue";
    const result = mergeUrl(desiredUrl, mockLocation);
    expect(result).toBe(expectedUrl);
  });

  it('should clear a search param if it is set to "" in desired query params', () => {
    const mockLocation = { pathname: "/test", search: "?param1=value1" };
    const desiredUrl = { query: { param1: "" } };

    // We expect the function to clear param1 since it is set to "" in desired query params
    const expectedUrl = "/test";
    const result = mergeUrl(desiredUrl, mockLocation);
    expect(result).toBe(expectedUrl);
  });

  it("should throw an error if no location is provided and not in a browser environment", () => {
    // Mock isBrowser to return false

    // We expect the function to throw an error since no location is provided and we are not in a browser environment
    expect(() => mergeUrl({})).toThrow(
      "mergeUrl error - you must provide a current location/URL"
    );
  });
});

describe("getParentUrl", () => {
  it("should return the parent path of a given URL", () => {
    const url = "http://example.com/parent/child";
    const expectedParentPath = "http://example.com/parent";

    // We expect the function to return the parent path of the given URL
    const result = getParentUrl(url);
    expect(result).toBe(expectedParentPath);
  });

  it("should return the root URL if the given URL is one level deep", () => {
    const url = "http://example.com/parent";
    const expectedParentPath = "http://example.com/";

    // We expect the function to return the root URL since the given URL is only one level deep
    const result = getParentUrl(url);
    expect(result).toBe(expectedParentPath);
  });

  it("should return an empty string if the given URL is the root URL", () => {
    const url = "http://example.com";
    const expectedParentPath = "";

    // We expect the function to return an empty string since the given URL is the root URL
    const result = getParentUrl(url);
    expect(result).toBe(expectedParentPath);
  });

  it("should return an empty string if no URL is provided", () => {
    const expectedParentPath = "";

    // We expect the function to return an empty string since no URL is provided
    const result = getParentUrl("");
    expect(result).toBe(expectedParentPath);
  });

  it("should correctly handle URLs with hash fragments", () => {
    const url = "http://example.com/parent/child#section";
    const expectedParentPath = "http://example.com/parent#section";

    // We expect the function to preserve the hash fragment while returning the parent path
    const result = getParentUrl(url);
    expect(result).toBe(expectedParentPath);
  });

  it("should correctly handle URLs with search parameters", () => {
    const url = "http://example.com/parent/child?param=value";
    const expectedParentPath = "http://example.com/parent?param=value";

    // We expect the function to preserve the search parameters while returning the parent path
    const result = getParentUrl(url);
    expect(result).toBe(expectedParentPath);
  });
});

describe("getAuthRedirectUri", () => {
  // Test when returnToAbsoluteUrl is empty
  it("should return an empty string when returnToAbsoluteUrl is empty", () => {
    const result = getAuthRedirectUri("", "/callback");
    expect(result).toBe("");
  });

  // Test when returnToAbsoluteUrl is localhost
  it("should not change the protocol to https when returnToAbsoluteUrl is localhost", () => {
    const result = getAuthRedirectUri(
      "http://localhost/dashboard",
      "/callback",
      true
    );
    expect(result).toBe(
      "http://localhost/callback?returnTo=http%3A%2F%2Flocalhost%2Fdashboard"
    );
  });

  // Test when returnToAbsoluteUrl is not localhost
  it("should change the protocol to https when returnToAbsoluteUrl is not localhost", () => {
    const result = getAuthRedirectUri(
      "http://example.com/dashboard",
      "/callback",
      true
    );
    expect(result).toBe(
      "https://example.com/callback?returnTo=http%3A%2F%2Fexample.com%2Fdashboard"
    );
  });

  // Test when appendReturnTo is false
  it("should not append returnToAbsoluteUrl when appendReturnTo is false", () => {
    const result = getAuthRedirectUri(
      "http://example.com/dashboard",
      "/callback",
      false
    );
    expect(result).toBe("https://example.com/callback");
  });
});

describe("createLinkWithReturnTo", () => {
  // Test when the target URL does not have a query parameter
  it('should append returnTo with "?" when target URL does not have a query parameter', () => {
    const result = createLinkWithReturnTo("/target", {
      pathname: "/current/path",
      search: "?search",
    });
    // We expect the returnTo to be appended with a "?" since the target URL does not have a query parameter
    expect(result).toBe("/target?returnTo=%2Fcurrent%2Fpath%3Fsearch");
  });

  // Test when the target URL already has a query parameter
  it('should append returnTo with "&" when target URL already has a query parameter', () => {
    const result = createLinkWithReturnTo("/target?query=value", {
      pathname: "/current/path",
      search: "?search",
    });
    // We expect the returnTo to be appended with an "&" since the target URL already has a query parameter
    expect(result).toBe(
      "/target?query=value&returnTo=%2Fcurrent%2Fpath%3Fsearch"
    );
  });

  // Test when the current location does not have a search string
  it("should handle current location without search string", () => {
    const result = createLinkWithReturnTo("/target", {
      pathname: "/current/path",
      search: "",
    });
    // We expect the returnTo to not include a search string since it was not provided in the current location
    expect(result).toBe("/target?returnTo=%2Fcurrent%2Fpath");
  });
});

describe("createModalFormLink", () => {
  it("should create a link to a modal form", () => {
    const path = "/modalFormPath";
    const location = { pathname: "/current/path", search: "?page=1&sort=blah" };
    const result = createModalFormLink(path, location);
    // We expect the function to return a URL that includes the path to the modal form and the returnTo query parameter
    expect(result).toBe(
      "/modalFormPath?page=1&sort=blah&returnTo=" +
        encodeURIComponent("/current/path?page=1&sort=blah")
    );
  });

  it("should handle an empty search string", () => {
    const path = "/modalFormPath";
    const location = { pathname: "/current/path", search: "" };
    const result = createModalFormLink(path, location);
    // We expect the function to return a URL that includes the path to the modal form and the returnTo query parameter without any search parameters
    expect(result).toBe("/modalFormPath?returnTo=%2Fcurrent%2Fpath");
  });
});
