import { getAnalyte, type Analyte, type UnitOption } from '../data/analytes';
import { SOURCES, type Source } from '../data/sources';
import { molarMass, molarMassBreakdown, ATOMIC_WEIGHT_SOURCE } from './atomicWeights';
import { ucum, toUcumCode, isValidUcum, unitKind, KIND_BASE, type UnitKind } from './ucum';
import { sig } from './format';

export interface Evidence {
  /** short name of the method */
  method: string;
  /** multiplicative factor (to = from × factor) for linear conversions */
  factor?: number;
  /** human-readable formula */
  formula: string;
  /** derivation steps */
  steps: string[];
  assumptions: string[];
  sources: Source[];
}

export type ConversionResult =
  | { ok: true; value: number; fromLabel: string; toLabel: string; evidence: Evidence }
  | { ok: false; reason: string; detail?: string };

interface ResolvedUnit {
  label: string;
  ucum: string;
  speciesKey: string;
}

/** Resolve a unit given either as an option label of the analyte or as free UCUM text. */
export function resolveUnit(analyte: Analyte, input: string): ResolvedUnit | null {
  const byLabel: UnitOption | undefined = analyte.units.find((u) => u.label === input);
  if (byLabel) return { label: byLabel.label, ucum: byLabel.ucum, speciesKey: byLabel.species ?? 'default' };
  const code = toUcumCode(input);
  if (!code || !isValidUcum(code)) return null;
  const byCode = analyte.units.find((u) => u.ucum === code && !u.species);
  return { label: byCode?.label ?? input.trim(), ucum: code, speciesKey: 'default' };
}

const KIND_KO: Record<UnitKind, string> = {
  mass: '질량농도',
  amount: '물질량(몰)농도',
  equivalent: '당량농도',
  other: '기타 차원',
};

function rejectReason(code: string | undefined, analyte: Analyte, from: string, to: string): ConversionResult {
  switch (code) {
    case 'incommensurable':
      return {
        ok: false,
        reason: `UCUM 차원 검사 실패: "${from}" 와 "${to}" 는 서로 다른 물리량이라 변환 근거가 없습니다.`,
        detail:
          analyte.noMolarReason ??
          '예: 질량농도(mg/dL)와 촉매활성농도(U/L)는 차원이 달라 어떤 계수로도 바꿀 수 없습니다.',
      };
    case 'missing-molecular-weight':
      return {
        ok: false,
        reason: '질량 ↔ 몰 변환에는 분자량이 필요하지만 이 분석물에는 정의된 분자량 근거가 없습니다.',
        detail: analyte.noMolarReason,
      };
    case 'missing-charge':
    case 'missing-molecular-weight-and-charge':
      return {
        ok: false,
        reason: '당량(mEq) 변환에는 이온 전하가 필요하지만 이 분석물에는 고정된 전하가 정의되어 있지 않습니다.',
        detail: '비전해질이거나 pH에 따라 전하가 변하는 화학종은 mEq로 표현할 근거가 없습니다.',
      };
    default:
      return { ok: false, reason: `변환 실패 (${code ?? 'unknown'})` };
  }
}

function hba1c(value: number, from: ResolvedUnit, to: ResolvedUnit): ConversionResult {
  const isNgsp = (u: ResolvedUnit) => u.ucum === '%';
  const isIfcc = (u: ResolvedUnit) => u.ucum === 'mmol/mol';
  const assumptions = [
    'IFCC–NGSP 마스터 방정식(회귀식)은 선형 비례가 아닌 절편이 있는 1차식입니다. UCUM은 %와 mmol/mol을 모두 무차원으로 보아 5% = 50 mmol/mol로 계산하므로, HbA1c에는 UCUM 스케일 변환을 사용하지 않습니다.',
    'TODO(verify): 계수 0.09148, 2.152는 NGSP 공개 자료(검색 결과 인용)로 확인했으며 ngsp.org 원문은 빌드 환경에서 직접 열람하지 못했습니다.',
  ];
  if ((isNgsp(from) && isNgsp(to)) || (isIfcc(from) && isIfcc(to))) {
    return {
      ok: true,
      value,
      fromLabel: from.label,
      toLabel: to.label,
      evidence: { method: '동일 단위', factor: 1, formula: `${to.label} = ${from.label}`, steps: [], assumptions: [], sources: [SOURCES.ngsp] },
    };
  }
  if (isNgsp(from) && isIfcc(to)) {
    return {
      ok: true,
      value: (value - 2.152) / 0.09148,
      fromLabel: from.label,
      toLabel: to.label,
      evidence: {
        method: 'HbA1c IFCC–NGSP 마스터 방정식 (역변환)',
        formula: 'IFCC (mmol/mol) = (NGSP (%) − 2.152) ÷ 0.09148',
        steps: ['마스터 방정식: NGSP = 0.09148 × IFCC + 2.152', '양변을 IFCC에 대해 정리'],
        assumptions,
        sources: [SOURCES.ngsp],
      },
    };
  }
  if (isIfcc(from) && isNgsp(to)) {
    return {
      ok: true,
      value: 0.09148 * value + 2.152,
      fromLabel: from.label,
      toLabel: to.label,
      evidence: {
        method: 'HbA1c IFCC–NGSP 마스터 방정식',
        formula: 'NGSP (%) = 0.09148 × IFCC (mmol/mol) + 2.152',
        steps: ['마스터 방정식을 그대로 적용'],
        assumptions,
        sources: [SOURCES.ngsp],
      },
    };
  }
  return { ok: false, reason: 'HbA1c는 % (NGSP) 와 mmol/mol (IFCC) 사이의 변환만 근거가 있습니다.' };
}

