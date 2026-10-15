import ucumPkg from '@lhncbc/ucum-lhc';

export const ucum = ucumPkg.UcumLhcUtils.getInstance();

/** Normalise common clinical spellings to UCUM case-sensitive codes. */
export function toUcumCode(input: string): string {
  return input
    .trim()
    .replace(/[µμ]/g, 'u')
    .replace(/mcg/gi, 'ug')
    .replace(/mEq/g, 'meq')
    .replace(/\bEq\b/g, 'eq')
    .replace(/\s+/g, '')
    .replace(/\/l$/, '/L')
    .replace(/\/dl$/, '/dL');
}

export function isValidUcum(code: string): boolean {
  return ucum.validateUnitString(code).status === 'valid';
}

export type UnitKind = 'mass' | 'amount' | 'equivalent' | 'other';

/** Classify a concentration unit by its UCUM dimension (per volume). */
export function unitKind(code: string): UnitKind {
  const probe = ucum.convertUnitTo(code, 1, code);
  const u = probe.fromUnit;
  if (!u || !u.dim_) return 'other';
  const [len, time, mass] = u.dim_.dimVec_;
  if (len !== -3 || time !== 0) return 'other';
  if (u.equivalentExp_ === 1) return 'equivalent';
  if (u.moleExp_ === 1) return 'amount';
  if (mass === 1 && u.moleExp_ === 0) return 'mass';
  return 'other';
}

export const KIND_BASE: Record<Exclude<UnitKind, 'other'>, string> = {
  mass: 'g/L',
  amount: 'mol/L',
  equivalent: 'eq/L',
};
