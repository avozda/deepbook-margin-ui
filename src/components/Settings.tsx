import { Settings as SettingsIcon } from "lucide-solid";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your preferences.
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4">
          <p class="text-muted-foreground text-sm">
            Settings content coming soon...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
