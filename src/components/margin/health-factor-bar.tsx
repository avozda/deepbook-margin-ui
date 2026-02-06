import { createMemo, Show } from "solid-js";
import { cx } from "@/lib/cva";
import { RISK_THRESHOLDS, type HealthStatus } from "@/types/margin";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HealthFactorBarProps = {
  riskRatio: number;
  status: HealthStatus;
  isLoading?: boolean;
  showValue?: boolean;
  class?: string;
};

const getStatusColor = (status: HealthStatus): string => {
  switch (status) {
    case "safe":
      return "bg-green-500";
    case "warning":
      return "bg-yellow-500";
    case "liquidatable":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusTextColor = (status: HealthStatus): string => {
  switch (status) {
    case "safe":
      return "text-green-500";
    case "warning":
      return "text-yellow-500";
    case "liquidatable":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

const getStatusLabel = (status: HealthStatus): string => {
  switch (status) {
    case "safe":
      return "Safe";
    case "warning":
      return "Warning";
    case "liquidatable":
      return "At Risk";
    default:
      return "Unknown";
  }
};

export const HealthFactorBar = (props: HealthFactorBarProps) => {
  const percentage = createMemo(() => {
    const ratio = props.riskRatio;
    if (ratio === Infinity || ratio > 3) return 100;
    if (ratio <= RISK_THRESHOLDS.liquidation) return 0;
    return Math.min(100, Math.max(0, ((ratio - 1) / 2) * 100));
  });

  const displayValue = createMemo(() => {
    if (props.riskRatio === Infinity) return "---";
    return props.riskRatio.toFixed(2);
  });

  return (
    <div class={cx("flex flex-col gap-1", props.class)}>
      <Show when={props.isLoading}>
        <Skeleton class="h-4 w-full" />
        <Skeleton class="h-2 w-full" />
      </Show>
      <Show when={!props.isLoading}>
        <div class="flex items-center justify-between text-xs">
          <Tooltip>
            <TooltipTrigger class="flex items-center gap-1.5">
              <span class="text-muted-foreground">Health Factor</span>
              <span
                class={cx(
                  "rounded px-1.5 py-0.5 text-xs font-medium",
                  props.status === "safe" && "bg-green-500/10 text-green-500",
                  props.status === "warning" &&
                    "bg-yellow-500/10 text-yellow-500",
                  props.status === "liquidatable" &&
                    "bg-red-500/10 text-red-500"
                )}
              >
                {getStatusLabel(props.status)}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <div class="space-y-1 text-xs">
                <p>Risk Ratio: {displayValue()}</p>
                <p>Liquidation at: {RISK_THRESHOLDS.liquidation}</p>
                <p>Warning at: {RISK_THRESHOLDS.warning}</p>
              </div>
            </TooltipContent>
          </Tooltip>
          <Show when={props.showValue !== false}>
            <span class={getStatusTextColor(props.status)}>
              {displayValue()}
            </span>
          </Show>
        </div>
        <div class="bg-muted relative h-2 w-full overflow-hidden rounded-full">
          <div class="absolute inset-0 flex">
            <div class="h-full w-1/3 bg-red-500/20" />
            <div class="h-full w-1/3 bg-yellow-500/20" />
            <div class="h-full w-1/3 bg-green-500/20" />
          </div>
          <div
            class={cx(
              "absolute top-0 left-0 h-full transition-all duration-300",
              getStatusColor(props.status)
            )}
            style={{ width: `${percentage()}%` }}
          />
          <div
            class="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: "33.33%" }}
          />
          <div
            class="absolute top-0 h-full w-0.5 bg-white/50"
            style={{ left: "66.66%" }}
          />
        </div>
      </Show>
    </div>
  );
};

export const HealthFactorBadge = (props: {
  status: HealthStatus;
  class?: string;
}) => {
  return (
    <span
      class={cx(
        "inline-flex items-center rounded px-2 py-0.5 text-xs font-medium",
        props.status === "safe" && "bg-green-500/10 text-green-500",
        props.status === "warning" && "bg-yellow-500/10 text-yellow-500",
        props.status === "liquidatable" && "bg-red-500/10 text-red-500",
        props.class
      )}
    >
      {getStatusLabel(props.status)}
    </span>
  );
};
