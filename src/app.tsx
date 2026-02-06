import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import "./app.css";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { DAppKitProvider } from "@/contexts/dapp-kit";
import { BalanceManagerProvider } from "@/contexts/balance-manager";
import { MarginManagerProvider } from "@/contexts/margin-manager";
import { DeepBookProvider } from "@/contexts/deepbook";
import { dAppKit } from "@/lib/dapp-kit";
import {
  ColorModeProvider,
  ColorModeScript,
  createLocalStorageManager,
} from "@kobalte/core";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

export default function App() {
  const storageManager = createLocalStorageManager("kb-color-mode");
  return (
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <BalanceManagerProvider>
          <MarginManagerProvider>
            <ColorModeScript storageType={storageManager.type} />
            <ColorModeProvider storageManager={storageManager}>
              <DeepBookProvider>
                <Router>
                  <Toaster />
                  <FileRoutes />
                </Router>
              </DeepBookProvider>
            </ColorModeProvider>
          </MarginManagerProvider>
        </BalanceManagerProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
