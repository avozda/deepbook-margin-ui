import { Show, Suspense, Switch, Match } from "solid-js";
import { ConnectButton } from "@/components/header/connect-button";
import { Settings } from "@/components/header/settings";
import { PairTableTrigger } from "@/components/header/pair-table";
import { MarketStats } from "@/components/header/market-stats";
import { useCurrentAccount } from "@/contexts/dapp-kit";
import { useCurrentPool } from "@/contexts/pool";
import { useBalancesFromCurrentPool } from "@/hooks/account/useBalances";

const WalletBalances = () => {
  const account = useCurrentAccount();
  const { pool, round } = useCurrentPool();
  const {
    baseAssetBalance,
    quoteAssetBalance,
    isLoading: isWalletBalanceLoading,
  } = useBalancesFromCurrentPool();

  return (
    <Show when={account()}>
      <Switch>
        <Match when={isWalletBalanceLoading()}>
          <div class="flex items-center gap-3">
            <div class="bg-muted h-4 w-20 animate-pulse rounded" />
            <div class="bg-muted h-4 w-20 animate-pulse rounded" />
          </div>
        </Match>
        <Match when={true}>
          <div class="text-muted-foreground flex items-center gap-3 text-xs">
            <span>
              {round.display(baseAssetBalance())} {pool().base_asset_symbol}
            </span>
            <span class="text-muted-foreground/40">|</span>
            <span>
              {round.display(quoteAssetBalance())} {pool().quote_asset_symbol}
            </span>
          </div>
        </Match>
      </Switch>
    </Show>
  );
};

export const Nav = () => {
  return (
    <div class="flex w-full items-center justify-between border-b p-4">
      <div class="flex items-center gap-4 md:gap-8">
        <PairTableTrigger />
        <Suspense>
          <MarketStats />
        </Suspense>
      </div>
      <div class="flex items-center gap-2 md:gap-4">
        <Suspense>
          <WalletBalances />
        </Suspense>
        <ConnectButton connectText="Connect" />
        <Settings />
      </div>
    </div>
  );
};
