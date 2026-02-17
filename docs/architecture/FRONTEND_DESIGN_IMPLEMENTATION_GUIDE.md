# Planner MVP 프론트엔드 설계/구현 가이드

- 버전: v0.2
- 기준일: 2026-02-17
- 범위: 모바일 앱(Expo React Native)

## 1. 설계 목표

1. 첫 진입은 채팅 중심 UX를 유지한다.
2. 하단 탭은 `채팅-캘린더-일지` 3개만 제공한다.
3. 사이드바는 채팅 탭에서만 노출한다.
4. 기획에서 정의한 캘린더 모드(`전체일정/개별일정`)와 일지 모아보기(`일정별/유형별`)를 프론트 구조에 고정한다.

## 2. IA(정보구조)

1. Root Stack
- MainTabs
- Settings
- Trash

2. MainTabs
- Chat (채팅)
- Calendar (캘린더)
- Journal (일지)

3. 사이드바 접근
- Chat 화면에서만 `menu` 버튼으로 오픈
- 사이드바에서 플랜 선택/추가, 설정/휴지통 이동

## 3. 화면별 핵심 설계

## 3.1 채팅

1. 플랜 미선택 상태
- 중앙 플랜 카드 리스트 노출
- 카드 정보: 제목, 목적지, 일정 기간, 해외 여부 아이콘

2. 플랜 선택 상태
- 메시지 타임라인 + 변경안 카드(등록/수정/취소)
- 하단 컴포저: 이미지 첨부 버튼 + 메시지 입력 + 전송

3. 사이드바
- 최신 수정순 플랜 목록
- 새 일정 만들기
- 설정/휴지통 이동

## 3.2 캘린더

1. 모드 드롭다운
- 전체일정: 플랜별 기간 블록
- 개별일정: 일자별 이벤트 블록 적층(최대 3개 + `+N`)

2. 일자 선택 하단 패널
- 해당 일자 이벤트 전체 목록
- 해당 일자 메모

## 3.3 일지

1. 뷰 모드
- 일정별 모아보기
- 유형별 모아보기

2. 권한 거부 UX
- 문구: `갤러리에 접근해야 일지를 만들 수 있어요`
- 버튼: `갤러리 권한 승인하기`

3. 일지 카드
- 이미지 슬롯(없으면 placeholder)
- 텍스트 본문
- 자동/수동 태그
- 수정/삭제 액션

## 3.4 설정

1. 계정 섹션(로그인 공급자)
2. 일지 옵션(`데이터가 없어도 생성`) 토글
3. 갤러리 권한 상태 및 승인 버튼

## 3.5 휴지통

1. 30일 보관 정책 문구
2. 삭제 항목 목록(삭제일/완전삭제일)
3. 복구 버튼

## 4. 디자인 시스템

## 4.1 토큰

1. 색상
- 기본 배경: 따뜻한 페이퍼 톤
- 강조색: 오렌지 계열
- 8개 이벤트 팔레트 고정

2. 타이포
- Display: `Do Hyeon`
- Body: `Noto Sans KR`

3. 형태
- 중간 이상 라운드 카드
- 얕은 테두리 + 명확한 정보 레이어

## 4.2 시각 방향

1. 과도한 그라디언트/네온 대신 `여행 수첩 + 핀보드` 톤
2. 배경 오브(orb)와 카드 대비로 깊이 확보
3. 핵심 인터랙션은 버튼 색 대비와 카드 상태 변화로 표현
4. 공통 프리미티브(카드/버튼/칩/세그먼트/헤더/빈상태)로 화면 간 일관성을 강제

## 4.3 레이아웃 안정화 보정

1. Safe Area 기준 상단 여백 통일(`AppScreen`)
2. 채팅 입력바의 하단 탭/키보드 충돌 보정
3. 캘린더 하단 상세 패널을 절대배치에서 컬럼 레이아웃으로 변경해 겹침 제거
4. 반복 스타일을 공통 컴포넌트로 이전해 화면별 깨짐 분산 방지

## 5. 상태 구조(프론트)

1. 전역 컨텍스트: `PlannerContext`
- plans / activePlanId / sortedPlans
- messagesByPlan
- eventsByPlan / dayMemosByPlan
- journals
- settings
- trashItems

2. 핵심 액션
- `setActivePlanId`
- `createPlanQuick`
- `appendMessage`
- `toggleJournalGenerateWithoutData`
- `setGalleryPermissionState`
- `restoreTrashItem`

## 6. 코드 매핑

1. 엔트리
- `mobile/app/App.tsx`
- `mobile/app/index.ts`

2. 네비게이션
- `mobile/app/src/navigation/AppNavigator.tsx`
- `mobile/app/src/navigation/types.ts`

3. 화면
- `mobile/app/src/screens/ChatScreen.tsx`
- `mobile/app/src/screens/CalendarScreen.tsx`
- `mobile/app/src/screens/JournalScreen.tsx`
- `mobile/app/src/screens/SettingsScreen.tsx`
- `mobile/app/src/screens/TrashScreen.tsx`

4. 상태/데이터/토큰
- `mobile/app/src/context/PlannerContext.tsx`
- `mobile/app/src/data/mock.ts`
- `mobile/app/src/theme/tokens.ts`
- `mobile/app/src/types/domain.ts`
- `mobile/app/src/utils/format.ts`

5. 공통 컴포넌트
- `mobile/app/src/components/layout/AppScreen.tsx`
- `mobile/app/src/components/common/ScreenTitle.tsx`
- `mobile/app/src/components/common/SurfaceCard.tsx`
- `mobile/app/src/components/common/AppButton.tsx`
- `mobile/app/src/components/common/FilterChip.tsx`
- `mobile/app/src/components/common/SegmentedSwitch.tsx`
- `mobile/app/src/components/common/EmptyState.tsx`

## 7. 현재 한계(다음 단계)

1. 현재는 목업 데이터 기반이며 백엔드 API 연동 전 단계다.
2. 캘린더 월 단위 실제 그리드와 timezone 정밀 계산은 추가 구현이 필요하다.
3. OCR/이미지 업로드/권한 OS deep-link는 실제 디바이스 동작으로 확장해야 한다.
4. 사이드바-설정-휴지통 전환은 구현되어 있으나, 상세 편집 플로우는 후속 작업 대상이다.
