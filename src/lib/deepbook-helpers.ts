import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/sui/bcs";
import type { DeepBookClient } from "@mysten/deepbook-v3";

type SuiClientLike = {
  simulateTransaction: (args: {
    transaction: Uint8Array;
    options?: { showRawEffects?: boolean };
  }) => Promise<any>;
};

const VecSet = (inner: ReturnType<typeof bcs.u128>) =>
  bcs.struct(`VecSet<${inner.name}>`, {
    contents: bcs.vector(inner),
  });

const Account = bcs.struct("Account", {
  epoch: bcs.u64(),
  open_orders: VecSet(bcs.u128()),
  taker_volume: bcs.u128(),
  maker_volume: bcs.u128(),
  active_stake: bcs.u64(),
  inactive_stake: bcs.u64(),
  created_proposal: bcs.bool(),
  voted_proposal: bcs.option(bcs.u64()),
  unclaimed_rebates: bcs.struct("Balances", {
    base: bcs.u64(),
    quote: bcs.u64(),
    deep: bcs.u64(),
  }),
  settled_balances: bcs.struct("Balances2", {
    base: bcs.u64(),
    quote: bcs.u64(),
    deep: bcs.u64(),
  }),
  owed_balances: bcs.struct("Balances3", {
    base: bcs.u64(),
    quote: bcs.u64(),
    deep: bcs.u64(),
  }),
});

const DEEP_SCALAR = 1_000_000;

export type AccountInfo = {
  epoch: string;
  open_orders: { contents: string[] };
  taker_volume: number;
  maker_volume: number;
  active_stake: number;
  inactive_stake: number;
  created_proposal: boolean;
  voted_proposal: string | null;
  unclaimed_rebates: { base: number; quote: number; deep: number };
  settled_balances: { base: number; quote: number; deep: number };
  owed_balances: { base: number; quote: number; deep: number };
};

export async function getAccount(
  suiClient: SuiClientLike,
  dbClient: DeepBookClient,
  poolKey: string,
  senderAddress: string,
  baseScalar: number,
  quoteScalar: number
): Promise<AccountInfo | null> {
  const tx = new Transaction();
  tx.setSenderIfNotSet(senderAddress);
  dbClient.deepBook.account(poolKey, "MANAGER")(tx);

  const res = await suiClient.simulateTransaction({
    transaction: await tx.build({ client: suiClient as any }),
    options: { showRawEffects: true },
  });

  if (res.effects?.status?.status !== "success") {
    return null;
  }

  const returnValues = res.results?.[0]?.returnValues;
  if (!returnValues || returnValues.length === 0) {
    return null;
  }

  try {
    const [bcsBytes] = returnValues[0];
    const accountInfo = Account.parse(new Uint8Array(bcsBytes));

    return {
      epoch: String(accountInfo.epoch),
      open_orders: {
        contents: (accountInfo.open_orders.contents as unknown[]).map((id) =>
          String(id)
        ),
      },
      taker_volume: Number(accountInfo.taker_volume) / baseScalar,
      maker_volume: Number(accountInfo.maker_volume) / baseScalar,
      active_stake: Number(accountInfo.active_stake) / DEEP_SCALAR,
      inactive_stake: Number(accountInfo.inactive_stake) / DEEP_SCALAR,
      created_proposal: accountInfo.created_proposal,
      voted_proposal: accountInfo.voted_proposal
        ? String(accountInfo.voted_proposal)
        : null,
      unclaimed_rebates: {
        base: Number(accountInfo.unclaimed_rebates.base) / baseScalar,
        quote: Number(accountInfo.unclaimed_rebates.quote) / quoteScalar,
        deep: Number(accountInfo.unclaimed_rebates.deep) / DEEP_SCALAR,
      },
      settled_balances: {
        base: Number(accountInfo.settled_balances.base) / baseScalar,
        quote: Number(accountInfo.settled_balances.quote) / quoteScalar,
        deep: Number(accountInfo.settled_balances.deep) / DEEP_SCALAR,
      },
      owed_balances: {
        base: Number(accountInfo.owed_balances.base) / baseScalar,
        quote: Number(accountInfo.owed_balances.quote) / quoteScalar,
        deep: Number(accountInfo.owed_balances.deep) / DEEP_SCALAR,
      },
    };
  } catch {
    return null;
  }
}
