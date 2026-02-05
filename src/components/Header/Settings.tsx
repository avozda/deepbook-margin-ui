import { Settings as SettingsIcon, Sun, Moon } from "lucide-solid";
import { useColorMode } from "@kobalte/core";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Switch,
  SwitchControl,
  SwitchInput,
  SwitchThumb,
} from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
  RadioGroupItemControl,
  RadioGroupItemIndicator,
  RadioGroupItemInput,
  RadioGroupItemLabel,
} from "@/components/ui/radio-group";
import { useCurrentNetwork, useSwitchNetwork } from "@/contexts/dapp-kit";

const SettingsContent = () => {
  const { colorMode, setColorMode } = useColorMode();
  const network = useCurrentNetwork();
  const switchNetwork = useSwitchNetwork();

  const handleThemeToggle = (checked: boolean) => {
    setColorMode(checked ? "dark" : "light");
  };

  const handleNetworkChange = (value: string) => {
    if (value === "mainnet" || value === "testnet") {
      switchNetwork(value);
    }
  };

  return (
    <div class="flex flex-col gap-4">
      <div class="border-b pb-6">
        <h2 class="text-sm font-medium">Theme</h2>
        <p class="text-muted-foreground pb-4 text-xs">
          Change the theme of the application
        </p>
        <div class="flex items-center gap-2">
          <Sun class="size-4" />
          <Switch
            checked={colorMode() === "dark"}
            onChange={handleThemeToggle}
            aria-label="Toggle theme"
          >
            <SwitchInput />
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
          <Moon class="size-4" />
        </div>
      </div>
      <div>
        <h2 class="pb-2 text-sm font-medium">Network</h2>
        <RadioGroup value={network()} onChange={handleNetworkChange}>
          <RadioGroupItem value="mainnet">
            <RadioGroupItemInput />
            <RadioGroupItemControl>
              <RadioGroupItemIndicator />
            </RadioGroupItemControl>
            <RadioGroupItemLabel>Mainnet</RadioGroupItemLabel>
          </RadioGroupItem>
          <RadioGroupItem value="testnet">
            <RadioGroupItemInput />
            <RadioGroupItemControl>
              <RadioGroupItemIndicator />
            </RadioGroupItemControl>
            <RadioGroupItemLabel>Testnet</RadioGroupItemLabel>
          </RadioGroupItem>
        </RadioGroup>
      </div>
    </div>
  );
};

export const Settings = () => {
  return (
    <Dialog>
      <DialogTrigger
        as={Button}
        variant="ghost"
        size="icon"
        aria-label="Settings"
      >
        <SettingsIcon class="size-5" stroke-width={1.5} />
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Configure your preferences.</DialogDescription>
        </DialogHeader>
        <SettingsContent />
      </DialogContent>
    </Dialog>
  );
};
