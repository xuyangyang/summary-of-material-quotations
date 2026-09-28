export function fmtNum(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }
  return value.toLocaleString("zh-CN", {
    maximumFractionDigits: digits,
  });
}

export function fmtDateTime(value: string): string {
  if (!value) {
    return "—";
  }
  const normalized = /(Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}Z`;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface PriceStats {
  min: number | null;
  max: number | null;
  avg: number | null;
  weightedAvg: number | null;
  latest: number | null;
  latestDate: string;
}

export function calcPriceStats(
  rows: Array<{
    purchase_date: string;
    quantity: number | null;
    unit_price: number | null;
  }>,
): PriceStats {
  let min: number | null = null;
  let max: number | null = null;
  let sum = 0;
  let count = 0;
  let weightedSum = 0;
  let weightedCount = 0;
  let latest: number | null = null;
  let latestDate = "";

  rows.forEach((row) => {
    const price = row.unit_price;
    if (price === null || price === undefined) {
      return;
    }
    min = min === null ? price : Math.min(min, price);
    max = max === null ? price : Math.max(max, price);
    sum += price;
    count += 1;

    if (row.purchase_date >= latestDate) {
      latestDate = row.purchase_date;
      latest = price;
    }

    if (row.quantity !== null && row.quantity !== undefined) {
      weightedSum += price * row.quantity;
      weightedCount += row.quantity;
    }
  });

  return {
    min,
    max,
    avg: count ? sum / count : null,
    weightedAvg: weightedCount ? weightedSum / weightedCount : null,
    latest,
    latestDate,
  };
}
