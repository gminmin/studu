# tudu Firebase 로그인 구현 계획

## 목표

Firebase Authentication으로 계정을 만들고 로그인한 사용자의 학습 데이터를 계정에 연결한다. 기존 모바일 학습 흐름은 유지하면서 로그인 여부에 따라 계정 화면과 데이터 저장 방식을 단계적으로 추가한다. 우선 Google 로그인을 출시하고, 이메일 로그인은 필요성과 지원 부담을 검토한 뒤 확장한다.

## 현재 상태

- Next.js 16 App Router와 React 19를 사용한다.
- 앱에는 인증, 사용자 프로필, 서버 세션이 아직 없다.
- 오답노트와 Gemini 사용자 API 키는 현재 브라우저 `localStorage`에 저장된다. 서버 키 방식으로 전환할 때 API 키 설정 UI와 로컬 키 사용을 제거한다.
- 분석 API는 현재 요청 헤더의 사용자 Gemini 키를 받을 수 있으며 사용자 인증을 요구하지 않는다. 이 경로는 서버 전용 Gemini 키 구조로 전환할 예정이다.
- 크레딧·토큰의 계정 지갑과 Cloud Firestore는 설계 단계다.
- Firebase 프로젝트 `tudu-e5bf2`와 웹 앱 설정을 받았고, 웹 설정은 로컬 `.env.local`에 연결했다. 운영 도메인은 `tudu1.xyz`다.
- Google 로그인 제공자 활성화, `tudu1.xyz` 승인 도메인 등록, 서버 Admin SDK 자격 증명 연결은 Firebase Console/배포 환경에서 마무리해야 한다.

## 첫 로그인 범위

## Gemini API 호출 방식 결정

**사용자 앱 → tudu 서버 → Gemini API → tudu 서버 → 사용자 앱** 구조로 운영한다.

- Gemini API 키는 서버 환경의 비밀 설정에만 저장한다. `NEXT_PUBLIC_*`, 브라우저 코드, Firestore 사용자 문서에 넣지 않는다.
- 앱은 문제 입력과 인증 토큰을 tudu 서버에 보내고, 서버가 Firebase ID 토큰을 검증한 뒤 Gemini에 요청한다.
- 서버는 Gemini 응답에서 앱에 필요한 분석 결과만 반환한다. Gemini API 키, 내부 오류 상세, 자격 증명은 응답과 로그에서 제외한다.
- 분석 서버는 사용자 인증, 모드별 비용, 크레딧 잔액, 사용자별 사용 제한과 요청 멱등성을 적용할 수 있는 경계로 둔다.
- 현재 `x-gemini-api-key` 헤더와 사용자 BYOK 설정 UI는 기본 경로에서 제거한다. 사용자가 자신의 키를 입력하거나 계정에 저장하는 기능은 제공하지 않는다.
- 개발·운영 환경마다 별도 서버 키와 Firebase 프로젝트를 사용하고, 키를 교체할 수 있도록 배포 비밀 설정에서 관리한다.

크레딧 차감은 분석 성공 시 확정하는 것을 기본으로 하되, 동시 요청과 중복 재시도를 방지하기 위해 요청 시작 때 예약하고 실패 때 취소하는 원장 흐름을 적용한다.

### 인증 방식

- 첫 버전은 **Google 로그인**으로 시작한다. 모바일에서 Firebase Auth의 Google provider 흐름을 연결하고, 팝업이 제한되는 환경은 리다이렉트 방식도 고려한다.
- 로그인 전에도 촬영과 데모 학습을 둘 수 있지만, 계정 동기화·지갑·테마 구매처럼 개인 데이터가 필요한 기능은 로그인을 요구한다. 정확한 비로그인 허용 범위는 제품 결정으로 남긴다.
- 계정 화면에서 사용자 이름/이메일, 로그인 제공자, 로그아웃을 제공한다.
- 계정 삭제는 확인 절차와 연결된 사용자 데이터 삭제 정책을 마련한 뒤 제공한다. 로그아웃과 계정 삭제를 혼동하지 않게 구분한다.

### 권장 세션 구조

1. 클라이언트 Firebase Auth가 로그인 상태를 관리한다.
2. 클라이언트는 인증 상태를 구독해 초기 로딩, 로그인, 로그아웃 화면을 갱신한다.
3. 보호된 Next.js API를 호출할 때 Firebase ID 토큰을 `Authorization: Bearer ...`로 보낸다.
4. 서버 Route Handler는 Firebase Admin SDK로 ID 토큰을 검증하고 UID를 요청 사용자로 사용한다.
5. API는 본문에 전달된 UID를 신뢰하지 않고, 인증된 UID의 데이터만 읽고 쓴다.
6. Cloud Firestore 클라이언트 직접 접근은 기본적으로 차단한다. 필요해져서 직접 읽기를 추가할 때는 사용자 UID 범위로 제한된 Security Rules를 작성한다.

