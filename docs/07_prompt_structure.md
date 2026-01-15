# 프롬프트 구조 설명

## 개요

ThreadAuto는 이제 **기본 프롬프트**와 **커스텀 프롬프트**를 분리하여 관리합니다.

## 구조

### 1. 기본 프롬프트 (Base Prompt)
- **위치**: `apps/desktop/src/main/store.ts`의 `basePrompt` 상수
- **적용**: 모든 게시물 타입에 자동으로 적용
- **UI 표시**: 설정 페이지에 표시되지 않음
- **내용**:
  - Role: kimppopp_ 페르소나
  - Style: 자신감 있고 비격식적인 한국어
  - Rules: 문장 구조, 길이, FOMO 생성 등

```typescript
const basePrompt = `[Role] You are kimppopp_, an expert in vibe coding and AI on Threads SNS.
[Style] Use confident, informal Korean. Be like a tough mentor with occasional warmth.
[Rules]
- One sentence per line, max 30 Korean characters per line
- Use numbers and results for authority
- Create FOMO (fear of missing out)
- First line must hook with benefits (money, time, free credits)
- End with CTA for likes/reposts`
```

### 2. 커스텀 프롬프트 (Custom Prompt)
- **위치**: 사용자 설정 (`config.prompts`)
- **적용**: 각 게시물 타입별로 다름
- **UI 표시**: 설정 페이지에서 수정 가능
- **내용**: 각 타입의 특성을 정의

#### 기본 커스텀 프롬프트:
- **ag**: `[Type] Aggro type - broad topics to increase reach, strong first-line hook`
- **pro**: `[Type] Proof type - demonstrate your abilities, convert interested readers`
- **br**: `[Type] Branding type - share values, stories, build brand connection`
- **in**: `[Type] Insight type - detailed vibe coding information and insights`

## 동작 방식

### API 요청 시
1. `getFullPrompt(type)` 함수 호출
2. 기본 프롬프트 + 커스텀 프롬프트 조합
3. 조합된 전체 프롬프트를 Gemini API에 전송

```typescript
export function getFullPrompt(type: 'ag' | 'pro' | 'br' | 'in'): string {
  const config = getConfig()
  const customPrompt = config.prompts[type]
  return `${basePrompt}\n${customPrompt}`
}
```

### 설정 UI에서
- 사용자는 커스텀 프롬프트만 보고 수정
- 기본 프롬프트는 자동으로 적용된다는 안내 메시지 표시
- 각 타입별 탭으로 전환하여 수정 가능

## 장점

1. **일관성**: 모든 게시물에 공통 규칙 자동 적용
2. **간결성**: UI가 깔끔하고 핵심만 표시
3. **유연성**: 타입별 특성은 자유롭게 커스터마이징
4. **유지보수**: 공통 규칙 변경 시 한 곳만 수정

## 파일 변경 사항

### 수정된 파일:
1. `apps/desktop/src/main/store.ts`
   - `basePrompt` 상수 추가
   - `defaultPrompts`를 간결하게 수정
   - `getFullPrompt()` 함수 추가

2. `apps/desktop/src/main/ipc.ts`
   - `getFullPrompt()` import 추가
   - 게시물 생성 시 `getFullPrompt(type)` 사용

3. `apps/desktop/src/renderer/components/SettingsPage.tsx`
   - 프롬프트 섹션에 안내 메시지 추가
   - textarea 높이 조정 (12 → 8 rows)
