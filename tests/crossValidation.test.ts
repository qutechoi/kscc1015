/**
 * Cross-validation ONLY. These conventional factors are NOT used by the app;
 * the app computes every factor from UCUM + IUPAC molar masses. This file checks
 * that the computed factors agree with commonly published SI conversion tables
 * (Labcorp "SI Unit Conversion Table", CMEinfo conversion PDF, NBME Laboratory
 * Reference Values PDF) within 1 %.
 *
 * TODO(verify): labcorp.com, cmeinfo and nbme.org could not be opened from the
 * build environment (egress proxy refused the connection). The expected values
 * below are the widely reproduced conventional factors and must be re-checked
 * against each PDF/table; the `source` field records which table to check.
 */
import { describe, it, expect } from 'vitest';
import { convert } from '../src/lib/convert';

interface Row {
  analyte: string;
  from: string;
  to: string;
  factor: number;
  source: 'Labcorp' | 'CMEinfo' | 'NBME';
}

const ROWS: Row[] = [
  { analyte: 'glucose', from: 'mg/dL', to: 'mmol/L', factor: 0.0555, source: 'Labcorp' },
  { analyte: 'creatinine', from: 'mg/dL', to: 'µmol/L', factor: 88.4, source: 'Labcorp' },
  { analyte: 'urea', from: 'mg/dL (BUN, 질소로서)', to: 'mmol/L (요소)', factor: 0.357, source: 'Labcorp' },
  { analyte: 'cholesterol', from: 'mg/dL', to: 'mmol/L', factor: 0.0259, source: 'Labcorp' },
  { analyte: 'triglycerides', from: 'mg/dL', to: 'mmol/L', factor: 0.0113, source: 'Labcorp' },
  { analyte: 'uric-acid', from: 'mg/dL', to: 'µmol/L', factor: 59.48, source: 'CMEinfo' },
  { analyte: 'bilirubin', from: 'mg/dL', to: 'µmol/L', factor: 17.1, source: 'CMEinfo' },
  { analyte: 'calcium', from: 'mg/dL', to: 'mmol/L', factor: 0.25, source: 'CMEinfo' },
  { analyte: 'magnesium', from: 'mg/dL', to: 'mmol/L', factor: 0.4114, source: 'CMEinfo' },
  { analyte: 'phosphate', from: 'mg/dL (P로서)', to: 'mmol/L', factor: 0.3229, source: 'CMEinfo' },
  { analyte: 'iron', from: 'µg/dL', to: 'µmol/L', factor: 0.179, source: 'NBME' },
  { analyte: 'ammonia', from: 'µg/dL (NH3로서)', to: 'µmol/L', factor: 0.5872, source: 'CMEinfo' },
  { analyte: 'lactate', from: 'mg/dL', to: 'mmol/L', factor: 0.111, source: 'CMEinfo' },
  { analyte: 'alt', from: 'U/L', to: 'µkat/L', factor: 0.01667, source: 'CMEinfo' },
];

describe('cross-validation against published conversion tables (test-only)', () => {
  for (const row of ROWS) {
    it(`${row.analyte}: ${row.from} → ${row.to} ≈ ×${row.factor} (${row.source}, TODO(verify))`, () => {
      const r = convert(row.analyte, 1, row.from, row.to);
      if (!r.ok) throw new Error(r.reason);
      const relErr = Math.abs(r.value - row.factor) / row.factor;
      expect(relErr).toBeLessThan(0.01);
    });
  }
});
