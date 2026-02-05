const INDEXER_URLS = {
  mainnet: "https://deepbook-indexer.mainnet.mystenlabs.com",
  testnet: "https://deepbook-indexer.testnet.mystenlabs.com",
};

export type Network = "mainnet" | "testnet";

export default async function dbIndexerClient(
  endpoint: string,
  network: Network = "mainnet",
  options: RequestInit = {}
) {
  const baseUrl = INDEXER_URLS[network];
  const url = `${baseUrl}${endpoint}`;

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
