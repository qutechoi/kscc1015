import { SOURCES, type Source } from './sources';

export type Sex = 'M' | 'F';
export type Specimen = 'serum' | 'plasma' | 'urine' | 'whole-blood';

export interface ReferenceInterval {
  analyteId: string;
  /** undefined = applies to both sexes */
  sex?: Sex;
  /** inclusive lower age bound, years */
  ageMin: number;
  /** exclusive upper age bound, years */
  ageMax: number;
  specimens: Specimen[];
  low: number | null;
  high: number | null;
  unit: string;
  /** UCUM code of `unit`, used to convert user input */
  ucum: string;
  source: Source;
  note?: string;
  /**
   * true when the value was only confirmed via search-engine snippets of the
   * source page, because the page itself could not be opened from the build
   * environment. Shown as TODO(verify) in the UI.
   */
  verify: boolean;
}

const rcpa = SOURCES.rcpaTable6;
const ADULT = { ageMin: 18, ageMax: 120 };
const SP: Specimen[] = ['serum', 'plasma'];

/**
 * RCPA Harmonised Reference Intervals (Table 6), adults.
 * Only intervals that could be corroborated are listed; everything else is
 * deliberately left out (see MISSING_DATA). No values are extrapolated.
 *
 * TODO(verify): rcpa.edu.au was not reachable from the build environment
 * (proxy refused the connection). The values below were confirmed against
 * search-engine excerpts of the RCPA Table 6 page and the AACB harmonisation
 * papers (Koerbin et al., Clin Biochem Rev 2014; CCLM 2018), and must be
 * re-checked against the live Table 6 before clinical use.
 */
export const REFERENCE_INTERVALS: ReferenceInterval[] = [
  { analyteId: 'sodium', ...ADULT, specimens: SP, low: 135, high: 145, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true },
  {
    analyteId: 'potassium', ...ADULT, specimens: SP, low: 3.5, high: 5.2, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true,
    note: 'RCPA 주석: 헤파린 혈장만 검사하는 검사실은 더 낮은 참고구간을 사용할 수 있음 (값은 미공표 → 표시하지 않음).',
  },
  { analyteId: 'chloride', ...ADULT, specimens: SP, low: 95, high: 110, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true },
  { analyteId: 'bicarbonate', ...ADULT, specimens: SP, low: 22, high: 32, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true },
  {
    analyteId: 'calcium', ...ADULT, specimens: SP, low: 2.1, high: 2.6, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true,
    note: '총칼슘 및 알부민 보정 칼슘에 동일 구간.',
  },
  { analyteId: 'phosphate', ...ADULT, specimens: SP, low: 0.75, high: 1.5, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true },
  { analyteId: 'magnesium', ...ADULT, specimens: SP, low: 0.7, high: 1.1, unit: 'mmol/L', ucum: 'mmol/L', source: rcpa, verify: true },
  {
    analyteId: 'creatinine', sex: 'M', ageMin: 18, ageMax: 60, specimens: SP, low: 60, high: 110, unit: 'µmol/L', ucum: 'umol/L', source: rcpa, verify: true,
    note: '조화 구간은 60세 미만 성인에만 적용. 60세 이상은 각 검사실 구간 사용(RCPA).',
  },
  {
    analyteId: 'creatinine', sex: 'F', ageMin: 18, ageMax: 60, specimens: SP, low: 45, high: 90, unit: 'µmol/L', ucum: 'umol/L', source: rcpa, verify: true,
    note: '조화 구간은 60세 미만 성인에만 적용. 60세 이상은 각 검사실 구간 사용(RCPA).',
  },
  { analyteId: 'alp', ...ADULT, specimens: SP, low: 30, high: 110, unit: 'U/L', ucum: 'U/L', source: rcpa, verify: true },
  { analyteId: 'ld', ...ADULT, specimens: SP, low: 120, high: 250, unit: 'U/L', ucum: 'U/L', source: rcpa, verify: true },
  {
    analyteId: 'ck', sex: 'M', ageMin: 18, ageMax: 60, specimens: SP, low: 45, high: 250, unit: 'U/L', ucum: 'U/L', source: rcpa, verify: true,
    note: '여성 구간 및 60세 이상 구간은 확인하지 못해 수록하지 않음.',
  },
  {
    analyteId: 'alt', sex: 'M', ...ADULT, specimens: SP, low: 5, high: 40, unit: 'U/L', ucum: 'U/L', source: rcpa, verify: true,
    note: '피리독살 5-인산(P5P) 미첨가 측정법 기준. 여성 구간은 확인하지 못해 수록하지 않음.',
  },
  { analyteId: 'bilirubin', ...ADULT, specimens: SP, low: 1, high: 20, unit: 'µmol/L', ucum: 'umol/L', source: rcpa, verify: true, note: '총빌리루빈.' },
  { analyteId: 'total-protein', ...ADULT, specimens: SP, low: 60, high: 80, unit: 'g/L', ucum: 'g/L', source: rcpa, verify: true },
];

