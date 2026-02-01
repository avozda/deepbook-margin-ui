import { ConnectButton } from "@/components/ConnectButton";
import { Settings } from "@/components/Settings";

export const Nav = () => {
  return (
    <div class="flex w-full items-center justify-between border-b p-4">
      <div class="flex w-full items-center justify-end gap-4">
        <Settings />
        <ConnectButton connectText="Connect" />
      </div>
    </div>
  );
};
