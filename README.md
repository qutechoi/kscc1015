# kscc1015 — 임상검사 단위 변환 · 참고구간 조회

**사이트:** https://qutechoi.github.io/kscc1015/

React + TypeScript + Vite로 만든 정적 웹앱이며 GitHub Pages로 배포됩니다(`.github/workflows/deploy.yml`).

## 기능

### 1. 변환 탭
- 분석물 검색(영문 · 한글 · 동의어, 예: `BUN`, `GOT`, `당화혈색소`)
- 값 · 원본 단위 · 대상 단위 입력 → 결과를 크게 표시하고 바로 아래에 **계산 근거**(방법, 계수, 수식, 유도 과정, 가정, 출처 링크)를 붙임
- 양방향 스왑, 결과 복사
- 근거 없는 변환은 이유와 함께 거부(예: `mg/dL → U/L` 차원 불일치, 비이온 물질의 `mEq/L`, 혼합물 단백의 몰 농도)

### 2. 참고구간 탭
- 분석물 + 나이 + 성별 + 검체 → **공표된 구간만 그대로** 표시(없는 나이 구간은 외삽하지 않음)
- 결과 값 입력 시 LOW / NORMAL / HIGH 판정, 출처 · 검체 · 나이 구간 함께 표시
- 18세 미만은 CALIPER 안내

## 데이터 출처와 역할

| 역할 | 출처 | 앱에서의 사용 |
|---|---|---|
| 단위 변환 엔진 | UCUM / [`@lhncbc/ucum-lhc`](https://github.com/lhncbc/ucum-lhc) | 차원 검사, 스케일, mol↔mass(분자량), mol↔eq(전하) |
| 분자량 | IUPAC/CIAAW 표준 원자량 2021 | 분자식으로부터 **계산** (`src/lib/atomicWeights.ts`). 변환표의 계수를 복사하지 않음 |
| HbA1c | NGSP – IFCC/NGSP master equation (ngsp.org/ifcc.asp) | `NGSP = 0.09148 × IFCC + 2.152` |
| uACR · uPCR | KDIGO 2024 CKD guideline | mg/g ↔ mg/mmol (분모 크레아티닌 MW로 계산) |
| BUN ↔ 요소 | 화학양론(요소 1 mol = N2 1 mol) | MW(N2) vs MW(CH4N2O) |
| 중성지방 | 트리올레인 C57H104O6 가정 | 가정을 근거에 명시 |
| 참고구간(성인) | RCPA Harmonised Reference Intervals – Table 6 | `src/data/referenceIntervals.ts` |
| 참고구간(소아) | CALIPER (caliperproject.ca) | 안내 링크만 |
| 교차 검증(테스트 전용) | Labcorp SI Unit Conversion Table, CMEinfo 변환표, NBME Laboratory Reference Values | `tests/crossValidation.test.ts` 에서만 대조, 앱에는 미포함 |

## 수록하지 못한 자료와 이유 / TODO(verify)

빌드 환경의 네트워크 정책(egress 프록시)이 rcpa.edu.au, ngsp.org, kdigo.org, caliperproject.ca, ciaaw.org, labcorp.com, nbme.org 접속을 거부했습니다. 그래서 아래처럼 처리했습니다.

- **TODO(verify) RCPA Table 6:** 원문 표를 직접 열지 못했습니다. 검색 결과 발췌와 AACB 조화 논문(Koerbin et al.)으로 교차 확인된 성인 구간만 넣었습니다: Na, K, Cl, HCO3, Ca, PO4, Mg, 크레아티닌(남/여, 18–<60세), ALP, LD, CK(남, 18–<60세), ALT(남, P5P 미첨가), 총빌리루빈, 총단백.
- **미수록:** ALT 여성, CK 여성과 60세 이상, AST, GGT, 요소, 요산, RCPA 소아 구간. 수치를 확인하지 못해 비워 두었습니다.
- **미수록:** CALIPER 수치. 사이트에 접속하지 못해 안내 링크만 넣었습니다.
- **TODO(verify) HbA1c 계수**(0.09148, 2.152): NGSP 자료를 인용한 검색 결과로 확인했고, ngsp.org 원문은 열람하지 못했습니다.
- **TODO(verify) KDIGO 2024:** 원문을 열람하지 못했습니다. 변환은 크레아티닌 분자량으로 계산합니다.
- **TODO(verify) IUPAC 원자량:** ciaaw.org에서 직접 재확인하지 못했습니다.
- **TODO(verify) 교차 검증 기대값:** Labcorp, CMEinfo, NBME 원문을 열람하지 못했습니다. 널리 쓰이는 관례 계수로 ±1% 대조만 했습니다.

## 개발

```bash
npm ci
npm test        # Vitest (변환·참고구간·교차검증)
npm run dev
npm run build   # dist/
```

> 교육·참고용 도구입니다. 임상 판단은 소속 검사실의 측정법과 참고구간을 따르십시오.
