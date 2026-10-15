import { useMemo, useState } from 'react';
import AnalytePicker from './AnalytePicker';
import { getAnalyte, type Analyte } from '../data/analytes';
import { REFERENCE_INTERVALS, MISSING_DATA, lookupInterval, interpret, type Sex, type Specimen } from '../data/referenceIntervals';
import { SOURCES } from '../data/sources';
import { convert } from '../lib/convert';
import { sig } from '../lib/format';

const SPECIMENS: { v: Specimen; ko: string }[] = [
  { v: 'serum', ko: '혈청' },
  { v: 'plasma', ko: '혈장' },
  { v: 'urine', ko: '소변' },
  { v: 'whole-blood', ko: '전혈' },
];
const FLAG_KO = { low: 'LOW (낮음)', normal: 'NORMAL (참고구간 내)', high: 'HIGH (높음)' } as const;

const hasRI = (a: Analyte) => REFERENCE_INTERVALS.some((r) => r.analyteId === a.id);

export default function ReferenceTab() {
  const [analyteId, setAnalyteId] = useState('sodium');
  const [age, setAge] = useState('40');
  const [sex, setSex] = useState<Sex>('M');
  const [specimen, setSpecimen] = useState<Specimen>('serum');
  const [val, setVal] = useState('');
  const [valUnit, setValUnit] = useState('');
  const [showAll, setShowAll] = useState(false);
  const analyte = getAnalyte(analyteId)!;
  const ageN = parseFloat(age);

  const res = useMemo(
    () => (Number.isFinite(ageN) && ageN >= 0 ? lookupInterval({ analyteId, ageYears: ageN, sex, specimen }) : null),
    [analyteId, ageN, sex, specimen],
  );

  const ri = res && res.found ? res.interval : null;
  const unitForInput = valUnit || ri?.unit || '';
  let judged: { flag: ReturnType<typeof interpret>; inRiUnit: number; note?: string } | null = null;
  let judgeError: string | null = null;
  if (ri && val.trim() !== '') {
    const x = parseFloat(val);
    if (!Number.isFinite(x)) judgeError = '숫자를 입력하세요.';
    else if (!unitForInput || unitForInput === ri.unit) judged = { flag: interpret(x, ri), inRiUnit: x };
    else {
      const c = convert(analyteId, x, unitForInput, ri.ucum);
      if (c.ok) judged = { flag: interpret(c.value, ri), inRiUnit: c.value, note: `${x} ${unitForInput} → ${sig(c.value, 4)} ${ri.unit} (${c.evidence.formula})` };
      else judgeError = c.reason;
    }
  }

  return (
    <div className="panel">
      <label className="toggle">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> 참고구간이 없는 분석물도 목록에 표시
      </label>
      <AnalytePicker value={analyteId} onChange={(id) => { setAnalyteId(id); setValUnit(''); }} filter={showAll ? undefined : hasRI} />
      <div className="row">
        <div className="field">
          <label htmlFor="age">나이 (세)</label>
          <input id="age" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="sex">성별</label>
          <select id="sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="spec">검체</label>
          <select id="spec" value={specimen} onChange={(e) => setSpecimen(e.target.value as Specimen)}>
            {SPECIMENS.map((s) => (
              <option key={s.v} value={s.v}>{s.ko}</option>
            ))}
          </select>
        </div>
      </div>

      {res && !res.found && (
        <div className="result rejected" role="status">
          <strong>공표된 참고구간 없음</strong>
          <p>{res.reason}</p>
          {res.pediatric && (
            <p>
              18세 미만 소아는 <a href={SOURCES.caliper.url} target="_blank" rel="noreferrer">CALIPER (caliperproject.ca)</a>의
              나이·성별별 소아 참고구간을 확인하십시오. 이 앱은 CALIPER 수치를 수록하지 않습니다(원문 미열람, 임의 입력 금지).
            </p>
          )}
        </div>
      )}

      {ri && (
        <div className="result">
          <div className="big">
            {ri.low ?? '—'} – {ri.high ?? '—'} <span className="unit">{ri.unit}</span>
          </div>
          <dl className="meta">
            <dt>분석물</dt><dd>{analyte.en} · {analyte.ko}</dd>
            <dt>나이 구간</dt><dd>{ri.ageMin}세 이상 – {ri.ageMax}세 미만</dd>
            <dt>성별</dt><dd>{ri.sex === 'M' ? '남' : ri.sex === 'F' ? '여' : '공통'}</dd>
            <dt>검체</dt><dd>{ri.specimens.map((s) => SPECIMENS.find((x) => x.v === s)?.ko).join(' / ')}</dd>
            <dt>출처</dt>
            <dd>
              <a href={ri.source.url} target="_blank" rel="noreferrer">{ri.source.label}</a>
              {ri.verify && <span className="badge warn" title="원문 미열람: 검색 결과 발췌로만 교차 확인">TODO(verify)</span>}
            </dd>
            {ri.note && (<><dt>비고</dt><dd>{ri.note}</dd></>)}
          </dl>

          <div className="row judge">
            <div className="field">
              <label htmlFor="rv">환자 결과 값</label>
              <input id="rv" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder="결과 입력" />
            </div>
            <div className="field">
              <label htmlFor="ru">단위</label>
              <select id="ru" value={unitForInput} onChange={(e) => setValUnit(e.target.value)}>
                <option value={ri.unit}>{ri.unit}</option>
                {analyte.units.filter((u) => u.label !== ri.unit && u.ucum !== ri.ucum).map((u) => (
                  <option key={u.label} value={u.label}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
          {judged && (
            <div className={`flag ${judged.flag}`}>
              판정: <strong>{FLAG_KO[judged.flag]}</strong>
              {judged.note && <div className="small mono">{judged.note}</div>}
            </div>
          )}
          {judgeError && <div className="flag high">{judgeError}</div>}
        </div>
      )}

      <details className="missing">
        <summary>수록하지 못한 자료와 이유</summary>
        <ul>
          {MISSING_DATA.map((m) => (
            <li key={m.what}><strong>{m.what}</strong> — {m.why}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
