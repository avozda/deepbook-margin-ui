import { ConnectButton } from "@/components/header/connect-button";
import { Settings } from "@/components/header/settings";
import { PairTableTrigger } from "@/components/header/pair-table";

export const Nav = () => {
  return (
    <div class="flex w-full items-center justify-between border-b p-4">
      <div class="flex items-center gap-4">
        <PairTableTrigger />
      </div>
      <div class="flex items-center gap-4">
        <Settings />
        <ConnectButton connectText="Connect" />
      </div>
    </div>
  );
};
