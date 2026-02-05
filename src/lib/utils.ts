export const truncateAddress = (address: string) => {
  if (!address) return "";
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatVolume = (volume: number): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 2,
  });
  return formatter.format(volume);
};

export const formatPrice = (price: number, quoteCurrency: string): string => {
  const isUsd = quoteCurrency.toUpperCase().includes("USD");
  const formatted = price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: price < 1 ? 6 : 4,
  });
  return isUsd ? `$${formatted}` : `${formatted} ${quoteCurrency}`;
};
