import { createSignal } from "solid-js";
import { Settings as SettingsIcon, Sun, Moon, Copy } from "lucide-solid";
import { useColorMode } from "@kobalte/core";
import { createForm } from "@tanstack/solid-form";
import { z } from "zod";
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
import {
  TextField,
  TextFieldInput,
  TextFieldErrorMessage,
} from "@/components/ui/text-field";
import {
  useCurrentAccount,
  useCurrentNetwork,
  useSwitchNetwork,
  useSuiClient,
} from "@/contexts/dapp-kit";
import { useBalanceManager } from "@/contexts/balance-manager";
import { mainnetPackageIds, testnetPackageIds } from "@/constants/deepbook";

const balanceManagerSchema = z.object({
  balanceManagerAddress: z
    .string()
    .min(1, "Manager address is required")
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid Sui address format"),
});

const ImportBalanceManagerForm = () => {
  const network = useCurrentNetwork();
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { setBalanceManager } = useBalanceManager();
  const [submitError, setSubmitError] = createSignal<string | null>(null);

  const form = createForm(() => ({
    defaultValues: {
      balanceManagerAddress: "",
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const parseResult = balanceManagerSchema.safeParse(value);
      if (!parseResult.success) {
        return;
      }

      const res = await suiClient().getObject({
        id: value.balanceManagerAddress,
        options: {
          showType: true,
          showContent: true,
        },
      });

      if (!res || res?.error) {
        setSubmitError(
          `Failed to import: ${res?.error?.code || "Object not found"}`
        );
        return;
      }

      const expectedType = `${
        network() === "testnet"
          ? testnetPackageIds.DEEPBOOK_PACKAGE_ID
          : mainnetPackageIds.DEEPBOOK_PACKAGE_ID
      }::balance_manager::BalanceManager`;

      if (res.data?.type !== expectedType) {
        setSubmitError("This address is not a valid balance manager");
        return;
      }

      const content = res.data?.content as {
        fields?: { owner?: string };
      } | null;
      if (content?.fields?.owner !== account()?.address) {
        setSubmitError("You don't own this balance manager");
        return;
      }

      setBalanceManager(value.balanceManagerAddress);
    },
  }));

  const addressErrors = () => {
    const fieldState = form.useStore((state) => state.fieldMeta);
    const meta = fieldState().balanceManagerAddress;
    const errors: { message: string }[] = [];

    if (meta?.isTouched && meta?.errors?.length) {
      errors.push(...meta.errors.map((e) => ({ message: String(e) })));
    }

    const error = submitError();
    if (error) {
      errors.push({ message: error });
    }

    return errors;
  };

  return (
    <form
      class="flex flex-row gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field
        name="balanceManagerAddress"
        validators={{
          onChange: ({ value }) => {
            const result =
              balanceManagerSchema.shape.balanceManagerAddress.safeParse(value);
            return result.success ? undefined : result.error.issues[0]?.message;
          },
        }}
      >
        {(field) => (
          <TextField
            class="grow"
            value={field().state.value}
            onChange={(value: string) => {
              setSubmitError(null);
              field().handleChange(value);
            }}
            onBlur={() => field().handleBlur()}
            validationState={addressErrors().length > 0 ? "invalid" : "valid"}
          >
            <TextFieldInput placeholder="0x..." />
            <TextFieldErrorMessage errors={addressErrors()} />
          </TextField>
        )}
      </form.Field>
      <Button type="submit" variant="outline">
        Import
      </Button>
    </form>
  );
};

const SettingsContent = () => {
  const { colorMode, setColorMode } = useColorMode();
  const network = useCurrentNetwork();
  const switchNetwork = useSwitchNetwork();
  const { balanceManagerAddress } = useBalanceManager();

  const handleThemeToggle = (checked: boolean) => {
    setColorMode(checked ? "dark" : "light");
  };

  const handleNetworkChange = (value: string) => {
    if (value === "mainnet" || value === "testnet") {
      switchNetwork(value);
    }
  };

  const handleCopy = () => {
    const address = balanceManagerAddress();
    if (address) {
      navigator.clipboard.writeText(address);
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
      <div class="border-b pb-6">
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
      <div>
        <h2 class="pb-2 text-sm font-medium">Import balance manager</h2>
        <ImportBalanceManagerForm />
        <h2 class="pt-4 pb-2 text-sm font-medium">Export balance manager</h2>
        <div class="flex gap-2">
          <TextField class="grow" disabled>
            <TextFieldInput
              class="truncate"
              value={balanceManagerAddress() || "No balance manager"}
              readOnly
            />
          </TextField>
          <Button
            disabled={!balanceManagerAddress()}
            variant="outline"
            size="icon"
            onClick={handleCopy}
          >
            <Copy class="size-4" />
          </Button>
        </div>
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
