import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderBook } from "./orderbook";
import { TradeHistory } from "./trade-history";

export const MarketData = () => {
  return (
    <Tabs defaultValue="orderbook" class="flex h-full flex-col">
      <TabsList class="h-10 w-full shrink-0 justify-center gap-4 rounded-none border-b bg-transparent p-0 ring-0">
        <TabsTrigger
          value="orderbook"
          class="h-full min-w-min rounded-none px-0 text-sm font-medium shadow-none data-selected:shadow-none"
        >
          Order book
        </TabsTrigger>
        <TabsTrigger
          value="trade-history"
          class="h-full min-w-min rounded-none px-0 text-sm font-medium shadow-none data-selected:shadow-none"
        >
          Trade history
        </TabsTrigger>
      </TabsList>
      <TabsContent value="orderbook" class="m-0 min-h-0 flex-1 overflow-hidden">
        <OrderBook />
      </TabsContent>
      <TabsContent
        value="trade-history"
        class="m-0 min-h-0 flex-1 overflow-hidden"
      >
        <TradeHistory />
      </TabsContent>
    </Tabs>
  );
};