function ucumConvert(fromCode: string, value: number, toCode: string, mw?: number, charge?: number) {
  const opts: { molecularWeight?: number; charge?: number } = {};
  if (mw !== undefined) opts.molecularWeight = mw;
  if (charge !== undefined) opts.charge = charge;
  return ucum.convertUnitTo(fromCode, value, toCode, opts);
}

/** Middle factor between base kinds (g/L, mol/L, eq/L). */
function kindStep(fromKind: UnitKind, toKind: UnitKind, mw?: number, charge?: number): string | null {
  const mwS = mw !== undefined ? sig(mw, 7) : '?';
  const key = `${fromKind}>${toKind}`;
  switch (key) {
    case 'mass>amount':
      return `÷ MW ${mwS} g/mol`;
    case 'amount>mass':
      return `× MW ${mwS} g/mol`;
    case 'amount>equivalent':
      return `× 전하 ${charge}`;
    case 'equivalent>amount':
      return `÷ 전하 ${charge}`;
    case 'mass>equivalent':
      return `÷ MW ${mwS} g/mol × 전하 ${charge}`;
    case 'equivalent>mass':
      return `÷ 전하 ${charge} × MW ${mwS} g/mol`;
    default:
      return fromKind === toKind ? '(같은 차원, 스케일만 변경)' : null;
  }
}

