import { Home, Settings as SettingsIcon, Wallet } from "lucide-solid";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarItem,
  SidebarOverlay,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const PairTableTrigger = SidebarTrigger;

export const PairTable = () => {
  return (
    <>
      <SidebarOverlay />
      <Sidebar class="fixed z-50 md:relative">
        <SidebarHeader>
          <span class="text-lg font-semibold">DeepBook</span>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarItem active>
              <Home class="size-4" />
              <span>Dashboard</span>
            </SidebarItem>
            <SidebarItem>
              <Wallet class="size-4" />
              <span>Portfolio</span>
            </SidebarItem>
            <SidebarItem>
              <SettingsIcon class="size-4" />
              <span>Settings</span>
            </SidebarItem>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </>
  );
};
