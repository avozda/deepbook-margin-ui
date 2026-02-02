const BASE_URL = "https://deepbook-indexer.mainnet.mystenlabs.com";

export default async function dbIndexerClient(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorDetails = await response.json().catch(() => ({}));
    throw new Error(
      errorDetails.message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}
