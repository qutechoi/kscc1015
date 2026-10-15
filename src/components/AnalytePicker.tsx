import { useMemo, useState } from 'react';
import { ANALYTES, searchAnalytes, type Analyte } from '../data/analytes';

interface Props {
  value: string;
  onChange: (id: string) => void;
  filter?: (a: Analyte) => boolean;
}

export default function AnalytePicker({ value, onChange, filter }: Props) {
  const [q, setQ] = useState('');
  const list = useMemo(() => searchAnalytes(q).filter((a) => (filter ? filter(a) : true)), [q, filter]);
  const current = ANALYTES.find((a) => a.id === value);
  return (
    <div className="field">
      <label htmlFor="analyte-search">분석물 검색 (영문 · 한글 · 동의어)</label>
      <input
        id="analyte-search"
        type="search"
        placeholder="예: glucose, 크레아티닌, BUN, A1c, GOT"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="chips" role="listbox" aria-label="분석물">
        {list.map((a) => (
          <button
            key={a.id}
            role="option"
            aria-selected={a.id === value}
            className={a.id === value ? 'chip active' : 'chip'}
            onClick={() => onChange(a.id)}
          >
            {a.en} <span className="ko">{a.ko}</span>
          </button>
        ))}
        {list.length === 0 && <span className="muted">일치하는 분석물이 없습니다.</span>}
      </div>
      {current && (
        <p className="muted small">
          선택: <strong>{current.en}</strong> · {current.ko}
          {current.synonyms.length > 0 && <> · 동의어: {current.synonyms.join(', ')}</>}
        </p>
      )}
    </div>
  );
}
