import { createDAppKit } from "@mysten/dapp-kit-core";
import { SuiJsonRpcClient, getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

export const dAppKit = createDAppKit({
  networks: ["mainnet", "testnet"],
  createClient: (network) =>
    new SuiJsonRpcClient({
      url: getJsonRpcFullnodeUrl(network),
      network,
    }),
});
