import { Suspense } from "solid-js";
import { ConnectButton } from "@/components/header/connect-button";
import { Settings } from "@/components/header/settings";
import { PairTableTrigger } from "@/components/header/pair-table";
import { MarketStats } from "@/components/header/market-stats";

export const Nav = () => {
  return (
    <div class="flex w-full items-center justify-between border-b p-4">
      <div class="flex items-center gap-4 md:gap-8">
        <PairTableTrigger />
        <Suspense>
          <MarketStats />
        </Suspense>
      </div>
      <div class="flex items-center gap-4">
        <Settings />
        <ConnectButton connectText="Connect" />
      </div>
    </div>
  );
};
