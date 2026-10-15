import { SOURCES, type Source } from './sources';

/**
 * A chemical "species" whose molar mass is used for mass ↔ amount conversion.
 * Molar mass is always computed from the formula with IUPAC atomic weights,
 * never copied from a conversion table.
 */
export interface Species {
  /** molecular formula, e.g. C6H12O6 */
  formula: string;
  /** description shown in the evidence block */
  label: string;
  /** moles of this species per mole of the analyte (e.g. 1 urea → 1 N2 unit) */
  perAnalyte?: number;
}

export interface UnitOption {
  /** label shown to the user */
  label: string;
  /** UCUM case-sensitive code */
  ucum: string;
  /** species this unit is expressed "as" (overrides analyte default species) */
  species?: string;
}

export type SpecialKind = 'hba1c' | 'creatinine-ratio';

export interface Analyte {
  id: string;
  en: string;
  ko: string;
  synonyms: string[];
  /** species map; key "default" is used when a unit does not name one */
  species?: Record<string, Species>;
  /** absolute ionic charge (for mEq) */
  charge?: number;
  units: UnitOption[];
  special?: SpecialKind;
  assumptions?: string[];
  sources?: Source[];
  /** reason why mass ↔ molar conversion is not offered */
  noMolarReason?: string;
}

const ENZYME_UNITS: UnitOption[] = [
  { label: 'U/L', ucum: 'U/L' },
  { label: 'µkat/L', ucum: 'ukat/L' },
  { label: 'nkat/L', ucum: 'nkat/L' },
];

const enzyme = (id: string, en: string, ko: string, synonyms: string[]): Analyte => ({
  id,
  en,
  ko,
  synonyms,
  units: ENZYME_UNITS,
  assumptions: ['1 U = 1 µmol/min, 1 kat = 1 mol/s (UCUM 정의). 측정 온도·방법은 변환과 무관하며 결과 해석은 측정법에 따름.'],
  noMolarReason: '효소는 촉매활성(U, kat)으로 보고되며 질량·몰 농도와는 차원이 달라 변환 근거가 없습니다.',
});

