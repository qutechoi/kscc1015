import { describe, it, expect } from 'vitest';
import { convert } from '../src/lib/convert';
import { molarMass, parseFormula } from '../src/lib/atomicWeights';
import { ANALYTES, searchAnalytes } from '../src/data/analytes';

const ok = (r: ReturnType<typeof convert>) => {
  if (!r.ok) throw new Error(`expected success, got: ${r.reason}`);
  return r;
};

describe('molar mass from IUPAC atomic weights', () => {
  it('parses formulas', () => {
    expect(parseFormula('C6H12O6')).toEqual({ C: 6, H: 12, O: 6 });
    expect(parseFormula('CH4N2O')).toEqual({ C: 1, H: 4, N: 2, O: 1 });
    expect(() => parseFormula('Xx2')).toThrow();
  });
  it('computes molar masses', () => {
    expect(molarMass('C6H12O6')).toBeCloseTo(180.156, 3);
    expect(molarMass('C4H7N3O')).toBeCloseTo(113.12, 2);
    expect(molarMass('CH4N2O')).toBeCloseTo(60.056, 3);
    expect(molarMass('N2')).toBeCloseTo(28.014, 3);
    expect(molarMass('C27H46O')).toBeCloseTo(386.664, 3);
    expect(molarMass('C57H104O6')).toBeCloseTo(885.453, 3);
  });
});

describe('UCUM + molecular weight conversions', () => {
  it('glucose mg/dL → mmol/L', () => {
    const r = ok(convert('glucose', 100, 'mg/dL', 'mmol/L'));
    expect(r.value).toBeCloseTo(1000 / 180.156, 6);
    expect(r.evidence.factor).toBeCloseTo(10 / 180.156, 9);
    expect(r.evidence.sources.some((s) => s.url.includes('ucum'))).toBe(true);
  });
  it('creatinine mg/dL → µmol/L', () => {
    const r = ok(convert('creatinine', 1, 'mg/dL', 'µmol/L'));
    expect(r.value).toBeCloseTo(10000 / molarMass('C4H7N3O'), 6);
  });
  it('calcium mg/dL → mmol/L → mEq/L uses charge 2', () => {
    const mmol = ok(convert('calcium', 10, 'mg/dL', 'mmol/L')).value;
    const meq = ok(convert('calcium', 10, 'mg/dL', 'mEq/L')).value;
    expect(mmol).toBeCloseTo(100 / 40.078, 6);
    expect(meq).toBeCloseTo(2 * mmol, 6);
  });
  it('sodium mmol/L = mEq/L (charge 1)', () => {
    expect(ok(convert('sodium', 140, 'mmol/L', 'mEq/L')).value).toBeCloseTo(140, 9);
  });
  it('enzyme U/L → µkat/L via UCUM definitions', () => {
    expect(ok(convert('alt', 60, 'U/L', 'µkat/L')).value).toBeCloseTo(1, 9);
  });
  it('accepts free UCUM text (ug/dL, mcg/dL)', () => {
    expect(ok(convert('iron', 100, 'mcg/dL', 'umol/L')).value).toBeCloseTo(1000 / 55.845, 5);
  });
  it('round-trips every analyte unit pair (swap)', () => {
    for (const a of ANALYTES) {
      for (const u1 of a.units) {
        for (const u2 of a.units) {
          const x = 7.3;
          const fwd = convert(a.id, x, u1.label, u2.label);
          if (!fwd.ok) throw new Error(`${a.id} ${u1.label}→${u2.label}: ${fwd.reason}`);
          const back = ok(convert(a.id, fwd.value, u2.label, u1.label));
          expect(back.value).toBeCloseTo(x, 8);
        }
      }
    }
  });
});

describe('special conversions', () => {
  it('HbA1c NGSP → IFCC (master equation)', () => {
    const r = ok(convert('hba1c', 6.5, '% (NGSP/DCCT)', 'mmol/mol (IFCC)'));
    expect(r.value).toBeCloseTo((6.5 - 2.152) / 0.09148, 9);
    expect(Math.round(r.value)).toBe(48);
  });
  it('HbA1c IFCC → NGSP', () => {
    expect(ok(convert('hba1c', 53, 'mmol/mol', '%')).value).toBeCloseTo(0.09148 * 53 + 2.152, 9);
  });
  it('HbA1c is NOT treated as dimensionless UCUM scaling (5% ≠ 50 mmol/mol)', () => {
    expect(ok(convert('hba1c', 5, '%', 'mmol/mol')).value).not.toBeCloseTo(50, 0);
  });
  it('uACR mg/g → mg/mmol uses creatinine MW', () => {
    const r = ok(convert('uacr', 30, 'mg/g', 'mg/mmol'));
    expect(r.value).toBeCloseTo((30 * molarMass('C4H7N3O')) / 1000, 6);
    expect(r.evidence.sources.some((s) => s.url.includes('kdigo'))).toBe(true);
  });
  it('BUN (as N) → urea mmol/L and urea mg/dL', () => {
    expect(ok(convert('urea', 14, 'mg/dL (BUN, 질소로서)', 'mmol/L (요소)')).value).toBeCloseTo(140 / molarMass('N2'), 6);
    expect(ok(convert('urea', 14, 'mg/dL (BUN, 질소로서)', 'mg/dL (요소로서)')).value).toBeCloseTo(
      (14 * molarMass('CH4N2O')) / molarMass('N2'),
      6,
    );
  });
  it('triglycerides assume triolein and say so', () => {
    const r = ok(convert('triglycerides', 150, 'mg/dL', 'mmol/L'));
    expect(r.value).toBeCloseTo(1500 / molarMass('C57H104O6'), 6);
    expect(r.evidence.assumptions.join(' ')).toMatch(/트리올레인/);
  });
});

describe('rejections', () => {
  it('mg/dL → U/L is rejected with a reason', () => {
    const r = convert('glucose', 100, 'mg/dL', 'U/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/차원/);
  });
  it('mEq for a non-ion is rejected', () => {
    const r = convert('glucose', 5, 'mmol/L', 'mEq/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/전하/);
  });
  it('mass → molar for a protein mixture is rejected', () => {
    const r = convert('total-protein', 7, 'g/dL', 'mmol/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/분자량/);
  });
  it('unknown unit is rejected', () => {
    expect(convert('glucose', 1, 'banana', 'mmol/L').ok).toBe(false);
  });
});

describe('search', () => {
  it('finds by English, Korean and synonyms', () => {
    expect(searchAnalytes('glucose')[0].id).toBe('glucose');
    expect(searchAnalytes('크레아티닌').map((a) => a.id)).toContain('creatinine');
    expect(searchAnalytes('GOT').map((a) => a.id)).toContain('ast');
    expect(searchAnalytes('BUN').map((a) => a.id)).toContain('urea');
    expect(searchAnalytes('당화혈색소').map((a) => a.id)).toContain('hba1c');
  });
});
