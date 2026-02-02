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
    <div class="h-full min-w-fit">
      <Tabs defaultValue="open-orders" class="flex h-full flex-col">
        <TabsList class="bg-background w-full justify-start rounded-none px-4 py-6">
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
        <TabsContent value="open-orders" class="m-0 flex-1 overflow-hidden">
          <Suspense fallback={<TabLoading />}>
            <OpenOrders />
          </Suspense>
        </TabsContent>
        <TabsContent value="order-history" class="m-0 flex-1 overflow-hidden">
          <Suspense fallback={<TabLoading />}>
            <OrderHistory />
          </Suspense>
        </TabsContent>
        <TabsContent value="trade-history" class="m-0 flex-1 overflow-hidden">
          <Suspense fallback={<TabLoading />}>
            <UserTradeHistory />
          </Suspense>
        </TabsContent>
        <TabsContent value="settled-balance" class="m-0 flex-1 overflow-hidden">
          <Suspense fallback={<TabLoading />}>
            <SettledBalance />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
};
