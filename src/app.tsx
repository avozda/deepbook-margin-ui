import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Nav } from "@/components/Nav";
import "./app.css";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { DAppKitProvider } from "@/contexts/dapp-kit";
import { BalanceManagerProvider } from "@/contexts/balance-manager";
import { DeepBookProvider } from "@/contexts/deepbook";
import { dAppKit } from "@/lib/dapp-kit";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";

const queryClient = new QueryClient();

export default function App() {
  const storageManager = createLocalStorageManager("kb-color-mode");
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <BalanceManagerProvider>
          <ColorModeScript storageType={storageManager.type} />
          <ColorModeProvider storageManager={storageManager}>
            <DeepBookProvider>
              <Router
                root={(props) => (
                  <>
                    <Nav />
                    <Suspense>{props.children}</Suspense>
                  </>
                )}
              >
                <FileRoutes />
              </Router>
            </DeepBookProvider>
          </ColorModeProvider>
        </BalanceManagerProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
