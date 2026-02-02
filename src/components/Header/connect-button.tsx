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

  const handleClick = () => {
    if (wallet().isConnected) {
      disconnectWallet();
    }
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
      <Button onClick={handleClick}>{displayText()}</Button>
    </Show>
  );
};
