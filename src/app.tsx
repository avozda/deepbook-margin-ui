import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import { Nav } from "@/components/header/nav";
import { PairTable } from "@/components/header/pair-table";
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
import { SidebarProvider } from "@/components/ui/sidebar";

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
              <SidebarProvider>
                <Router
                  root={(props) => (
                    <div class="flex h-screen w-full">
                      <PairTable />
                      <div class="flex flex-1 flex-col overflow-hidden">
                        <Nav />
                        <main class="flex-1 overflow-auto">
                          <Suspense>{props.children}</Suspense>
                        </main>
                      </div>
                    </div>
                  )}
                >
                  <FileRoutes />
                </Router>
              </SidebarProvider>
            </DeepBookProvider>
          </ColorModeProvider>
        </BalanceManagerProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  );
}
