/** Format to a given number of significant digits without exponent noise. */
export function sig(x: number, digits = 4): string {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return '0';
  const p = Number(x.toPrecision(digits));
  const abs = Math.abs(p);
  if (abs >= 1e-4 && abs < 1e9) {
    const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(abs)));
    return p.toFixed(Math.min(decimals, 12)).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  }
  return p.toExponential(digits - 1);
}
