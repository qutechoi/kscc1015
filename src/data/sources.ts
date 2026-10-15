export interface Source {
  label: string;
  url: string;
  /** true when the page could not be opened from the build environment and content needs re-checking */
  verify?: boolean;
}

export const SOURCES = {
  ucum: { label: 'UCUM (Unified Code for Units of Measure) / @lhncbc/ucum-lhc', url: 'https://ucum.org/' },
  ucumLhc: { label: 'NLM LHC ucum-lhc library', url: 'https://github.com/lhncbc/ucum-lhc' },
  iupac: { label: 'IUPAC/CIAAW Standard Atomic Weights', url: 'https://www.ciaaw.org/atomic-weights.htm', verify: true },
  ngsp: { label: 'NGSP – IFCC/NGSP master equation', url: 'https://ngsp.org/ifcc.asp', verify: true },
  kdigo: {
    label: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
    verify: true,
  },
  rcpaTable6: {
    label: 'RCPA Manual – Table 6: Harmonised reference intervals for chemical pathology',
    url: 'https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem',
    verify: true,
  },
  caliper: { label: 'CALIPER – Canadian Laboratory Initiative on Paediatric Reference Intervals', url: 'https://caliperproject.ca/', verify: true },
} satisfies Record<string, Source>;
