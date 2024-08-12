export const proxyApiRequest = (request: Request, path?: string) => {
  const url = new URL(request.url);
  path = path || url.pathname;
  let endpoint = new URL(path, process.env.API_URL);

  // Copy over query parameters
  endpoint.search = url.search;

  console.log("🚀 | proxyApiRequest | endpoint:", endpoint.toString());
  let clonedRequest = new Request(endpoint, request);
  return fetch(clonedRequest);
};

export const proxyApiRequestAsJson = async <T>(
  request: Request,
  path?: string
) => {
  const response = await proxyApiRequest(request, path);
  console.log("🚀 | response:", response.url, response.status);
  if (!response.ok) {
    throw response;
  }
  return response.json() as Promise<T>;
};
