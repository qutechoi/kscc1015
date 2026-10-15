import type { Evidence as Ev } from '../lib/convert';

export default function Evidence({ ev }: { ev: Ev }) {
  return (
    <section className="evidence" aria-label="계산 근거">
      <h3>계산 근거</h3>
      <dl>
        <dt>방법</dt>
        <dd>{ev.method}</dd>
        {ev.factor !== undefined && (
          <>
            <dt>계수</dt>
            <dd className="mono">{ev.factor.toPrecision(8).replace(/\.?0+$/, '')}</dd>
          </>
        )}
        <dt>수식</dt>
        <dd className="mono">{ev.formula}</dd>
        {ev.steps.length > 0 && (
          <>
            <dt>유도</dt>
            <dd>
              <ol>
                {ev.steps.map((s, i) => (
                  <li key={i} className="mono">{s}</li>
                ))}
              </ol>
            </dd>
          </>
        )}
        {ev.assumptions.length > 0 && (
          <>
            <dt>가정</dt>
            <dd>
              <ul>
                {ev.assumptions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
        <dt>출처</dt>
        <dd>
          <ul>
            {ev.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a>
                {s.verify && <span className="badge warn" title="빌드 환경에서 원문을 직접 열람하지 못함">TODO(verify)</span>}
              </li>
            ))}
          </ul>
        </dd>
      </dl>
    </section>
  );
}
