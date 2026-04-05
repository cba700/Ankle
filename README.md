# 앵클

서울 한강 코트를 중심으로 운영하는 농구 소셜 매치 서비스입니다. 사용자는 공개된 매치를 둘러보고, 카카오 로그인 후 참가 신청을 남기고, 마이페이지에서 신청 내역을 확인할 수 있습니다. 운영자는 관리자 화면에서 경기장과 매치를 관리합니다.

이 문서는 `dev` 브랜치 기준 현재 구현 상태를 정리한 README입니다.

## 한눈에 보기

- 공개 홈에서 날짜별 매치를 탐색할 수 있습니다.
- 매치 상세에서 장소, 레벨, 운영 방식, 환불 기준을 확인할 수 있습니다.
- 로그인은 Supabase Auth 기반 카카오 OAuth로 연결됩니다.
- 로그인한 사용자는 매치 신청 상태를 저장할 수 있습니다.
- 마이페이지에서 프로필과 신청 내역을 확인할 수 있습니다.
- 관리자 계정은 `/admin` 이하에서 경기장과 매치를 생성·수정할 수 있습니다.

## 현재 서비스 범위

### 사용자 기능

- 홈: 날짜별 매치 목록, 빠른 필터 UI, 주요 CTA 제공
- 매치 상세: 코트 정보, 참가 조건, 레벨 분포, 규칙, 환불 정책 노출
- 로그인: 카카오 로그인, 로그인 후 원래 보던 경로로 복귀
- 신청: 체크리스트 확인 후 참가 신청 저장
- 마이페이지: 프로필, 신청 내역, 상태 라벨 확인

### 운영 기능

- 관리자 대시보드: 모집 중, 임시 저장, 마감 임박, 예상 신청 매출 요약
- 경기장 관리: 경기장 생성/수정, 기본 이미지·규칙·안전 안내 관리
- 매치 관리: 매치 생성/수정, 상태 변경, 수용 인원/가격/노출 정보 관리
- 운영 취소 처리: 매치를 `cancelled`로 바꾸면 확정 신청을 `cancelled_by_admin`으로 변경

### 아직 연결되지 않은 영역

- 결제는 아직 연결되지 않았습니다. 현재는 신청 상태만 저장합니다.
- 관심 매치 저장은 UI 상태만 있고 서버에 영구 저장되지 않습니다.
- 상세 화면의 자리 맡기, FAQ/취소 걱정 안내는 다음 단계용 플레이스홀더입니다.

## 사용자 흐름

1. 사용자가 홈(`/`)에서 날짜별 매치를 확인합니다.
2. 매치 상세(`/match/[slug]`)에서 일정, 장소, 레벨, 규칙, 환불 정책을 읽습니다.
3. 신청 화면(`/match/[slug]/apply`)으로 이동하면 로그인 여부를 확인합니다.
4. 비로그인 상태면 `/login`으로 이동하고, 카카오 로그인 후 다시 신청 화면으로 돌아옵니다.
5. 체크리스트 3개를 모두 확인하면 `/api/matches/[matchId]/applications`를 통해 신청이 저장됩니다.
6. 저장된 신청 내역은 `/mypage`에서 확인할 수 있습니다.

## 관리자 흐름

1. 관리자 권한 사용자가 `/admin`에 접근합니다.
2. `profiles.role = 'admin'` 또는 사용자 메타데이터의 `role = 'admin'`이면 관리자 화면에 진입합니다.
3. `/admin/venues`에서 경기장을 관리하고, `/admin/matches`에서 매치를 운영합니다.
4. 경기장 기본값은 새 매치 작성 시 재사용할 수 있습니다.
5. 시작 시간이 지난 공개 매치는 DB 함수 `close_started_matches()`로 자동 마감 처리됩니다.

## 기술 스택

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase SSR / Auth / Postgres
- CSS Modules

## 프로젝트 구조

```text
.
├── src/app
│   ├── page.tsx                    # 홈
│   ├── login/page.tsx              # 로그인
│   ├── mypage/page.tsx             # 마이페이지
│   ├── match/[slug]/page.tsx       # 매치 상세
│   ├── match/[slug]/apply/page.tsx # 매치 신청
│   └── admin/**                    # 관리자 화면
├── src/components
│   ├── home                        # 홈 UI
│   ├── login                       # 로그인 UI
│   ├── match                       # 매치 상세/신청 UI
│   └── mypage                      # 마이페이지 UI
├── src/features/admin              # 관리자 폼, 뷰모델, 서버 액션
├── src/lib                         # 데이터 조회, 인증, Supabase 연동
├── supabase/migrations             # 서비스용 DB 스키마
└── public                          # 코트 이미지 에셋
```

## 라우트 맵

| 경로 | 설명 | 접근 조건 |
| --- | --- | --- |
| `/` | 홈, 공개 매치 목록 | 모두 |
| `/login` | 카카오 로그인 | 모두 |
| `/match/[slug]` | 매치 상세 | 모두 |
| `/match/[slug]/apply` | 매치 신청 | 로그인 필요 |
| `/mypage` | 신청 내역/프로필 | 로그인 필요 |
| `/admin` | 관리자 대시보드 | 관리자 필요 |
| `/admin/matches` | 매치 목록/운영 | 관리자 필요 |
| `/admin/venues` | 경기장 목록/관리 | 관리자 필요 |

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`를 기준으로 `.env.local`을 채웁니다.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

현재 앱 코드에서 실질적으로 읽는 값은 아래 두 개입니다.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 없으면 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 대체값으로 사용합니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 주소는 `http://localhost:3000`입니다.

## Supabase 연동 메모

### 필수 마이그레이션

아래 순서대로 적용되어 있어야 현재 `dev` 브랜치 기능과 맞습니다.

1. `20260402233000_create_profiles.sql`
2. `20260403150000_create_matches_backend.sql`
3. `20260403183000_add_venue_defaults_and_match_snapshots.sql`
4. `20260403190000_close_started_open_matches.sql`

### 주요 테이블 / 뷰 / 함수

- `profiles`: 사용자 프로필과 역할(`user`, `admin`)
- `venues`: 경기장 정보와 기본 운영값
- `matches`: 공개 매치와 관리자 운영 데이터
- `match_applications`: 사용자 신청 상태
- `match_application_counts`: 확정 신청 수 집계 뷰
- `apply_to_match(uuid)`: 신청 저장 RPC
- `cancel_match_application(uuid)`: 사용자 신청 취소 RPC
- `close_started_matches()`: 시작된 공개 매치 자동 마감 RPC

### 인증

- 로그인 공급자는 카카오입니다.
- 서버/브라우저 모두 Supabase SSR 클라이언트를 사용합니다.
- `proxy.ts`에서 세션 동기화를 수행합니다.

## Supabase가 없을 때의 동작

- 홈과 공개 매치 상세는 목업 데이터로 렌더링됩니다.
- 로그인 버튼은 비활성화됩니다.
- 마이페이지와 관리자 화면은 사용할 수 없습니다.
- 실제 신청 저장 API는 `503 SUPABASE_NOT_CONFIGURED`를 반환합니다.

## 개발 스크립트

```bash
npm run dev
npm run build
npm run start
npm run typecheck
```

## 참고

- 서비스 카피와 UI는 "서울 한강 농구 소셜 매치" 경험에 맞춰져 있습니다.
- README는 현재 코드 기준 설명서입니다. 기획 문서가 아니라 실제 동작을 우선해 적었습니다.
