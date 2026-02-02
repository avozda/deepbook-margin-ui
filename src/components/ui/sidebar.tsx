import {
  createContext,
  useContext,
  createSignal,
  type JSX,
  type Accessor,
  type Setter,
  splitProps,
  type ComponentProps,
  Show,
} from "solid-js";
import { PanelLeft } from "lucide-solid";

import { cx } from "@/lib/cva";
import { Button } from "@/components/ui/button";

type SidebarContextValue = {
  expanded: Accessor<boolean>;
  setExpanded: Setter<boolean>;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue>();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

type SidebarProviderProps = {
  children: JSX.Element;
  defaultExpanded?: boolean;
};

export const SidebarProvider = (props: SidebarProviderProps) => {
  const [expanded, setExpanded] = createSignal(props.defaultExpanded ?? false);

  const toggle = () => setExpanded((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ expanded, setExpanded, toggle }}>
      {props.children}
    </SidebarContext.Provider>
  );
};

type SidebarProps = ComponentProps<"aside"> & {
  collapsedWidth?: string;
  expandedWidth?: string;
};

export const Sidebar = (props: SidebarProps) => {
  const [local, rest] = splitProps(props, [
    "class",
    "children",
    "collapsedWidth",
    "expandedWidth",
  ]);
  const { expanded } = useSidebar();

  const collapsedW = () => local.collapsedWidth ?? "0px";
  const expandedW = () => local.expandedWidth ?? "280px";

  return (
    <aside
      data-slot="sidebar"
      data-expanded={expanded() ? "" : undefined}
      data-collapsed={!expanded() ? "" : undefined}
      class={cx(
        "bg-background border-r transition-all duration-300 ease-in-out",
        "flex h-full flex-col overflow-hidden",
        local.class
      )}
      style={{
        width: expanded() ? expandedW() : collapsedW(),
        "min-width": expanded() ? expandedW() : collapsedW(),
      }}
      {...rest}
    >
      {local.children}
    </aside>
  );
};

type SidebarTriggerProps = ComponentProps<typeof Button>;

export const SidebarTrigger = (props: SidebarTriggerProps) => {
  const [local, rest] = splitProps(props, ["class", "children", "onClick"]);
  const { toggle } = useSidebar();

  return (
    <Button
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      class={cx(local.class)}
      onClick={(e) => {
        toggle();
        if (typeof local.onClick === "function") {
          local.onClick(e);
        }
      }}
      {...rest}
    >
      <Show when={local.children} fallback={<PanelLeft class="size-5" />}>
        {local.children}
      </Show>
    </Button>
  );
};

type SidebarHeaderProps = ComponentProps<"div">;

export const SidebarHeader = (props: SidebarHeaderProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="sidebar-header"
      class={cx("flex items-center gap-2 p-4", local.class)}
      {...rest}
    />
  );
};

type SidebarContentProps = ComponentProps<"div">;

export const SidebarContent = (props: SidebarContentProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="sidebar-content"
      class={cx("flex-1 overflow-auto p-4", local.class)}
      {...rest}
    />
  );
};

type SidebarFooterProps = ComponentProps<"div">;

export const SidebarFooter = (props: SidebarFooterProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="sidebar-footer"
      class={cx("mt-auto p-4", local.class)}
      {...rest}
    />
  );
};

type SidebarGroupProps = ComponentProps<"div">;

export const SidebarGroup = (props: SidebarGroupProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="sidebar-group"
      class={cx("flex flex-col gap-1", local.class)}
      {...rest}
    />
  );
};

type SidebarGroupLabelProps = ComponentProps<"div">;

export const SidebarGroupLabel = (props: SidebarGroupLabelProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <div
      data-slot="sidebar-group-label"
      class={cx(
        "text-muted-foreground mb-1 truncate px-2 text-xs font-medium",
        local.class
      )}
      {...rest}
    />
  );
};

type SidebarItemProps = ComponentProps<"button"> & {
  active?: boolean;
};

export const SidebarItem = (props: SidebarItemProps) => {
  const [local, rest] = splitProps(props, ["class", "active"]);

  return (
    <button
      data-slot="sidebar-item"
      data-active={local.active ? "" : undefined}
      class={cx(
        "hover:bg-accent hover:text-accent-foreground flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
        "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
        "data-active:bg-accent data-active:text-accent-foreground",
        local.class
      )}
      {...rest}
    />
  );
};

type SidebarOverlayProps = ComponentProps<"div">;

export const SidebarOverlay = (props: SidebarOverlayProps) => {
  const [local, rest] = splitProps(props, ["class", "onClick"]);
  const { expanded, setExpanded } = useSidebar();

  return (
    <Show when={expanded()}>
      <div
        data-slot="sidebar-overlay"
        class={cx(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          local.class
        )}
        onClick={(e) => {
          setExpanded(false);
          if (typeof local.onClick === "function") {
            local.onClick(e);
          }
        }}
        {...rest}
      />
    </Show>
  );
};
