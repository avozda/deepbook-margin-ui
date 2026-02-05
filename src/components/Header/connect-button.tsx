import { Show, createMemo, createSignal, For } from "solid-js";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useCurrentWallet,
  useCurrentAccount,
  useWallets,
  useConnectWallet,
  useDisconnectWallet,
} from "@/contexts/dapp-kit";
import { truncateAddress } from "@/lib/utils";

type ConnectButtonProps = {
  connectText?: string;
};

export const ConnectButton = (props: ConnectButtonProps) => {
  const [open, setOpen] = createSignal(false);
  const [copied, setCopied] = createSignal(false);
  const wallet = useCurrentWallet();
  const account = useCurrentAccount();
  const wallets = useWallets();
  const connectWallet = useConnectWallet();
  const disconnectWallet = useDisconnectWallet();

  const displayText = createMemo(() => {
    const acc = account();
    if (acc?.address) {
      return truncateAddress(acc.address);
    }
    return props.connectText || "Connect";
  });

  const handleConnect = async (
    selectedWallet: (typeof wallets extends () => infer T ? T : never)[number]
  ) => {
    await connectWallet({ wallet: selectedWallet });
    setOpen(false);
  };

  const handleCopyAddress = async () => {
    const address = account()?.address;
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
  };

  return (
    <Show
      when={wallet().isConnected}
      fallback={
        <Dialog open={open()} onOpenChange={setOpen}>
          <DialogTrigger as={Button} disabled={wallet().isConnecting}>
            <Show when={wallet().isConnecting} fallback={displayText()}>
              Connecting...
            </Show>
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Connect Wallet</DialogTitle>
              <DialogDescription>
                Select a wallet to connect to this app.
              </DialogDescription>
            </DialogHeader>
            <div class="flex flex-col gap-2">
              <For
                each={wallets()}
                fallback={
                  <p class="text-muted-foreground text-sm">
                    No wallets found. Please install a Sui wallet.
                  </p>
                }
              >
                {(w) => (
                  <Button
                    variant="outline"
                    class="justify-start gap-3"
                    onClick={() => handleConnect(w)}
                  >
                    <Show when={w.icon}>
                      <img src={w.icon} alt={w.name} class="size-6 rounded" />
                    </Show>
                    {w.name}
                  </Button>
                )}
              </For>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger as={Button}>{displayText()}</DropdownMenuTrigger>
        <DropdownMenuContent class="min-w-40">
          <DropdownMenuItem onSelect={handleCopyAddress} class="cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
            {copied() ? "Copied!" : "Copy Address"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleDisconnect}
            variant="destructive"
            class="cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Show>
  );
};
