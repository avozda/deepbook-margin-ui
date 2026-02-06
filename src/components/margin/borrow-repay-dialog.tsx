import {
  createSignal,
  createEffect,
  createMemo,
  Show,
  Suspense,
} from "solid-js";
import { useMarginManager } from "@/contexts/margin-manager";
import {
  useBorrow,
  useRepay,
  useHealthFactor,
  useMarginAccountState,
} from "@/hooks/margin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsList,
  TabsContent,
  TabsTrigger,
  TabsIndicator,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrementTrigger,
  NumberFieldIncrementTrigger,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { HealthFactorBar } from "./health-factor-bar";
import { RISK_THRESHOLDS, type HealthStatus } from "@/types/margin";
import type { LoanAction } from "./margin-actions";

type AssetOption = "base" | "quote";

const assetOptions: AssetOption[] = ["base", "quote"];

function calculateHealthStatus(riskRatio: number): HealthStatus {
  if (riskRatio <= RISK_THRESHOLDS.liquidation) {
    return "liquidatable";
  }
  if (riskRatio <= RISK_THRESHOLDS.warning) {
    return "warning";
  }
  return "safe";
}

type BorrowRepayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAction: LoanAction;
};

const BorrowRepayDialog = (props: BorrowRepayDialogProps) => {
  const { hasMarginManager } = useMarginManager();
  const { borrowBase, borrowQuote, isPending: isBorrowPending } = useBorrow();
  const { repayBase, repayQuote, isPending: isRepayPending } = useRepay();
  const healthFactorQuery = useHealthFactor();
  const accountStateQuery = useMarginAccountState();

  const [operationType, setOperationType] = createSignal<LoanAction>(
    props.initialAction
  );
  const [selectedAsset, setSelectedAsset] = createSignal<AssetOption>("quote");
  const [amount, setAmount] = createSignal<number>(0);

  createEffect(() => {
    if (props.open) {
      setOperationType(props.initialAction);
    }
  });

  const getAssetSymbol = (asset: AssetOption): string => {
    const state = accountStateQuery.data;
    if (asset === "base") return state?.baseAssetSymbol ?? "BASE";
    return state?.quoteAssetSymbol ?? "QUOTE";
  };

  const getDebtBalance = (asset: AssetOption): number => {
    const state = accountStateQuery.data;
    if (!state) return 0;
    return asset === "base" ? state.baseDebt : state.quoteDebt;
  };

  const getCollateralBalance = (asset: AssetOption): number => {
    const state = accountStateQuery.data;
    if (!state) return 0;
    return asset === "base" ? state.baseAsset : state.quoteAsset;
  };

  const getTotalCollateralValue = createMemo(() => {
    const state = accountStateQuery.data;
    if (!state) return 0;
    return state.baseAsset + state.quoteAsset;
  });

  const getTotalDebtValue = createMemo(() => {
    const state = accountStateQuery.data;
    if (!state) return 0;
    return state.baseDebt + state.quoteDebt;
  });

  const previewHealthFactor = createMemo(() => {
    const state = accountStateQuery.data;
    const amt = amount();
    if (!state || amt <= 0) {
      return {
        riskRatio: healthFactorQuery.data?.riskRatio ?? Infinity,
        status: healthFactorQuery.data?.status ?? "safe",
        hasChange: false,
      };
    }

    const currentCollateral = getTotalCollateralValue();
    const currentDebt = getTotalDebtValue();

    let newDebt = currentDebt;

    if (operationType() === "borrow") {
      newDebt = currentDebt + amt;
    } else {
      newDebt = Math.max(0, currentDebt - amt);
    }

    if (newDebt === 0) {
      return {
        riskRatio: Infinity,
        status: "safe" as HealthStatus,
        hasChange: true,
      };
    }

    const newRiskRatio = currentCollateral / newDebt;
    return {
      riskRatio: newRiskRatio,
      status: calculateHealthStatus(newRiskRatio),
      hasChange: true,
    };
  });

  const maxBorrowAmount = createMemo(() => {
    const collateral = getTotalCollateralValue();
    const currentDebt = getTotalDebtValue();

    const maxDebtForSafety = collateral / RISK_THRESHOLDS.borrowMin;
    const availableToBorrow = Math.max(0, maxDebtForSafety - currentDebt);

    return availableToBorrow;
  });

  createEffect(() => {
    if (props.open) {
      healthFactorQuery.refetch();
      accountStateQuery.refetch();
    }
  });

  const handleBorrow = async () => {
    const asset = selectedAsset();
    const amt = amount();

    if (asset === "base") {
      await borrowBase.mutateAsync(amt);
    } else {
      await borrowQuote.mutateAsync(amt);
    }

    setAmount(0);
    props.onOpenChange(false);
  };

  const handleRepay = async () => {
    const asset = selectedAsset();
    const amt = amount();

    if (asset === "base") {
      await repayBase.mutateAsync(amt);
    } else {
      await repayQuote.mutateAsync(amt);
    }

    setAmount(0);
    props.onOpenChange(false);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (operationType() === "borrow") {
      await handleBorrow();
    } else {
      await handleRepay();
    }
  };

  const isValidAmount = () => {
    const amt = amount();
    if (amt <= 0) return false;

    if (operationType() === "repay") {
      const debt = getDebtBalance(selectedAsset());
      const collateral = getCollateralBalance(selectedAsset());
      return amt <= debt && amt <= collateral;
    }

    return true;
  };

  const isSubmitting = () => isBorrowPending() || isRepayPending();

  return (
    <Show when={hasMarginManager()}>
      <Dialog open={props.open} onOpenChange={props.onOpenChange}>
        <DialogContent class="w-screen max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Loans</DialogTitle>
          </DialogHeader>
          <Tabs
            class="mt-4"
            value={operationType()}
            onChange={(value) => setOperationType(value as LoanAction)}
          >
            <TabsList class="grid w-full grid-cols-2">
              <TabsIndicator />
              <TabsTrigger value="borrow">Borrow</TabsTrigger>
              <TabsTrigger value="repay">Repay</TabsTrigger>
            </TabsList>
            <TabsContent value="borrow">
              <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Asset</label>
                  <Select
                    options={assetOptions}
                    optionValue={(item) => item}
                    optionTextValue={(item) => getAssetSymbol(item)}
                    value={selectedAsset()}
                    onChange={(value) => value && setSelectedAsset(value)}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>
                        {getAssetSymbol(props.item.rawValue)}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue<AssetOption>>
                        {(state) => getAssetSymbol(state.selectedOption())}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Amount</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="h-6 px-2 text-xs"
                      onClick={() => setAmount(maxBorrowAmount())}
                      disabled={maxBorrowAmount() <= 0}
                    >
                      Max ({maxBorrowAmount().toFixed(2)})
                    </Button>
                  </div>
                  <NumberField
                    rawValue={amount()}
                    onRawValueChange={(value) => setAmount(value || 0)}
                    minValue={0}
                    formatOptions={{ maximumFractionDigits: 20 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger />
                      <NumberFieldInput
                        class="py-6 text-2xl shadow-none"
                        placeholder="0.00"
                      />
                      <NumberFieldIncrementTrigger />
                    </NumberFieldGroup>
                  </NumberField>
                </div>

                <div class="bg-muted/50 space-y-2 rounded-md p-3">
                  <div class="text-sm font-medium">Current Position</div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Collateral</span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {getCollateralBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Current Debt</span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span class="text-red-500">
                          {getDebtBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-sm font-medium">Health Factor</div>
                  <HealthFactorBar
                    riskRatio={healthFactorQuery.data?.riskRatio ?? Infinity}
                    status={healthFactorQuery.data?.status ?? "safe"}
                    isLoading={healthFactorQuery.isLoading}
                  />
                  <Show when={previewHealthFactor().hasChange && amount() > 0}>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="text-muted-foreground text-xs">After:</span>
                      <HealthFactorBar
                        riskRatio={previewHealthFactor().riskRatio}
                        status={previewHealthFactor().status}
                        class="flex-1"
                      />
                    </div>
                    <Show
                      when={
                        previewHealthFactor().riskRatio <=
                        RISK_THRESHOLDS.warning
                      }
                    >
                      <p class="text-xs text-yellow-500">
                        Warning: This will put your position at risk
                      </p>
                    </Show>
                  </Show>
                </div>

                <p class="text-muted-foreground text-xs">
                  Borrowing will decrease your health factor. Ensure you
                  maintain a safe ratio to avoid liquidation.
                </p>

                <Button
                  type="submit"
                  class="w-full"
                  disabled={!isValidAmount() || isSubmitting()}
                >
                  {isSubmitting()
                    ? "Borrowing..."
                    : `Borrow ${getAssetSymbol(selectedAsset())}`}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="repay">
              <form class="mt-4 space-y-4" onSubmit={handleSubmit}>
                <div class="space-y-2">
                  <label class="text-sm font-medium">Asset</label>
                  <Select
                    options={assetOptions}
                    optionValue={(item) => item}
                    optionTextValue={(item) => getAssetSymbol(item)}
                    value={selectedAsset()}
                    onChange={(value) => value && setSelectedAsset(value)}
                    itemComponent={(props) => (
                      <SelectItem item={props.item}>
                        {getAssetSymbol(props.item.rawValue)}
                      </SelectItem>
                    )}
                  >
                    <SelectTrigger class="w-full">
                      <SelectValue<AssetOption>>
                        {(state) => getAssetSymbol(state.selectedOption())}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                  </Select>
                </div>
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Amount</label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="h-6 px-2 text-xs"
                      onClick={() => setAmount(getDebtBalance(selectedAsset()))}
                    >
                      Max
                    </Button>
                  </div>
                  <NumberField
                    rawValue={amount()}
                    onRawValueChange={(value) => setAmount(value || 0)}
                    minValue={0}
                    formatOptions={{ maximumFractionDigits: 20 }}
                  >
                    <NumberFieldGroup>
                      <NumberFieldDecrementTrigger />
                      <NumberFieldInput
                        class="py-6 text-2xl shadow-none"
                        placeholder="0.00"
                      />
                      <NumberFieldIncrementTrigger />
                    </NumberFieldGroup>
                  </NumberField>
                </div>

                <div class="bg-muted/50 space-y-2 rounded-md p-3">
                  <div class="text-sm font-medium">Current Position</div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">Current Debt</span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span class="text-red-500">
                          {getDebtBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-muted-foreground">
                      Collateral (for repayment)
                    </span>
                    <Suspense fallback={<Skeleton class="h-4 w-16" />}>
                      <Show
                        when={!accountStateQuery.isLoading}
                        fallback={<Skeleton class="h-4 w-16" />}
                      >
                        <span>
                          {getCollateralBalance(selectedAsset()).toFixed(4)}{" "}
                          {getAssetSymbol(selectedAsset())}
                        </span>
                      </Show>
                    </Suspense>
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-sm font-medium">Health Factor</div>
                  <HealthFactorBar
                    riskRatio={healthFactorQuery.data?.riskRatio ?? Infinity}
                    status={healthFactorQuery.data?.status ?? "safe"}
                    isLoading={healthFactorQuery.isLoading}
                  />
                  <Show when={previewHealthFactor().hasChange && amount() > 0}>
                    <div class="mt-2 flex items-center gap-2">
                      <span class="text-muted-foreground text-xs">After:</span>
                      <HealthFactorBar
                        riskRatio={previewHealthFactor().riskRatio}
                        status={previewHealthFactor().status}
                        class="flex-1"
                      />
                    </div>
                  </Show>
                </div>

                <p class="text-muted-foreground text-xs">
                  Repaying debt will improve your health factor and reduce
                  liquidation risk.
                </p>

                <Button
                  type="submit"
                  class="w-full"
                  disabled={!isValidAmount() || isSubmitting()}
                >
                  {isSubmitting()
                    ? "Repaying..."
                    : `Repay ${getAssetSymbol(selectedAsset())}`}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </Show>
  );
};

export default BorrowRepayDialog;