export const ANALYTES: Analyte[] = [
  {
    id: 'glucose',
    en: 'Glucose',
    ko: '포도당(혈당)',
    synonyms: ['glu', 'blood sugar', 'FBS', '공복혈당', '혈당'],
    species: { default: { formula: 'C6H12O6', label: '포도당 C6H12O6' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
  },
  {
    id: 'urea',
    en: 'Urea / BUN',
    ko: '요소 / 혈액요소질소',
    synonyms: ['BUN', 'blood urea nitrogen', 'urea nitrogen', '요소질소', '요소'],
    species: {
      default: { formula: 'CH4N2O', label: '요소 CH4N2O' },
      ureaN: { formula: 'N2', label: '요소질소(BUN): 요소 1분자당 N 2원자 (N2)', perAnalyte: 1 },
    },
    units: [
      { label: 'mg/dL (BUN, 질소로서)', ucum: 'mg/dL', species: 'ureaN' },
      { label: 'mg/dL (요소로서)', ucum: 'mg/dL' },
      { label: 'mmol/L (요소)', ucum: 'mmol/L' },
    ],
    assumptions: ['BUN은 요소에 포함된 질소의 질량. 요소 1 mol = 질소 2 mol(N2 1 mol)로 화학양론 1:1 대응.'],
  },
  {
    id: 'creatinine',
    en: 'Creatinine',
    ko: '크레아티닌',
    synonyms: ['Cr', 'creat', 'Cre', 'SCr'],
    species: { default: { formula: 'C4H7N3O', label: '크레아티닌 C4H7N3O' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'µmol/L', ucum: 'umol/L' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
  },
  {
    id: 'uric-acid',
    en: 'Uric acid (urate)',
    ko: '요산',
    synonyms: ['urate', 'UA'],
    species: { default: { formula: 'C5H4N4O3', label: '요산 C5H4N4O3' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'µmol/L', ucum: 'umol/L' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
  },
  {
    id: 'cholesterol',
    en: 'Cholesterol (total / HDL / LDL)',
    ko: '콜레스테롤(총·HDL·LDL)',
    synonyms: ['TC', 'total cholesterol', 'HDL', 'LDL', 'HDL-C', 'LDL-C', '총콜레스테롤'],
    species: { default: { formula: 'C27H46O', label: '콜레스테롤 C27H46O' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
    assumptions: ['지단백 분획(HDL, LDL)도 콜레스테롤 함량으로 보고되므로 같은 분자량을 사용.'],
  },
  {
    id: 'triglycerides',
    en: 'Triglycerides',
    ko: '중성지방',
    synonyms: ['TG', 'triglyceride', '트리글리세리드'],
    species: { default: { formula: 'C57H104O6', label: '트리올레인(triolein) C57H104O6 – 대표 분자' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
    assumptions: [
      '중성지방은 단일 분자가 아니라 혼합물이므로, 관례적으로 트리올레인(C57H104O6)을 대표 분자로 가정해 분자량을 계산합니다.',
      '실제 시료의 지방산 조성에 따라 몰 농도는 달라질 수 있습니다.',
    ],
  },
  {
    id: 'bilirubin',
    en: 'Bilirubin (total / direct)',
    ko: '빌리루빈(총·직접)',
    synonyms: ['T-bil', 'TB', 'total bilirubin', 'D-bil', 'direct bilirubin', '총빌리루빈'],
    species: { default: { formula: 'C33H36N4O6', label: '비포합 빌리루빈 C33H36N4O6' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'µmol/L', ucum: 'umol/L' },
    ],
    assumptions: ['직접(포합) 빌리루빈도 관례상 비포합 빌리루빈 분자량으로 환산.'],
  },
  {
    id: 'sodium',
    en: 'Sodium',
    ko: '나트륨',
    synonyms: ['Na', 'Na+'],
    species: { default: { formula: 'Na', label: '나트륨 이온 Na⁺' } },
    charge: 1,
    units: [
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
      { label: 'mg/dL', ucum: 'mg/dL' },
    ],
  },
  {
    id: 'potassium',
    en: 'Potassium',
    ko: '칼륨',
    synonyms: ['K', 'K+'],
    species: { default: { formula: 'K', label: '칼륨 이온 K⁺' } },
    charge: 1,
    units: [
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
      { label: 'mg/dL', ucum: 'mg/dL' },
    ],
  },
  {
    id: 'chloride',
    en: 'Chloride',
    ko: '염소',
    synonyms: ['Cl', 'Cl-', '클로라이드'],
    species: { default: { formula: 'Cl', label: '염화 이온 Cl⁻' } },
    charge: 1,
    units: [
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
      { label: 'mg/dL', ucum: 'mg/dL' },
    ],
  },
  {
    id: 'bicarbonate',
    en: 'Bicarbonate (total CO2)',
    ko: '중탄산염(총 CO2)',
    synonyms: ['HCO3', 'HCO3-', 'tCO2', 'total CO2', 'CO2'],
    charge: 1,
    units: [
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
    ],
    noMolarReason: '총 CO2는 여러 화학종의 합이라 단일 분자량을 정할 수 없어 질량 단위 변환을 제공하지 않습니다.',
  },
  {
    id: 'calcium',
    en: 'Calcium (total)',
    ko: '칼슘(총)',
    synonyms: ['Ca', 'Ca2+', 'total calcium'],
    species: { default: { formula: 'Ca', label: '칼슘 Ca' } },
    charge: 2,
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
    ],
  },
  {
    id: 'magnesium',
    en: 'Magnesium',
    ko: '마그네슘',
    synonyms: ['Mg', 'Mg2+'],
    species: { default: { formula: 'Mg', label: '마그네슘 Mg' } },
    charge: 2,
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
    ],
  },
  {
    id: 'phosphate',
    en: 'Phosphate (inorganic phosphorus)',
    ko: '인(무기인)',
    synonyms: ['P', 'phosphorus', 'PO4', 'Pi', '인산'],
    species: { default: { formula: 'P', label: '인(P) 원자 기준' } },
    units: [
      { label: 'mg/dL (P로서)', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
    assumptions: ['혈청 무기인은 관례적으로 인(P) 원자 질량으로 보고. pH에 따라 HPO4²⁻/H2PO4⁻ 비율이 달라 평균 전하가 일정하지 않으므로 mEq/L 변환은 제공하지 않습니다.'],
  },
  {
    id: 'iron',
    en: 'Iron',
    ko: '철',
    synonyms: ['Fe', 'serum iron', '혈청철'],
    species: { default: { formula: 'Fe', label: '철 Fe' } },
    units: [
      { label: 'µg/dL', ucum: 'ug/dL' },
      { label: 'µmol/L', ucum: 'umol/L' },
    ],
  },
  {
    id: 'lithium',
    en: 'Lithium',
    ko: '리튬',
    synonyms: ['Li'],
    species: { default: { formula: 'Li', label: '리튬 이온 Li⁺' } },
    charge: 1,
    units: [
      { label: 'mmol/L', ucum: 'mmol/L' },
      { label: 'mEq/L', ucum: 'meq/L' },
      { label: 'mg/L', ucum: 'mg/L' },
    ],
  },
  {
    id: 'ammonia',
    en: 'Ammonia',
    ko: '암모니아',
    synonyms: ['NH3', 'NH4+'],
    species: { default: { formula: 'NH3', label: '암모니아 NH3' } },
    units: [
      { label: 'µg/dL (NH3로서)', ucum: 'ug/dL' },
      { label: 'µmol/L', ucum: 'umol/L' },
    ],
    assumptions: ['µg/dL 값은 NH3로서 표기된 것으로 가정. 검사실에 따라 질소(N)로 표기하는 경우 결과가 달라집니다.'],
  },
  {
    id: 'lactate',
    en: 'Lactate',
    ko: '젖산',
    synonyms: ['lactic acid', 'Lac'],
    species: { default: { formula: 'C3H6O3', label: '젖산 C3H6O3' } },
    units: [
      { label: 'mg/dL', ucum: 'mg/dL' },
      { label: 'mmol/L', ucum: 'mmol/L' },
    ],
  },
  {
    id: 'total-protein',
    en: 'Total protein',
    ko: '총단백',
    synonyms: ['TP', 'protein'],
    units: [
      { label: 'g/dL', ucum: 'g/dL' },
      { label: 'g/L', ucum: 'g/L' },
    ],
    noMolarReason: '총단백은 여러 단백질의 혼합물이라 단일 분자량이 없어 몰 농도로 변환할 근거가 없습니다.',
  },
  {
    id: 'albumin',
    en: 'Albumin (serum)',
    ko: '알부민(혈청)',
    synonyms: ['Alb'],
    units: [
      { label: 'g/dL', ucum: 'g/dL' },
      { label: 'g/L', ucum: 'g/L' },
    ],
    noMolarReason: '임상에서 알부민은 질량 농도로 보고되며, 이 앱은 몰 농도 변환을 위한 분자량 근거를 정의하지 않았습니다.',
  },
  enzyme('alt', 'ALT (alanine aminotransferase)', 'ALT(알라닌아미노전이효소)', ['GPT', 'SGPT']),
  enzyme('ast', 'AST (aspartate aminotransferase)', 'AST(아스파르트산아미노전이효소)', ['GOT', 'SGOT']),
  enzyme('alp', 'ALP (alkaline phosphatase)', 'ALP(알칼리성 인산분해효소)', ['alkaline phosphatase', '알칼리포스파타제']),
  enzyme('ggt', 'GGT (gamma-glutamyltransferase)', 'GGT(감마글루타밀전이효소)', ['γ-GT', 'gamma GT', 'GGTP']),
  enzyme('ld', 'LD (lactate dehydrogenase)', 'LD(젖산탈수소효소)', ['LDH']),
  enzyme('ck', 'CK (creatine kinase)', 'CK(크레아틴키나제)', ['CPK']),
  enzyme('lipase', 'Lipase', '리파아제', []),
  {
    id: 'hba1c',
    en: 'HbA1c',
    ko: '당화혈색소',
    synonyms: ['A1c', 'glycated hemoglobin', 'glycohemoglobin', 'hemoglobin A1c', '당화혈색소'],
    units: [
      { label: '% (NGSP/DCCT)', ucum: '%' },
      { label: 'mmol/mol (IFCC)', ucum: 'mmol/mol' },
    ],
    special: 'hba1c',
    sources: [SOURCES.ngsp],
  },
  {
    id: 'uacr',
    en: 'Urine albumin-to-creatinine ratio (uACR)',
    ko: '소변 알부민/크레아티닌 비(uACR)',
    synonyms: ['ACR', 'UACR', 'albumin creatinine ratio', '미세알부민', 'microalbumin'],
    species: { default: { formula: 'C4H7N3O', label: '분모: 크레아티닌 C4H7N3O' } },
    units: [
      { label: 'mg/g', ucum: 'mg/g' },
      { label: 'mg/mmol', ucum: 'mg/mmol' },
    ],
    special: 'creatinine-ratio',
    sources: [SOURCES.kdigo],
  },
  {
    id: 'upcr',
    en: 'Urine protein-to-creatinine ratio (uPCR)',
    ko: '소변 단백/크레아티닌 비(uPCR)',
    synonyms: ['PCR', 'UPCR', 'protein creatinine ratio'],
    species: { default: { formula: 'C4H7N3O', label: '분모: 크레아티닌 C4H7N3O' } },
    units: [
      { label: 'mg/g', ucum: 'mg/g' },
      { label: 'mg/mmol', ucum: 'mg/mmol' },
    ],
    special: 'creatinine-ratio',
    sources: [SOURCES.kdigo],
  },
];

export function getAnalyte(id: string): Analyte | undefined {
  return ANALYTES.find((a) => a.id === id);
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[\s\-_()·/]/g, '');
}

/** Search by English name, Korean name, id, or synonyms. */
export function searchAnalytes(query: string): Analyte[] {
  const q = norm(query);
  if (!q) return ANALYTES;
  return ANALYTES.filter((a) =>
    [a.id, a.en, a.ko, ...a.synonyms].some((s) => norm(s).includes(q)),
  );
}
