export const proxyApiRequest = (request: Request, path?: string) => {
  path = path || new URL(request.url).pathname;
  let endpoint = process.env.API_URL + path;
  console.log("🚀 | proxyApiRequest | endpoint:", endpoint);
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
