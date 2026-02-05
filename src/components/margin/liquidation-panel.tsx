import { Show, For, createSignal } from "solid-js";
import { useCurrentAccount } from "@/contexts/dapp-kit";
import { useLiquidatablePositions, useLiquidate } from "@/hooks/margin";
import type { LiquidatablePosition } from "@/types/margin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { truncateAddress } from "@/lib/utils";

export const LiquidationPanel = () => {
  const account = useCurrentAccount();
  const liquidatableQuery = useLiquidatablePositions();
  const liquidateMutation = useLiquidate();

  const [selectedPosition, setSelectedPosition] =
    createSignal<LiquidatablePosition | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = createSignal(false);

  const handleLiquidateClick = (position: LiquidatablePosition) => {
    setSelectedPosition(position);
    setIsConfirmOpen(true);
  };

  const handleConfirmLiquidate = async () => {
    const position = selectedPosition();
    if (!position) return;

    const debtIsBase = position.baseDebt > position.quoteDebt;
    const repayAmount = debtIsBase ? position.baseDebt : position.quoteDebt;
    const coinType = debtIsBase
      ? position.baseAssetType
      : position.quoteAssetType;
    const coinScalar = 1e9;

    await liquidateMutation.mutateAsync({
      managerAddress: position.marginManagerId,
      poolKey: position.poolKey,
      debtIsBase,
      repayAmount,
      coinType,
      coinScalar,
    });

    setIsConfirmOpen(false);
    setSelectedPosition(null);
  };

  return (
    <div class="flex flex-col gap-3 p-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium">Liquidatable Positions</span>
        <Button
          variant="ghost"
          size="sm"
          class="h-6 px-2 text-xs"
          onClick={() => liquidatableQuery.refetch()}
          disabled={liquidatableQuery.isFetching}
        >
          Refresh
        </Button>
      </div>

      <Show
        when={account()}
        fallback={
          <div class="text-muted-foreground py-4 text-center text-sm">
            Connect wallet to view liquidatable positions
          </div>
        }
      >
        <Show
          when={!liquidatableQuery.isLoading}
          fallback={
            <div class="space-y-2">
              <Skeleton class="h-16 w-full" />
              <Skeleton class="h-16 w-full" />
            </div>
          }
        >
          <Show
            when={liquidatableQuery.data && liquidatableQuery.data.length > 0}
            fallback={
              <div class="bg-muted/30 rounded-md p-4 text-center">
                <p class="text-muted-foreground text-sm">
                  No liquidatable positions found
                </p>
                <p class="text-muted-foreground mt-1 text-xs">
                  Positions become liquidatable when their health factor drops
                  below 1.0
                </p>
              </div>
            }
          >
            <div class="space-y-2">
              <For each={liquidatableQuery.data}>
                {(position) => (
                  <div class="bg-muted/30 rounded-md p-3">
                    <div class="flex items-start justify-between">
                      <div class="space-y-1">
                        <div class="text-xs font-medium">
                          {position.baseAssetSymbol}/{position.quoteAssetSymbol}
                        </div>
                        <div class="text-muted-foreground text-xs">
                          {truncateAddress(position.marginManagerId)}
                        </div>
                      </div>
                      <div class="rounded bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-500">
                        {position.riskRatio.toFixed(2)}
                      </div>
                    </div>
                    <div class="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span class="text-muted-foreground">Base Asset:</span>{" "}
                        {position.baseAsset.toFixed(4)}
                      </div>
                      <div>
                        <span class="text-muted-foreground">Base Debt:</span>{" "}
                        <span class="text-red-500">
                          {position.baseDebt.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        <span class="text-muted-foreground">Quote Asset:</span>{" "}
                        {position.quoteAsset.toFixed(4)}
                      </div>
                      <div>
                        <span class="text-muted-foreground">Quote Debt:</span>{" "}
                        <span class="text-red-500">
                          {position.quoteDebt.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <Button
                      class="mt-3 w-full"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleLiquidateClick(position)}
                    >
                      Liquidate
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </Show>
      </Show>

      <Dialog open={isConfirmOpen()} onOpenChange={setIsConfirmOpen}>
        <DialogContent class="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Liquidation</DialogTitle>
            <DialogDescription>
              Are you sure you want to liquidate this position? You will receive
              a liquidation reward for repaying the debt.
            </DialogDescription>
          </DialogHeader>
          <Show when={selectedPosition()}>
            <div class="bg-muted/50 space-y-2 rounded-md p-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Position</span>
                <span>
                  {selectedPosition()!.baseAssetSymbol}/
                  {selectedPosition()!.quoteAssetSymbol}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Risk Ratio</span>
                <span class="text-red-500">
                  {selectedPosition()!.riskRatio.toFixed(4)}
                </span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Debt to Repay</span>
                <span>
                  {selectedPosition()!.baseDebt > selectedPosition()!.quoteDebt
                    ? `${selectedPosition()!.baseDebt.toFixed(4)} ${selectedPosition()!.baseAssetSymbol}`
                    : `${selectedPosition()!.quoteDebt.toFixed(4)} ${selectedPosition()!.quoteAssetSymbol}`}
                </span>
              </div>
            </div>
          </Show>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmLiquidate}
              disabled={liquidateMutation.isPending}
            >
              {liquidateMutation.isPending ? "Liquidating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