export function convert(analyteId: string, value: number, fromInput: string, toInput: string): ConversionResult {
  const analyte = getAnalyte(analyteId);
  if (!analyte) return { ok: false, reason: `알 수 없는 분석물: ${analyteId}` };
  if (!Number.isFinite(value)) return { ok: false, reason: '숫자 값을 입력하세요.' };

  const from = resolveUnit(analyte, fromInput);
  const to = resolveUnit(analyte, toInput);
  if (!from) return { ok: false, reason: `"${fromInput}" 는 UCUM에서 인식할 수 없는 단위입니다.` };
  if (!to) return { ok: false, reason: `"${toInput}" 는 UCUM에서 인식할 수 없는 단위입니다.` };

  if (analyte.special === 'hba1c') return hba1c(value, from, to);

  const sources: Source[] = [SOURCES.ucum, SOURCES.ucumLhc];
  const assumptions = [...(analyte.assumptions ?? [])];
  const steps: string[] = [];

  const spFrom = analyte.species?.[from.speciesKey];
  const spTo = analyte.species?.[to.speciesKey];
  const mwFrom = spFrom ? molarMass(spFrom.formula) * (spFrom.perAnalyte ?? 1) : undefined;
  const mwTo = spTo ? molarMass(spTo.formula) * (spTo.perAnalyte ?? 1) : undefined;
  const charge = analyte.charge;

  const fromKind = unitKind(from.ucum);
  const toKind = unitKind(to.ucum);
  steps.push(
    `UCUM 차원 검사: ${from.ucum} (${KIND_KO[fromKind]}) → ${to.ucum} (${KIND_KO[toKind]})`,
  );
  if (spFrom && mwFrom !== undefined) {
    steps.push(`MW(${spFrom.label}) = ${molarMassBreakdown(spFrom.formula)} = ${sig(mwFrom, 7)} g/mol`);
  }
  if (spTo && mwTo !== undefined && from.speciesKey !== to.speciesKey) {
    steps.push(`MW(${spTo.label}) = ${molarMassBreakdown(spTo.formula)} = ${sig(mwTo, 7)} g/mol`);
  }
  if (mwFrom !== undefined || mwTo !== undefined) sources.push(SOURCES.iupac);

  let factor: number;
  let method: string;
  let formula: string;

  if (from.speciesKey !== to.speciesKey) {
    // Different chemical basis (e.g. BUN as N2 vs urea): go through amount of analyte (1:1 stoichiometry).
    const a = ucumConvert(from.ucum, 1, 'mmol/L', mwFrom, charge);
    if (a.status !== 'succeeded' || a.toVal == null) return rejectReason(a.code, analyte, from.label, 'mmol/L');
    const b = ucumConvert('mmol/L', a.toVal, to.ucum, mwTo, charge);
    if (b.status !== 'succeeded' || b.toVal == null) return rejectReason(b.code, analyte, 'mmol/L', to.label);
    factor = b.toVal;
    method = 'UCUM + 화학양론(기준 화학종 변경)';
    steps.push(`1 ${from.label} → ${sig(a.toVal, 6)} mmol/L (MW ${sig(mwFrom ?? NaN, 7)})`);
    steps.push(`${sig(a.toVal, 6)} mmol/L → ${sig(b.toVal, 6)} ${to.label} (MW ${sig(mwTo ?? NaN, 7)})`);
    formula = `${to.label} = ${from.label} × ${sig(factor, 6)}   (= MW_to ${sig(mwTo ?? NaN, 7)} ÷ MW_from ${sig(mwFrom ?? NaN, 7)} × UCUM 스케일)`;
  } else {
    const r = ucumConvert(from.ucum, 1, to.ucum, mwFrom, charge);
    if (r.status !== 'succeeded' || r.toVal == null) return rejectReason(r.code, analyte, from.label, to.label);
    factor = r.toVal;
    const usesMw = fromKind !== toKind && (fromKind === 'mass' || toKind === 'mass');
    const usesCharge = fromKind !== toKind && (fromKind === 'equivalent' || toKind === 'equivalent');
    method = usesMw
      ? usesCharge
        ? 'UCUM + 분자량(IUPAC) + 이온 전하'
        : 'UCUM + 분자량(IUPAC)'
      : usesCharge
        ? 'UCUM + 이온 전하'
        : 'UCUM 스케일 변환';
    if (fromKind !== 'other' && toKind !== 'other') {
      const s1 = ucumConvert(from.ucum, 1, KIND_BASE[fromKind]).toVal;
      const s2 = ucumConvert(KIND_BASE[toKind], 1, to.ucum).toVal;
      const mid = kindStep(fromKind, toKind, mwFrom, charge);
      if (s1 != null && s2 != null && mid) {
        steps.push(
          `계수 = [1 ${from.ucum} = ${sig(s1, 6)} ${KIND_BASE[fromKind]}] ${mid} × [1 ${KIND_BASE[toKind]} = ${sig(s2, 6)} ${to.ucum}] = ${sig(factor, 6)}`,
        );
      }
    } else {
      steps.push(`UCUM 단위 정의에 따른 스케일: 1 ${from.ucum} = ${sig(factor, 6)} ${to.ucum}`);
    }
    formula = `${to.label} = ${from.label} × ${sig(factor, 6)}`;
    if (usesCharge && charge !== undefined) assumptions.push(`이온 전하 |z| = ${charge} (1 mmol = ${charge} mEq).`);
  }

  if (analyte.special === 'creatinine-ratio') {
    method = 'KDIGO 단위 체계: 분모 크레아티닌 g ↔ mmol (UCUM + 분자량)';
    const mw = mwFrom ?? NaN;
    assumptions.push(
      `mg/mmol = mg/g × MW(크레아티닌)/1000 = mg/g × ${sig(mw / 1000, 6)}. 분자(알부민·단백)의 질량은 그대로이고 분모 크레아티닌만 g ↔ mmol 로 바뀝니다.`,
      'KDIGO 범주표의 "30 mg/g ≈ 3 mg/mmol" 은 반올림된 근사 표기이며, 정확한 계산값은 3.39 mg/mmol 입니다. TODO(verify): KDIGO 2024 원문은 빌드 환경에서 직접 열람하지 못했습니다.',
    );
  }
  sources.push(...(analyte.sources ?? []));

  return {
    ok: true,
    value: value * factor,
    fromLabel: from.label,
    toLabel: to.label,
    evidence: { method, factor, formula, steps, assumptions, sources: dedupe(sources) },
  };
}

function dedupe(list: Source[]): Source[] {
  const seen = new Set<string>();
  return list.filter((s) => (seen.has(s.url) ? false : (seen.add(s.url), true)));
}

export { ATOMIC_WEIGHT_SOURCE };