Firebase Admin SDK는 Firestore Security Rules를 우회하므로, 서버 API의 인증과 권한 검증이 반드시 필요하다. 관리자 서비스 계정 자격 증명은 브라우저 환경 변수(`NEXT_PUBLIC_*`)나 Git에 넣지 않고 배포 환경의 서버 비밀 값으로 보관한다.

## 사용자 데이터 구조 초안

```text
users/{uid}
  profile: displayName, email, photoURL, createdAt, updatedAt
  wallet/main: credits, tokens, updatedAt
  walletTransactions/{transactionId}
  wrongNotes/{noteId}
  ownedThemes/{themeId}
  settings/preferences
```

- Firebase Auth UID를 모든 사용자 소유 문서의 경로에 사용한다.
- 지갑 잔액과 거래 원장은 서버만 생성·수정한다.
- 오답노트는 계정 로그인 이후 서버 저장소로 옮긴다. 콘텐츠 크기가 커질 경우 이미지 원본은 Firestore 문서에 넣지 않고 Cloud Storage 여부를 별도 검토한다.
- 기존 `gemini_custom_api_key` 로컬 값과 API 키 설정 UI는 서버 키 방식으로 전환하면서 제거한다. 사용자의 로컬 키 값은 서버에 업로드하지 않는다.
- 초기 가입 지급과 프로필 문서 생성은 계정 생성 이벤트 또는 첫 인증 후 멱등하게 처리해 재로그인 때 반복 지급되지 않게 한다.

## 화면 흐름

1. 앱 시작 시 인증 상태를 확인하는 동안 짧은 로딩 상태를 보여준다.
2. 비로그인 사용자는 촬영/학습 진입은 정책에 따라 허용하되, 동기화·지갑 기능을 선택하면 로그인 화면을 안내한다.
3. 로그인 화면은 Google로 계속하기, 약관·개인정보 처리 안내, 오류 및 취소 상태를 명확히 표시한다.
4. 로그인 성공 후 UID 기준 프로필과 필요한 사용자 데이터를 가져온다.
5. 로그아웃하면 인증 구독을 통해 계정 화면을 닫고, 다른 계정의 데이터가 잠시 노출되지 않도록 화면 상태와 메모리 캐시를 초기화한다.
6. 네트워크 오류와 만료 세션은 구분해 재시도 또는 재로그인을 안내한다.

## 구현 단계

### 1단계: Firebase 프로젝트 연결 정보

사용자가 Firebase Console에서 다음을 확인한다.

- `tudu-e5bf2` 프로젝트와 Web App이 활성화되어 있는지 확인
- Authentication에서 Google provider 활성화
- 승인된 도메인에 `tudu1.xyz` 등록 (로컬 개발은 `localhost`도 확인)
- Cloud Firestore 데이터베이스 생성
- Web App config 값 전달 또는 로컬 `.env.local`에 입력
- 서버 Firebase Admin 인증을 위한 배포 환경 권한 설정. 로컬 개발은 서비스 계정 JSON을 저장소 밖에 두거나 Application Default Credentials 사용. ADC를 쓸 수 없는 호스트는 서비스 계정 이메일과 개인 키를 비밀 환경 변수로 등록

서버 비밀값과 `.env.local`은 공유 채팅, 코드, 커밋에 올리지 않는다. 웹 클라이언트 config는 앱 식별용이지만 Admin 서비스 계정 키는 서버 전용 비밀값이다.

### 2단계: SDK와 초기화

- Firebase Web SDK를 클라이언트 전용 초기화 모듈에서 구성한다.
- Firebase Admin SDK를 서버 전용 모듈에서 초기화하고 Next.js Route Handler에서만 import한다.
- 개발 중 핫 리로드 시 Firebase 앱 인스턴스 중복 생성을 방지한다.
- 환경 변수 이름과 누락 시 안내를 `.env.example`에 기록한다. 실제 비밀값은 기록하지 않는다.

### 3단계: 로그인 UX

- 모바일 우선 로그인/계정 UI를 구현한다.
- Google 로그인, 취소, 팝업 차단, 계정 충돌, 로그아웃 상태를 처리한다.
- 화면 전체를 인증 상태 하나로 무리하게 가리지 않고, 로그인이 필요한 기능 경계에서 로그인 안내를 제공한다.
- 계정 전환 뒤 이전 사용자 데이터가 남지 않도록 상태 초기화한다.

### 4단계: API 인증

