import { Suspense } from "solid-js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OpenOrders } from "@/components/trade/user-orders/open-orders";
import { OrderHistory } from "@/components/trade/user-orders/order-history";
import { UserTradeHistory } from "@/components/trade/user-orders/trade-history";
import { SettledBalance } from "@/components/trade/user-orders/settled-balance";

const TabLoading = () => (
  <div class="text-muted-foreground flex h-full items-center justify-center text-xs">
    Loading...
  </div>
);

export const UserOrders = () => {
  return (
    <div class="flex h-full min-w-fit flex-col overflow-hidden">
      <Tabs
        defaultValue="open-orders"
        class="flex min-h-0 flex-1 flex-col gap-0"
      >
        <TabsList class="bg-background w-full shrink-0 justify-start rounded-none px-4 py-6">
          <TabsTrigger class="data-selected:shadow-none" value="open-orders">
            Open Orders
          </TabsTrigger>
          <TabsTrigger class="data-selected:shadow-none" value="order-history">
            Order History
          </TabsTrigger>
          <TabsTrigger class="data-selected:shadow-none" value="trade-history">
            Trade History
          </TabsTrigger>
          <TabsTrigger
            class="data-selected:shadow-none"
            value="settled-balance"
          >
            Settled Balance
          </TabsTrigger>
        </TabsList>
        <TabsContent
          value="open-orders"
          class="m-0 min-h-0 flex-1 overflow-y-auto"
        >
          <Suspense fallback={<TabLoading />}>
            <OpenOrders />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="order-history"
          class="m-0 min-h-0 flex-1 overflow-y-auto"
        >
          <Suspense fallback={<TabLoading />}>
            <OrderHistory />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="trade-history"
          class="m-0 min-h-0 flex-1 overflow-y-auto"
        >
          <Suspense fallback={<TabLoading />}>
            <UserTradeHistory />
          </Suspense>
        </TabsContent>
        <TabsContent
          value="settled-balance"
          class="m-0 min-h-0 flex-1 overflow-y-auto"
        >
          <Suspense fallback={<TabLoading />}>
            <SettledBalance />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
