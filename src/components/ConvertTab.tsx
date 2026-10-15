import { useEffect, useMemo, useState } from 'react';
import AnalytePicker from './AnalytePicker';
import Evidence from './Evidence';
import { getAnalyte } from '../data/analytes';
import { convert } from '../lib/convert';
import { sig } from '../lib/format';

export default function ConvertTab() {
  const [analyteId, setAnalyteId] = useState('glucose');
  const analyte = getAnalyte(analyteId)!;
  const [value, setValue] = useState('100');
  const [from, setFrom] = useState(analyte.units[0].label);
  const [to, setTo] = useState(analyte.units[1]?.label ?? analyte.units[0].label);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const a = getAnalyte(analyteId)!;
    setFrom(a.units[0].label);
    setTo(a.units[1]?.label ?? a.units[0].label);
  }, [analyteId]);

  const num = parseFloat(value);
  const result = useMemo(() => (value.trim() === '' ? null : convert(analyteId, num, from, to)), [analyteId, num, from, to, value]);

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (result?.ok) setValue(sig(result.value, 6));
  };

  const copy = async () => {
    if (!result?.ok) return;
    const text = `${analyte.en}: ${value} ${result.fromLabel} = ${sig(result.value, 4)} ${result.toLabel} (${result.evidence.formula})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  const listId = `units-${analyteId}`;
  return (
    <div className="panel">
      <AnalytePicker value={analyteId} onChange={setAnalyteId} />
      <datalist id={listId}>
        {analyte.units.map((u) => (
          <option key={u.label} value={u.label} />
        ))}
      </datalist>
      <div className="row">
        <div className="field">
          <label htmlFor="val">값</label>
          <input id="val" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="from">원본 단위</label>
          <input id="from" list={listId} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <button className="icon" onClick={swap} title="양방향 스왑" aria-label="단위 바꾸기">⇄</button>
        <div className="field">
          <label htmlFor="to">대상 단위</label>
          <input id="to" list={listId} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <p className="muted small">목록에서 고르거나 UCUM 단위를 직접 입력할 수 있습니다 (예: U/L, mEq/L, ug/dL).</p>

      {result && result.ok && (
        <>
          <div className="result">
            <div className="big">
              {sig(result.value, 4)} <span className="unit">{result.toLabel}</span>
            </div>
            <div className="muted">
              {value} {result.fromLabel}
            </div>
            <button onClick={copy}>{copied ? '복사됨 ✓' : '결과 복사'}</button>
          </div>
          <Evidence ev={result.evidence} />
        </>
      )}
      {result && !result.ok && (
        <div className="result rejected" role="alert">
          <strong>변환 거부</strong>
          <p>{result.reason}</p>
          {result.detail && <p className="muted">{result.detail}</p>}
        </div>
      )}
    </div>
  );
}
