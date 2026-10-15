declare module '@lhncbc/ucum-lhc' {
  interface UcumUnit {
    csCode_: string;
    name_: string;
    moleExp_: number;
    equivalentExp_: number;
    dim_: { dimVec_: number[] } | null;
  }
  interface ConvertResult {
    status: 'succeeded' | 'failed' | 'error';
    toVal: number | null;
    msg: string[];
    code?: string;
    fromUnit?: UcumUnit;
    toUnit?: UcumUnit;
  }
  interface ValidateResult {
    status: 'valid' | 'invalid' | 'error';
    ucumCode: string | null;
    msg: string[];
    unit?: { code: string; name: string };
  }
  interface UcumLhcUtilsInstance {
    convertUnitTo(
      from: string,
      value: number,
      to: string,
      options?: { molecularWeight?: number; charge?: number; suggest?: boolean },
    ): ConvertResult;
    validateUnitString(unit: string, suggest?: boolean): ValidateResult;
  }
  const ucum: { UcumLhcUtils: { getInstance(): UcumLhcUtilsInstance } };
  export default ucum;
}
