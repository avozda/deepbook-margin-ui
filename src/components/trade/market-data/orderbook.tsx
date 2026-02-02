import { createSignal, createMemo, For, Show, createEffect } from "solid-js";
import { useColorMode } from "@kobalte/core";
import { useCurrentPool } from "@/contexts/pool";
import { useOrderbook, type OrderbookEntry } from "@/hooks/market/useOrderbook";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type OrderbookEntriesProps = {
  entries: OrderbookEntry[];
  type: "ask" | "bid";
};

const OrderbookEntries = (props: OrderbookEntriesProps) => {
  const { colorMode } = useColorMode();
  const { pool } = useCurrentPool();
  const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);

  const textColor = () =>
    props.type === "ask" ? "text-[#ef5350]" : "text-[#26a69a]";
  const bgColor = () =>
    props.type === "ask" ? "rgba(239, 83, 80, 0.3)" : "rgba(38, 166, 154, 0.3)";

  const aggregateData = createMemo(() => {
    const result: {
      amount: number;
      value: number;
      averagePrice: number;
    }[] = [];
    props.entries.reduce(
      (acc, entry) => {
        acc.amount += entry.amount;
        acc.value += entry.amount * entry.price;
        result.push({
          ...acc,
          averagePrice: acc.value / acc.amount,
        });
        return acc;
      },
      { amount: 0, value: 0 }
    );
    return props.type === "ask" ? result.reverse() : result;
  });

  const maxAmount = createMemo(() =>
    Math.max(...props.entries.map((entry) => entry.amount))
  );

  const displayedEntries = createMemo(() =>
    props.type === "ask" ? [...props.entries].reverse() : props.entries
  );

  return (
    <For each={displayedEntries()}>
      {(entry, index) => {
        const barWidth = () => (entry.amount / maxAmount()) * 100;
        const highlighted = () => {
          const hovered = hoveredIndex();
          if (hovered === null) return false;
          return props.type === "ask" ? hovered <= index() : hovered >= index();
        };

        return (
          <Tooltip placement="left">
            <TooltipTrigger
              as="tr"
              class="h-6 w-full text-right"
              onMouseEnter={() => setHoveredIndex(index())}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                width: "100%",
                "background-image": `linear-gradient(to right,${bgColor()} ${barWidth()}%,transparent ${barWidth()}%)`,
                "background-color": highlighted()
                  ? colorMode() === "dark"
                    ? "rgba(255,255,255, 0.1)"
                    : "rgba(0,0,0, 0.05)"
                  : "",
              }}
            >
              <td class="pr-2 pl-2">{entry.amount}</td>
              <td class={`pr-2 ${textColor()}`}>{entry.price.toFixed(5)}</td>
            </TooltipTrigger>
            <TooltipContent>
              <div class="flex w-full justify-between gap-2">
                <p>Average Price:</p>
                <p>{aggregateData()[index()].averagePrice.toFixed(5)}</p>
              </div>
              <div class="flex w-full justify-between gap-2">
                <p>{`Sum ${pool().base_asset_symbol}:`}</p>
                <p>{aggregateData()[index()].amount}</p>
              </div>
              <div class="flex w-full justify-between gap-2">
                <p>{`Sum ${pool().quote_asset_symbol}:`}</p>
                <p>{aggregateData()[index()].value.toFixed(5)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      }}
    </For>
  );
};

export const OrderBook = () => {
  const { pool } = useCurrentPool();
  const orderbookQuery = useOrderbook();
  let spreadRowRef: HTMLTableRowElement | undefined;
  let tableContainerRef: HTMLDivElement | undefined;

  const scrollToSpread = () => {
    if (!spreadRowRef || !tableContainerRef) return;

    const container = tableContainerRef;
    const spreadRow = spreadRowRef;
    const containerHeight = container.clientHeight;
    const spreadRowTop = spreadRow.offsetTop;
    const spreadRowHeight = spreadRow.clientHeight;

    const scrollPosition =
      spreadRowTop - containerHeight / 2 + spreadRowHeight / 2;

    container.scrollTop = scrollPosition;
  };

  createEffect(() => {
    if (!orderbookQuery.data) return;
    setTimeout(scrollToSpread, 0);
  });

  return (
    <Show when={!orderbookQuery.isLoading} fallback={<div></div>}>
      <Show when={orderbookQuery.data} fallback={<div>Error</div>}>
        {(data) => (
          <div
            ref={tableContainerRef}
            class="h-full overflow-y-auto font-mono text-xs"
          >
            <table
              class="w-full table-fixed"
              style={{ "table-layout": "fixed" }}
            >
              <colgroup>
                <col style={{ width: "50%" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <thead class="bg-background text-muted-foreground sticky top-0 z-10 border-b text-right text-[10px] uppercase">
                <tr class="h-6">
                  <th class="pr-2 pl-2 font-medium whitespace-nowrap">{`Amt (${pool().base_asset_symbol})`}</th>
                  <th class="pr-2 font-medium whitespace-nowrap">{`Price (${pool().quote_asset_symbol})`}</th>
                </tr>
              </thead>
              <tbody class="text-right">
                <OrderbookEntries entries={data().asks} type="ask" />
                <tr class="border-y" ref={spreadRowRef}>
                  <td class="h-6 pr-2 pl-2 text-right">
                    <span class="text-muted-foreground">SPREAD</span>
                  </td>
                  <td class="h-6 pr-2 text-right">
                    {data().spreadAmount.toFixed(5)}
                  </td>
                </tr>
                <OrderbookEntries entries={data().bids} type="bid" />
              </tbody>
            </table>
          </div>
        )}
      </Show>
    </Show>
  );
};
