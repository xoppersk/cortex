export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: value % 1 === 0 ? 0 : 2, minimumFractionDigits: 0 })}`;
}

export function formatCost(value: number): string {
  return `$${value.toFixed(3)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
