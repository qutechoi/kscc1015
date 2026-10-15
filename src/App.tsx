import { useState } from 'react';
import ConvertTab from './components/ConvertTab';
import ReferenceTab from './components/ReferenceTab';

type Tab = 'convert' | 'reference';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  return (
    <div className="app">
      <header>
        <h1>임상검사 단위 변환 · 참고구간</h1>
        <p className="sub">UCUM + IUPAC 분자량으로 계수를 계산하고, 공표된 참고구간만 그대로 보여줍니다.</p>
        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'convert'} className={tab === 'convert' ? 'active' : ''} onClick={() => setTab('convert')}>
            변환
          </button>
          <button role="tab" aria-selected={tab === 'reference'} className={tab === 'reference' ? 'active' : ''} onClick={() => setTab('reference')}>
            참고구간
          </button>
        </nav>
      </header>
      <main>{tab === 'convert' ? <ConvertTab /> : <ReferenceTab />}</main>
      <footer>
        교육·참고용 도구입니다. 임상 판단은 소속 검사실의 측정법과 참고구간을 따르십시오.
      </footer>
    </div>
  );
}