/** Analytes / strata for which no published interval could be obtained. Shown in the UI and README. */
export const MISSING_DATA: { what: string; why: string }[] = [
  { what: 'RCPA Table 6 원문 전체', why: 'rcpa.edu.au 가 빌드 환경 네트워크 정책(프록시)에서 차단되어 직접 열람 불가. 검색 결과 발췌로 교차 확인된 항목만 수록.' },
  { what: 'ALT 여성, CK 여성 및 60세 이상 성인, AST, GGT', why: '검색 결과 발췌에서 수치를 확인하지 못함.' },
  { what: '요소(Urea), 요산(Urate)', why: 'RCPA 조화 구간이 나이·성별별로 존재한다는 언급만 확인, 수치는 확인하지 못함.' },
  { what: 'RCPA 소아 구간(예: 혈장 칼륨 소아 구간)', why: '원문 표 미열람.' },
  { what: 'CALIPER 소아 참고구간 수치', why: 'caliperproject.ca 접속 불가(프록시 차단). 수치를 임의로 넣지 않고 안내 링크만 제공.' },
  { what: '포도당, 지질, HbA1c, 알부민, 철, 리튬 등', why: 'RCPA Table 6 조화 구간 대상이 아니거나 포함 여부를 확인하지 못함(임상 결정 한계값은 참고구간이 아님).' },
];

export interface LookupQuery {
  analyteId: string;
  ageYears: number;
  sex: Sex;
  specimen: Specimen;
}

export type LookupResult =
  | { found: true; interval: ReferenceInterval }
  | { found: false; reason: string; pediatric: boolean };

/** Return the published interval that exactly covers the query. Never extrapolates. */
export function lookupInterval(q: LookupQuery): LookupResult {
  const pediatric = q.ageYears < 18;
  const rows = REFERENCE_INTERVALS.filter((r) => r.analyteId === q.analyteId);
  if (rows.length === 0) {
    return { found: false, pediatric, reason: '이 분석물에 대해 수록된 공표 참고구간이 없습니다.' };
  }
  const bySpecimen = rows.filter((r) => r.specimens.includes(q.specimen));
  if (bySpecimen.length === 0) {
    return { found: false, pediatric, reason: `이 검체(${q.specimen})에 대한 공표 구간이 없습니다.` };
  }
  const bySex = bySpecimen.filter((r) => !r.sex || r.sex === q.sex);
  if (bySex.length === 0) {
    return { found: false, pediatric, reason: '이 성별에 대한 공표 구간을 확인하지 못했습니다.' };
  }
  const match = bySex.find((r) => q.ageYears >= r.ageMin && q.ageYears < r.ageMax);
  if (!match) {
    const covered = bySex.map((r) => `${r.ageMin}–<${r.ageMax}세`).join(', ');
    return {
      found: false,
      pediatric,
      reason: `입력한 나이(${q.ageYears}세)는 공표된 나이 구간(${covered}) 밖입니다. 외삽하지 않습니다.`,
    };
  }
  return { found: true, interval: match };
}

export type Flag = 'low' | 'normal' | 'high';

export function interpret(value: number, ri: ReferenceInterval): Flag {
  if (ri.low !== null && value < ri.low) return 'low';
  if (ri.high !== null && value > ri.high) return 'high';
  return 'normal';
}
