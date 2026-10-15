/**
 * IUPAC/CIAAW standard atomic weights (conventional values for elements whose
 * standard atomic weight is given as an interval, e.g. H, Li, C, N, O, Mg, Cl).
 * Source: IUPAC Standard Atomic Weights 2021 (CIAAW), Pure Appl. Chem. 2022.
 * TODO(verify): values entered from the IUPAC 2021 table as known to the author;
 * ciaaw.org was not reachable from the build environment for a direct re-check.
 */
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  Li: 6.94,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.98976928,
  Mg: 24.305,
  P: 30.973761998,
  Cl: 35.45,
  K: 39.0983,
  Ca: 40.078,
  Fe: 55.845,
};

export const ATOMIC_WEIGHT_SOURCE = {
  label: 'IUPAC/CIAAW Standard Atomic Weights 2021',
  url: 'https://www.ciaaw.org/atomic-weights.htm',
};

/** Parse a simple molecular formula (e.g. "C6H12O6", "CH4N2O", "N2") into element counts. */
export function parseFormula(formula: string): Record<string, number> {
  const counts: Record<string, number> = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let consumed = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(formula)) !== null) {
    if (m[0] === '') break;
    const [, el, n] = m;
    if (!(el in ATOMIC_WEIGHTS)) throw new Error(`Unknown element "${el}" in formula ${formula}`);
    counts[el] = (counts[el] ?? 0) + (n ? parseInt(n, 10) : 1);
    consumed += m[0].length;
  }
  if (consumed !== formula.length) throw new Error(`Cannot parse formula ${formula}`);
  return counts;
}

/** Molar mass in g/mol computed from IUPAC atomic weights. */
export function molarMass(formula: string): number {
  const counts = parseFormula(formula);
  return Object.entries(counts).reduce((s, [el, n]) => s + ATOMIC_WEIGHTS[el] * n, 0);
}

/** Human-readable breakdown, e.g. "6×12.011 + 12×1.008 + 6×15.999". */
export function molarMassBreakdown(formula: string): string {
  return Object.entries(parseFormula(formula))
    .map(([el, n]) => `${n}×${ATOMIC_WEIGHTS[el]} (${el})`)
    .join(' + ');
}
