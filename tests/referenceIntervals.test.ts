import { describe, it, expect } from 'vitest';
import { lookupInterval, interpret, REFERENCE_INTERVALS } from '../src/data/referenceIntervals';
import { getAnalyte } from '../src/data/analytes';

describe('reference interval lookup', () => {
  it('returns published adult sodium interval', () => {
    const r = lookupInterval({ analyteId: 'sodium', ageYears: 40, sex: 'F', specimen: 'serum' });
    expect(r.found).toBe(true);
    if (r.found) expect([r.interval.low, r.interval.high]).toEqual([135, 145]);
  });
  it('is sex-specific for creatinine', () => {
    const m = lookupInterval({ analyteId: 'creatinine', ageYears: 30, sex: 'M', specimen: 'plasma' });
    const f = lookupInterval({ analyteId: 'creatinine', ageYears: 30, sex: 'F', specimen: 'plasma' });
    expect(m.found && f.found && m.interval.high !== f.interval.high).toBe(true);
  });
  it('does not extrapolate outside the published age band', () => {
    const r = lookupInterval({ analyteId: 'creatinine', ageYears: 65, sex: 'M', specimen: 'serum' });
    expect(r.found).toBe(false);
  });
  it('flags paediatric queries for CALIPER guidance', () => {
    const r = lookupInterval({ analyteId: 'sodium', ageYears: 10, sex: 'M', specimen: 'serum' });
    expect(r.found).toBe(false);
    if (!r.found) expect(r.pediatric).toBe(true);
  });
  it('does not invent intervals for unpublished strata', () => {
    expect(lookupInterval({ analyteId: 'alt', ageYears: 40, sex: 'F', specimen: 'serum' }).found).toBe(false);
    expect(lookupInterval({ analyteId: 'glucose', ageYears: 40, sex: 'F', specimen: 'serum' }).found).toBe(false);
    expect(lookupInterval({ analyteId: 'sodium', ageYears: 40, sex: 'F', specimen: 'urine' }).found).toBe(false);
  });
  it('interprets low / normal / high with inclusive limits', () => {
    const r = lookupInterval({ analyteId: 'potassium', ageYears: 50, sex: 'M', specimen: 'serum' });
    if (!r.found) throw new Error('missing');
    expect(interpret(3.4, r.interval)).toBe('low');
    expect(interpret(3.5, r.interval)).toBe('normal');
    expect(interpret(5.2, r.interval)).toBe('normal');
    expect(interpret(5.3, r.interval)).toBe('high');
  });
  it('every interval refers to a known analyte and a cited source', () => {
    for (const ri of REFERENCE_INTERVALS) {
      expect(getAnalyte(ri.analyteId)).toBeDefined();
      expect(ri.source.url).toMatch(/^https:\/\//);
      expect(ri.ageMin).toBeLessThan(ri.ageMax);
    }
  });
});
