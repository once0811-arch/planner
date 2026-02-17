# Planner MVP QA Test Plan and Execution Report

- Date: 2026-02-17 17:16:21 KST
- Branch: `main`
- Baseline commit: `4716595`
- Scope: Mobile app pages (`로그인/OAuth`, `채팅`, `캘린더`, `일지`, `설정`, `휴지통`) + backend functions + scheduler policies

## 1. QA Objective

1. 페이지/기능 기준으로 기획 의도 대비 구현 정합성을 검증한다.
2. 시나리오(정상/예외/정책) 기준으로 실제 동작 가능성을 검증한다.
3. 출시 전 우선 수정이 필요한 결함을 심각도 기준으로 분류한다.

## 2. Test Environment

| Item | Value |
|---|---|
| OS | macOS (local dev) |
| Node | v24.13.1 |
| Firebase project | `planner-f0256` |
| Mobile stack | Expo 54, React Native 0.81.5 |
| Backend stack | Firebase Functions v2, Firestore, Scheduler |
| Emulator requirement | JDK 21+ |

## 3. Test Strategy

1. 자동검증: 환경/타입/백엔드 테스트/에뮬레이터 부팅.
2. 빌드검증: 모바일 번들 export(Android/iOS).
3. 기능검증: 화면 코드/도메인 로직 기반 시나리오 실행.
4. 정책검증: 문서 정책(03:00/08:00, 휴지통 03:00 purge, 승인형 반영)과 코드 비교.

## 4. Automated Test Execution

| ID | Command | Result | Note |
|---|---|---|---|
| A-01 | `npm run check:all` | PASS | env/backend/mobile/emulator 전체 통과 |
| A-02 | `npm --prefix backend/functions run build` | PASS | TS 빌드 통과 |
| A-03 | `npx expo export --platform android --output-dir /tmp/planner-android-export` | PASS | Android bundle 생성 완료 |
| A-04 | `npx expo export --platform ios --output-dir /tmp/planner-ios-export` | PASS | iOS bundle 생성 완료 |
| A-05 | `npx expo export --platform web --output-dir /tmp/planner-web-export` | FAIL | `react-dom`, `react-native-web` 의존성 누락 |

## 5. Page and Feature QA Matrix

| Area | Test Item | Expected | Result |
|---|---|---|---|
| 로그인/OAuth | 로그인 화면 및 OAuth 진입 | PRD 1뎁스 화면 제공 | FAIL (화면/라우트 미구현) |
| 채팅 | 앱 첫 진입 시 플랜 선택형 빈 채팅 | 중앙 플랜 리스트 노출 | PASS |
| 채팅 | 플랜 최신 수정순 정렬 | 최근 수정 플랜 상단 | PASS |
| 채팅 | 변경안 카드 `등록/수정/취소` | 사용자 승인 후 반영 | FAIL (버튼 핸들러 없음) |
| 채팅 | 채팅 화면 내 사이드바 | 플랜 전환 + 설정/휴지통 이동 | PASS |
| 캘린더 | 모드 드롭다운(`전체/개별`) | 모드 전환 동작 | PASS |
| 캘린더 | 개별일정 블록 적층 | 최대 3개 + `+N` | PASS |
| 캘린더 | 일자 선택 하단 상세 | 이벤트+메모 노출 | PASS |
| 캘린더 | 날짜 처리 | 로컬 날짜 정확 표시 | FAIL (KST에서 오프셋 오류) |
| 일지 | 탭 구성/모아보기 | 일정별/유형별 필터 | PASS |
| 일지 | 권한 거부 UX | 문구 + 승인 버튼 노출 | PASS |
| 일지 | 일지 카드 `수정/삭제` | 편집/삭제 동작 | FAIL (버튼 핸들러 없음) |
| 일지(자동생성) | 03:00 생성/08:00 공개 + 핵심 5개 이벤트 선정 | 정책 반영 생성 | PARTIAL (스케줄/공개만 구현, 생성 로직 미구현) |
| 설정 | 일지 옵션/권한 상태 | 토글 및 상태 확인 | PASS |
| 휴지통 | 30일 정책 + 복구 | 복구 동작 및 만료 삭제 | PASS (정책/함수 기준) |

## 6. Scenario Plan and Execution

| Scenario | Plan | Execution Result |
|---|---|---|
| S-01 신규 사용자 진입 | 로그인 → OAuth → 메인 진입 | FAIL: 로그인/OAuth 화면 자체 없음 |
| S-02 플랜 선택 후 채팅 수정 | 플랜 선택 → 메시지 입력 → 변경안 승인 | PARTIAL: 메시지/제안카드 생성은 되나 승인 액션 미동작 |
| S-03 캘린더 확인 | 전체일정 조회 → 개별일정 전환 → 날짜 상세 확인 | PARTIAL: UI 동작은 정상, 날짜 계산이 KST에서 하루 밀림 |
| S-04 권한 거부 일지 | 권한 거부 상태에서 일지 탭 진입 | PASS: 지정 문구/CTA 노출 확인 |
| S-05 자동 일지 생성 | 플랜 기준 03:00 생성, 08:00 공개, 중요 이벤트 상위 5개 반영 | PARTIAL: 스케줄 실행은 가능, 이벤트 선정/콘텐츠 생성 미구현 |
| S-06 삭제/복구 플로우 | 삭제 → 휴지통 이동 → 복구 → 30일 purge | PARTIAL: backend 정책 구현됨, 화면 삭제 액션/확인팝업 미구현 |

