const eur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const nb = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatEuro(value: number): string {
  return eur.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return nb.format(Math.round(value));
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)} %`;
}
