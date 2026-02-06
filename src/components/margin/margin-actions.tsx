import { createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import CollateralManagerDialog from "./collateral-manager-dialog";
import BorrowRepayDialog from "./borrow-repay-dialog";

export type CollateralAction = "deposit" | "withdraw";
export type LoanAction = "borrow" | "repay";

const MarginActions = () => {
  const [collateralOpen, setCollateralOpen] = createSignal(false);
  const [collateralAction, setCollateralAction] =
    createSignal<CollateralAction>("deposit");
  const [loanOpen, setLoanOpen] = createSignal(false);
  const [loanAction, setLoanAction] = createSignal<LoanAction>("borrow");

  return (
    <div class="grid grid-cols-2 gap-2 px-3 pb-3">
      <Button
        variant="outline"
        size="sm"
        class="h-8 text-xs"
        onClick={() => {
          setCollateralAction("deposit");
          setCollateralOpen(true);
        }}
      >
        Deposit
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 text-xs"
        onClick={() => {
          setCollateralAction("withdraw");
          setCollateralOpen(true);
        }}
      >
        Withdraw
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 text-xs"
        onClick={() => {
          setLoanAction("borrow");
          setLoanOpen(true);
        }}
      >
        Borrow
      </Button>
      <Button
        variant="outline"
        size="sm"
        class="h-8 text-xs"
        onClick={() => {
          setLoanAction("repay");
          setLoanOpen(true);
        }}
      >
        Repay
      </Button>

      <CollateralManagerDialog
        open={collateralOpen()}
        onOpenChange={setCollateralOpen}
        initialAction={collateralAction()}
      />
      <BorrowRepayDialog
        open={loanOpen()}
        onOpenChange={setLoanOpen}
        initialAction={loanAction()}
      />
    </div>
  );
};

export default MarginActions;