## 7. Defects and Gaps (Priority)

### P0

1. **캘린더/휴지통 날짜가 KST에서 하루 밀림**
- Evidence:
  - `dateRange()`가 로컬 Date를 `toISOString()`으로 잘라서 날짜를 생성함: `mobile/app/src/utils/format.ts:10`
  - `formatDateFromMs()`도 동일 방식 사용: `mobile/app/src/utils/format.ts:21`
- Repro:
  - `TZ=Asia/Seoul node -e "const {dateRange}=require('./mobile/app/src/utils/format.ts'); console.log(dateRange('2026-03-01','2026-03-03'))"`
  - 결과: `['2026-02-28', '2026-03-01', '2026-03-02']`

2. **로그인/OAuth 1뎁스 화면 미구현**
- Evidence:
  - 루트 네비게이션에 `MainTabs/Settings/Trash`만 존재: `mobile/app/src/navigation/AppNavigator.tsx:68`
  - 타입 정의에도 로그인 라우트 없음: `mobile/app/src/navigation/types.ts:7`

3. **채팅 변경 승인 핵심 액션 미동작**
- Evidence:
  - `등록/수정/취소` 버튼 핸들러 비어 있음: `mobile/app/src/screens/ChatScreen.tsx:52`

### P1

1. **일지 카드 수정/삭제 미동작**
- Evidence:
  - `수정/삭제` 버튼 핸들러 비어 있음: `mobile/app/src/screens/JournalScreen.tsx:135`

2. **자동 일지 생성 정책 미구현**
- Expected: `임시 제외`, `확정/완료/빈값 대상`, 중요도 상위 5개 이벤트 선정
- Actual:
  - 생성 단계에서 고정 summary + 빈 `selectedEventIds`만 기록: `backend/functions/src/jobs/runner.ts:26`

3. **이벤트 색상 랜덤 배정 불일치**
- Expected: 랜덤 8팔레트
- Actual:
  - `planCount % 8` 순차 배정: `mobile/app/src/context/PlannerContext.tsx:50`

### P2

1. **문서 정합성 이슈: 다기기 동기화 관련 문구 잔존**
- Evidence:
  - 비목표에 `다기기 동기화`가 남아 있음: `docs/architecture/MVP_ARCHITECTURE_AND_REVIEW.md:15`
  - 본문에도 동기화 섹션 존재: `docs/architecture/MVP_ARCHITECTURE_AND_REVIEW.md:242`

2. **웹 타깃 구성 불완전**
- Evidence:
  - `app.json`에 web config 존재: `mobile/app/app.json:26`
  - `web` 실행 스크립트 존재: `mobile/app/package.json:9`
  - 필수 의존성(`react-dom`, `react-native-web`) 누락으로 web export 실패

## 8. QA Conclusion

1. **핵심 인프라(환경/빌드/백엔드 기본 테스트)는 통과**했으나, MVP 사용자 경로 기준 P0/P1 결함이 남아 있어 즉시 출시 가능한 상태는 아니다.
2. 우선순위는 `날짜 처리 정합성` → `로그인/OAuth 진입` → `채팅 승인/일지 편집 액션 연결` → `자동 일지 생성 규칙 구현` 순서가 적절하다.
3. 위 결함 보정 후 동일 시나리오(S-01~S-06) 회귀 테스트가 필요하다.

## 9. P0 Remediation Addendum (2026-02-17)

| P0 ID | Action | Result |
|---|---|---|
| P0-1 날짜 오프셋 | `dateRange`, `formatDateFromMs`를 UTC 의존 방식에서 로컬 캘린더 기준으로 수정 | PASS |
| P0-2 로그인/OAuth 진입 | 로그인 화면(`Login`) 추가 + 세션 상태 기반 루트 플로우 분기 적용 | PASS |
| P0-3 제안 승인 버튼 | 채팅 제안 카드 `등록/수정/취소` 액션 연결 및 상태 반영 로직 추가 | PASS |

재검증:
1. `node --test mobile/app/test/format.test.js` PASS
2. `node --test mobile/app/test/auth-flow.test.js` PASS
3. `node --test mobile/app/test/proposal-actions.test.js` PASS
4. `npm run check:all` PASS

## 10. P1 Remediation Addendum (2026-02-17)

| P1 ID | Action | Result |
|---|---|---|
| P1-1 일지 수정/삭제 | 일지 카드 수정 인라인 편집 + 삭제 확인 팝업 + 상태 반영 연결 | PASS |
| P1-2 자동 일지 생성 규칙 | `temporary` 제외, 중요도 기반 상위 5개 `selectedEventIds` 선정 로직 반영 | PASS |
| P1-3 랜덤 색상 | 프론트 빠른 생성/백엔드 이벤트 생성 기본 색상 랜덤화 | PASS |

재검증:
1. `node --test mobile/app/test/journal-actions.test.js` PASS
2. `node --test mobile/app/test/color-policy.test.js` PASS
3. `npm --prefix backend/functions test` PASS
4. `npm run check:all` PASS