- 공통 서버 helper가 Bearer ID 토큰을 검증하고 UID를 반환한다.
- 분석, 사용자 데이터, 지갑 API에서 인증을 필수/선택으로 나눈다.
- 클라이언트 제공 UID, 잔액, 보상량, 상품 가격을 권한 판정에 쓰지 않는다.
- 인증 실패는 401, 권한 없음은 403, 만료·잘못된 토큰은 재로그인 가능한 응답으로 반환한다.
- 서버 키 방식 배포 시 `/api/analyze`에 Firebase 인증을 요구한다. 무인증 분석을 바로 제거할지 유예할지는 배포 시점에 정한다.
- `/api/analyze`의 `x-gemini-api-key` 수신을 제거하고 서버 환경의 Gemini 키만 사용하도록 바꾼다.

### 5단계: Firestore 저장과 로컬 데이터 이전

- 사용자 프로필과 오답노트를 UID 하위에 저장하고 소유권 검사를 한다.
- 로그인 시 기존 `solvify_wrong_notes`가 있으면 건수와 이전 선택을 설명하고, 사용자가 동의하면 한 번 업로드한다.
- 이전 작업은 멱등성을 갖게 하며 원격 저장 성공 전 로컬 데이터를 지우지 않는다.
- 다른 계정 로그인 때 기존 로컬 데이터를 새 계정에 자동 복사하지 않는다.
- 이전 대상에서 BYOK API 키를 제외하고, 기존 기기 로컬 키는 계정으로 복사하지 않는다.

### 6단계: 지갑과 연동

- 인증 기반을 먼저 확정한 다음 크레딧·토큰 지갑, 분석 차감, 학습 보상, 테마 구매를 연결한다.
- 잔액과 원장 변경은 서버의 Firestore Transaction에서만 처리한다.
- 지갑/원장/구매 소유권은 클라이언트 직접 쓰기를 금지한다.

## 보안 및 개인정보 원칙

- 인증은 식별을 증명할 뿐이므로 각 API에서 해당 사용자의 리소스 권한을 별도 확인한다.
- Firestore Security Rules를 기본 거부로 시작하고 필요한 소유자 읽기만 허용한다. 클라이언트 쓰기는 기본 금지한다.
- Firebase Admin SDK는 서버 환경에서 초기화하며 Admin 권한이 Rules를 우회한다는 점을 고려해 모든 서버 API에 UID 검증과 입력 검증을 둔다.
- ID 토큰, Gemini 키, 문제 이미지/원문, 비밀번호를 로그에 남기지 않는다.
- 계정 삭제, 데이터 보존, 오답노트 이전, 탈퇴 후 지갑 및 구매 기록 처리 정책을 구현 전에 결정한다.
- 로컬·개발·운영 Firebase 프로젝트를 분리해 개발 데이터가 운영 지갑에 섞이지 않게 한다.

## 완료 기준

- Google 로그인과 로그아웃이 모바일 브라우저에서 작동한다.
- 분석 요청은 인증된 사용자의 입력만 받고 서버 보관 Gemini 키로 호출하며, 클라이언트 Gemini 키 헤더를 받지 않는다.
- 새로고침 및 앱 재방문 뒤 인증 상태가 의도한 방식으로 복원된다.
- 서버가 Firebase ID 토큰을 검증하고 위조·만료 토큰 요청을 거부한다.
- 사용자는 다른 UID의 오답노트·지갑 데이터에 접근할 수 없다.
- 로그아웃·계정 전환 시 이전 데이터가 남아 보이지 않는다.
- 기존 로컬 오답노트는 사용자 동의와 성공 확인 없이 제거되지 않는다.
- 개발용 Firebase 설정과 서버 관리자 자격 증명이 저장소에 포함되지 않는다.

## Firebase 프로젝트 생성 후 필요한 값

1. Firebase project ID `tudu-e5bf2`와 Web App config는 `.env.local`에 연결됨
2. Google provider 활성화 여부와 승인 도메인 `tudu1.xyz` 등록 여부 확인
3. Cloud Firestore 생성 여부와 리전
4. 로컬 개발 및 배포에서 Admin SDK를 인증할 방식 (서비스 계정 비밀값 또는 런타임 서비스 계정). 개인 키는 채팅에 보내지 말고 비밀 환경 변수로 등록
5. 비로그인 상태로 문제 촬영/풀이를 허용할지 여부
6. 첫 로그인 제공자를 Google만으로 시작할지, 이메일 로그인도 같이 열지

## 참고 문서

- [Firebase 웹 앱 설정](https://firebase.google.com/docs/web/setup)
- [Firebase 웹 Authentication 시작하기](https://firebase.google.com/docs/auth/web/start)
- [Firebase Google 로그인](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Admin SDK 인증 및 ID 토큰 검증](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firestore 인증 기반 보안 규칙](https://firebase.google.com/docs/firestore/security/rules-conditions)
- Next.js 공식 인증 가이드: `node_modules/next/dist/docs/01-app/02-guides/authentication.md`

