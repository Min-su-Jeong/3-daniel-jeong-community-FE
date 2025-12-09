# S.W.M (Swim Way Makers) - Frontend

> 수영 커뮤니티 플랫폼 - **Express.js 기반 프론트엔드 서버**

<br>

<p align="center">
  <a href="https://github.com/Min-su-Jeong/3-daniel-jeong-community-FE">
    <img src="https://img.shields.io/badge/Frontend_Repository_👈-4285F4?style=for-the-badge&logo=github&logoColor=white" alt="Frontend Repository">
  </a>
  <a href="https://github.com/Min-su-Jeong/3-daniel-jeong-community-BE">
    <img src="https://img.shields.io/badge/Backend_Repository-28a745?style=for-the-badge&logo=github&logoColor=white" alt="Backend Repository">
  </a>
</p>

<br>

## 프로젝트 개요

### 프로젝트 소개

<strong>S.W.M (Swim Way Makers)</strong>는 수영에 관심있는 모든 사람들을 대상으로 필요한 정보와 서비스를 한 곳에서 제공하는 통합 플랫폼입니다.

<p>
  <img align="center" width="1000" height="500" alt="Mainpage" src="https://github.com/user-attachments/assets/f38cc926-7d33-4bf8-b322-e68961a1a7c8" />
</p>

---

### 시연 영상

[![Watch the video](https://img.shields.io/badge/Play%20Demo-Google%20Drive-blue?logo=google-drive)](https://drive.google.com/file/d/1oB1QGWnx1VxZYh6jkUyT-utT7On7D_88/view?usp=drive_link)

---

### 개발 목적

2년간 수영 입문부터 대회 출전까지의 여정을 겪으면서, 수영에 필요한 정보가 매우 분산되어 있다는 것을 느꼈습니다.

- **실제 경험한 문제점**:
  - 중고 수영 용품 구매 시, 여러 사이트 탐색 및 각 도메인별 회원 인증 필요의 번거로움
  - 시/구 단위 수영대회 일정은 공식 홈페이지에 기재 X → 여러 수영장 카페 서칭 필요
  - 주변 수영장 검색 시 별도 앱 접속 및 수영장 외 불필요한 정보가 함께 노출되는 경우 다수
  - 자주 찾는 브랜드가 어느정도 정해져 있는데도 매번 브라우저에서 검색해 공식 홈페이지에 접속 필요

  이러한 불편함을 해결하기 위해 수영 관련 정보와 서비스를 통합한 플랫폼을 구축하고자 하였습니다.

- **핵심 목표**:
  - 프레임워크 없이 Vanilla JavaScript로 빠른 개발 속도 확보
  - MPA 구조로 SEO 최적화 및 초기 로딩 속도 개선
  - 컴포넌트 기반 구조로 코드 재사용성 및 유지보수성 확보

<br>

## 기술 스택

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+ Modules)
- **Server**: Express.js 5.1.0
- **Runtime**: Node.js 22.20.0
- **Infra**: AWS
- **CI/CD**: GitHub Actions

<br>

## 아키텍처

### MPA (Multi-Page Application) 구조

```
public/
├── pages/           # 페이지별 HTML/JS/CSS (독립적인 페이지)
│   ├── home/
│   ├── post-list/
│   ├── post-detail/
│   ├── post-write/
│   ├── marketplace-list/
│   ├── marketplace-detail/
│   ├── pool-finder/
│   ├── competitions/
│   ├── login/
│   ├── signup/
│   └── ...
├── components/      # 재사용 가능한 컴포넌트
│   ├── button/
│   ├── modal/
│   ├── toast/
│   ├── header/
│   ├── footer/
│   ├── form/
│   ├── layout/
│   └── post-editor/
├── utils/           # 유틸리티 함수
│   ├── api/         # API 호출 함수
│   ├── common/       # 공통 유틸리티
│   └── constants/   # 상수 정의
├── styles/          # 공통 스타일
└── assets/          # 정적 자원 (애니메이션 등)
```

**의도**:

MPA를 사용해야 하는 프로젝트 제약 조건이 있었고 그 상황에서 MPA를 써야 하는 이유를 찾으려 노력했습니다.

**제약 조건 분석**: 
- SPA는 번들러 구축 비용과 초기 설정 복잡도가 높아 개발 속도가 저하될 우려가 있었습니다.
- 수영 커뮤니티 특성상 SEO가 중요했는데 SPA는 초기 HTML이 비어있어 크롤링에 불리했습니다. SSR(Next.js)도 고려했지만 초기 복잡도와 러닝 커브가 높았습니다.

**MPA 선택 이유**: 
- 각 페이지가 독립적인 HTML 파일로 존재하여 검색 엔진이 콘텐츠를 직접 크롤링할 수 있고 페이지별로 필요한 리소스만 로드하여 초기 로딩 속도를 개선 가능한 장점이 있습니다.
- Express.js의 폴더 기반 동적 라우팅으로 라우팅 설정이 단순하고 번들러 없이도 ES6 Modules로 모듈화가 가능하여 빠른 개발 속도가 가능하여 선택하게 되었습니다.

**폴더 구조 설계 원칙**:
- **웹 서버 정적 파일 서빙 방식에 맞추기**: `public/` 폴더만 웹 서버에 업로드, Express.js의 `express.static('public')` 방식과 호환
- **컴포넌트 위치**: 공용 컴포넌트는 `components/`에 배치 (2개 이상 페이지에서 사용), 페이지별 로직은 각 페이지 폴더 내 JS 파일에 포함
- **응집도 우선**: 함께 수정되지 않으면 오류가 발생할 수 있는 경우 응집도 우선 (예: `utils/api/auth.js`, `utils/api/posts.js`는 API 호출 로직별로 분리)
- **명확하고 직관적인 구조**: 1-2단계 폴더 구조로 빠른 기능 확장, 복잡한 설계보다는 명확함 우선

<br>

## 결과 및 성과

### 스크롤 이벤트 최적화: 초당 60회+ → 50ms당 1회로 제한
- **문제**: 스크롤 이벤트가 초당 60회 이상 발생하여 메인 스레드 블로킹, 스크롤 시마다 API 호출로 서버 부하 및 중복 요청 발생
- **대응**: debounce 50ms로 이벤트 처리 빈도 제한, `passive: true` 옵션으로 스크롤 성능 향상, 로딩 상태 플래그로 중복 요청 방지
- **결과**: 스크롤 이벤트 처리 빈도 **초당 60회+ → 50ms당 1회로 제한**, 불필요한 API 호출 제거로 서버 부하 감소 및 프레임 레이트 개선

---

### 프로필 이미지 캐싱: 중복 네트워크 요청 제거
- **문제**: 같은 사용자의 프로필 이미지를 여러 번 요청, S3 Public URL 조회 API 호출이 빈번하게 발생하여 네트워크 비용 증가 및 렌더링 지연
- **대응**: Map 기반 메모리 캐싱으로 Public URL 저장, `dataset.imageKey`로 재렌더링 방지, 진행 중인 요청도 Promise로 캐싱하여 중복 요청 방지
- **결과**: 같은 이미지 키에 대한 API 호출 **중복 제거**, 캐시 히트 시 즉시 반환으로 렌더링 지연 제로, 네트워크 비용 감소

---

### 세션 만료 자동 처리: 작업 중단 최소화
- **문제**: Access Token 만료 시(약 1시간) 갑작스러운 로그아웃, 작업 중인 내용 손실, 수동 재로그인 필요로 인한 사용자 이탈
- **대응**: 401 에러 시 자동 Refresh Token 갱신, 순환 참조 방지를 위해 `request` 함수 대신 직접 `fetch` 호출, 모달 중복 표시 방지 플래그로 UX 개선
- **결과**: 세션 만료 시 **자동 갱신으로 작업 중단 최소화**, 사용자 선택권 제공(로그인 유지/로그아웃)으로 UX 개선, 순환 참조 없는 안정적인 구조

<br>

## 트러블슈팅

### 1. 스크롤 이벤트 최적화: Debounce와 Passive 옵션으로 무한 스크롤 성능 개선

**문제 상황**:
- 스크롤 이벤트가 초당 60회 이상 발생하여 메인 스레드 블로킹
- 스크롤 시마다 API 호출로 인한 서버 부하 및 중복 요청 발생
- 빠른 스크롤 시 동일한 API가 여러 번 호출되어 불필요한 네트워크 비용 증가
- 불필요한 렌더링으로 인한 프레임 드롭 및 사용자 체감 성능 저하

**해결 방법**:
```javascript
// element.js - debounce 유틸리티
export function debounce(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

// post-list.js - 스크롤 처리
const SCROLL_THRESHOLD = 400;
const debouncedHandleScroll = debounce(handleScroll, 50);

function handleScroll() {
    if (isLoading || !hasMorePosts) return;
    
    const { scrollTop, scrollHeight } = document.documentElement;
    if (scrollTop + window.innerHeight >= scrollHeight - SCROLL_THRESHOLD) {
        loadPosts();
    }
}

window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
```

- `debounce` 함수로 스크롤 이벤트 처리 빈도 제한 (50ms)
- `passive: true` 옵션으로 스크롤 성능 향상
- 로딩 상태 플래그(`isLoading`, `hasMorePosts`)로 중복 요청 방지
- 스크롤 임계값(400px) 설정으로 적절한 시점에 데이터 로드

**추가 고려사항**:
- **50ms 선택 이유**: 사용자 체감 지연 최소화(50ms 이하)와 성능 개선의 균형점. 100ms 이상은 체감 지연, 10ms 이하는 이벤트 처리 빈도가 여전히 높음
- **passive: true 옵션**: 브라우저가 스크롤 최적화를 위해 이벤트 리스너가 `preventDefault()`를 호출하지 않을 것임을 알려줌. 이로 인해 스크롤 성능이 향상되고 프레임 드롭 감소
- **throttle vs debounce**: throttle은 일정 간격마다 실행, debounce는 마지막 이벤트 후 일정 시간 후 실행. 무한 스크롤은 사용자가 스크롤을 멈춘 후 로드하는 것이 적합하여 debounce 선택

**성과**:
- 스크롤 이벤트 처리 빈도: **초당 60회+ → 50ms당 1회로 제한**
- 불필요한 API 호출 제거로 서버 부하 감소
- 프레임 레이트 개선으로 사용자 체감 성능 향상

---

### 2. 프로필 이미지 캐싱 전략: Map 기반 메모리 캐싱과 진행 중인 요청 캐싱

**문제 상황**:
- 같은 사용자의 프로필 이미지를 여러 번 요청하여 네트워크 비용 증가
- 게시글 목록에서 작성자 프로필 이미지가 중복 로드되어 렌더링 지연
- S3 Public URL 조회 API 호출이 빈번하게 발생하여 서버 부하
- 동시에 같은 이미지를 요청하는 경우 중복 네트워크 호출 발생

**해결 방법**:
```javascript
// image.js - 프로필 이미지 렌더링 시 캐싱
export async function renderProfileImage(container, imageKey, fallbackText, altText) {
    if (!container) return;
    
    const normalizedKey = imageKey || '';
    const existingImage = container.querySelector('img');
    const currentKey = existingImage?.dataset?.imageKey || '';
    
    // 같은 이미지 키면 재렌더링 생략
    if (existingImage && normalizedKey === currentKey) {
        return;
    }
    
    container.replaceChildren();
    
    if (imageKey) {
        const image = await createImageElement(imageKey, altText, fallbackText, container);
        container.appendChild(image);
    } else {
        container.textContent = fallbackText;
    }
}

// constants/image.js - Public URL 캐싱
const publicUrlCache = new Map();

export const S3_CONFIG = {
    getPublicUrl: async (objectKey) => {
        if (!objectKey) return null;
        
        // 캐시 조회
        if (publicUrlCache.has(objectKey)) {
            return publicUrlCache.get(objectKey);
        }
        
        const fetchPromise = (async () => {
            try {
                const response = await fetch(`/api/images/public-url?objectKey=${encodeURIComponent(objectKey)}`);
                const result = await response.json();
                return result.data?.url || null;
            } catch (error) {
                return null;
            }
        })();
        
        // 진행 중인 요청 캐시
        publicUrlCache.set(objectKey, fetchPromise);
        return fetchPromise;
    }
};
```

- 이미지 키를 `dataset.imageKey`에 저장하여 재렌더링 방지
- Public URL을 Map으로 캐싱하여 중복 API 호출 제거
- 진행 중인 요청도 Promise로 캐싱하여 동시 요청 시 단일 네트워크 호출만 발생

**추가 고려사항**:
- **Map 선택 이유**: O(1) 조회 성능, 객체 키로 문자열 사용 가능, 순회 및 삭제 용이
- **진행 중인 요청 캐싱**: 동시에 같은 이미지를 요청하는 경우, 첫 번째 요청의 Promise를 캐시하여 두 번째 요청은 같은 Promise를 반환. 이로 인해 중복 네트워크 호출 완전 방지
- **메모리 관리**: 현재는 무제한 캐싱이지만, 향후 LRU 캐시로 확장 가능한 구조
- **dataset.imageKey 비교**: DOM 조작 전에 이미지 키를 비교하여 불필요한 `replaceChildren()` 호출 방지

**성과**:
- 같은 이미지 키에 대한 API 호출 **중복 완전 제거**
- 캐시 히트 시 즉시 반환으로 렌더링 지연 제로
- 네트워크 비용 감소 및 서버 부하 감소

---

### 3. 세션 만료 자동 처리: 순환 참조 방지와 모달 중복 표시 방지

**문제 상황**:
- Access Token 만료 시(약 1시간) 사용자가 갑자기 로그아웃되어 작업 중인 내용 손실
- 매번 수동으로 로그인해야 하는 불편함으로 인한 사용자 이탈
- 401 에러 발생 시 사용자에게 명확한 안내 부재
- 여러 API가 동시에 401 에러를 반환할 때 모달이 중복 표시되는 문제

**해결 방법**:
```javascript
// request.js - 세션 만료 모달 중복 표시 방지 플래그
let isShowingExpiredModal = false;

// Refresh 토큰으로 세션 갱신 (순환 참조 방지를 위해 request 함수 사용 안 함)
// request 함수를 사용하지 않는 이유: 순환 참조 방지 (request -> handleSessionExpired -> handleRefreshToken -> request)
async function handleRefreshToken() {
    try {
        const refreshResponse = await fetch(`${API_SERVER_URI}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!refreshResponse.ok) {
            throw new Error('Refresh failed');
        }
        
        const refreshData = await refreshResponse.json();
        if (!refreshData.success) {
            throw new Error('Refresh failed');
        }
        
        Toast.success(TOAST_MESSAGE.SESSION_RENEWED);
        isShowingExpiredModal = false;
        dispatchUserUpdatedEvent();
        return true;
    } catch (error) {
        Toast.error(TOAST_MESSAGE.SESSION_RENEW_FAILED);
        await handleLogout();
        return false;
    }
}

// 세션 만료 모달 표시 (중복 표시 방지, 갱신/로그아웃 선택)
async function showSessionExpiredModal() {
    if (isShowingExpiredModal) return;
    isShowingExpiredModal = true;

    const modal = new Modal({
        title: '세션 만료',
        subtitle: MODAL_MESSAGE.SUBTITLE_SESSION_EXPIRED,
        showCancel: true,
        cancelText: '로그아웃',
        confirmText: '로그인 유지',
        confirmType: 'primary',
        onConfirm: async () => {
            const success = await handleRefreshToken();
            if (success) {
                modal.hide();
            }
        },
        onCancel: async () => {
            await handleLogout();
        }
    });

    modal.show();
}

// 공통 API 요청 처리
export async function request({ method, url, params, body, isFormData }) {
    const response = await executeFetch(urlWithParams, options);
    
    // 401 에러 처리
    if (response.status === 401) {
        await handleSessionExpired();
    }
    
    // ... 응답 처리
}
```

- 401 에러 발생 시 자동으로 Refresh Token으로 Access Token 갱신 시도
- 갱신 실패 시 사용자에게 선택권 제공 (로그인 유지 / 로그아웃)
- 모달 중복 표시 방지(`isShowingExpiredModal` 플래그)로 사용자 경험 개선
- 순환 참조 방지를 위해 `request` 함수를 사용하지 않고 직접 `fetch` 호출

**추가 고려사항**:
- **순환 참조 문제**: `request` 함수 내에서 `handleSessionExpired`를 호출하고, `handleSessionExpired`에서 `handleRefreshToken`을 호출할 때 `request` 함수를 사용하면 순환 참조 발생. 직접 `fetch` 호출로 해결
- **모달 중복 표시 방지**: 여러 API가 동시에 401 에러를 반환할 때 모달이 여러 번 표시되는 문제를 `isShowingExpiredModal` 플래그로 방지
- **사용자 선택권 제공**: 갱신 실패 시 강제 로그아웃이 아닌 사용자 선택권 제공으로 UX 개선
- **이벤트 디스패치**: 토큰 갱신 성공 시 `dispatchUserUpdatedEvent()`로 전역 상태 업데이트

**성과**:
- 세션 만료 시 **자동 갱신으로 작업 중단 최소화**
- 사용자 선택권 제공으로 UX 개선
- 순환 참조 없는 안정적인 구조
- 모달 중복 표시 방지로 사용자 혼란 최소화

---

### 4. 브라우저 네이티브 Lazy Loading: Intersection Observer 대신 네이티브 기능 활용

**문제 상황**:
- 게시글 목록에 많은 이미지가 포함되어 초기 로딩 시간 증가
- 모든 이미지를 한 번에 로드하여 네트워크 대역폭 낭비
- 사용자가 보지 않는 이미지까지 로드하여 성능 저하
- 모바일 환경에서 데이터 사용량 증가

**해결 방법**:
```javascript
// post-list.js, marketplace-list.js, image.js
const image = document.createElement('img');
image.loading = 'lazy';
image.src = url;
```

- `loading="lazy"` 속성으로 뷰포트에 진입할 때만 이미지 로드
- 게시글 목록 아이콘(좋아요, 조회수, 댓글) 및 프로필 이미지에 lazy loading 적용
- S3 Public URL을 통한 이미지 로드

**추가 고려사항**:
- **Intersection Observer vs 네이티브 lazy loading**: Intersection Observer는 추가 코드 및 성능 오버헤드가 있지만, 브라우저 네이티브 `loading="lazy"`는 최적화된 지연 로딩을 제공하고 코드 복잡도가 낮음
- **브라우저 호환성**: 최신 브라우저에서 지원되며, 미지원 브라우저에서는 일반 로딩으로 폴백
- **성능 최적화**: 브라우저가 뷰포트 거리를 계산하여 적절한 시점에 이미지 로드, 추가 JavaScript 없이 네이티브 최적화 활용

**성과**:
- 초기 로딩 시 불필요한 이미지 로드 제거
- 뷰포트 진입 시점에만 로드하여 네트워크 트래픽 감소
- 추가 라이브러리 없이 성능 개선

<br>

## 프로젝트를 통해 배운 점

- **사용자 경험이 성능만큼 중요**: 초기에는 성능 최적화에만 집중했지만 세션 만료로 인한 사용자 이탈을 경험하면서 사용자 경험 개선이 성능 최적화만큼 중요하다는 것을 깨달았습니다. 기술적으로 완벽해도 사용자가 불편하면 의미가 없다고 생각했습니다.

- **간단한 해결책이 최선일 때가 많다**: 이미지 lazy loading을 구현할 때 Intersection Observer를 사용하려고 계획했지만, 브라우저 네이티브 `loading="lazy"` 속성만으로도 충분히 해결되었습니다. 복잡한 해결책보다 간단한 해결책을 먼저 찾는 것이 중요하다고 느낄 수 있었습니다.

- **순환 참조는 예상치 못한 곳에서 발생**: 세션 갱신 로직을 구현할 때 `request` 함수를 재사용하려다 순환 참조 문제를 겪었습니다. 공통 함수를 만들 때는 의존성 관계를 먼저 그려보고 순환 참조 가능성을 사전에 확인해야 한다는 사실을 알게 되었습니다. 결국 직접 `fetch`를 호출하는 방식으로 해결했지만 설계 단계에서 미리 고려했다면 시간을 절약할 수 있었을 것 같습니다.
  
<br>

## 향후 계획

- **시나리오 기반 부하테스트**: 피크 시간대 목록 조회, 대회 일정 공지 시 동시 접속 급증 등 실제 트래픽 패턴을 시뮬레이션하여 병목 지점 사전 파악. 프론트엔드에서는 렌더링 성능, 메모리 사용량, 네트워크 요청 패턴을 중점적으로 측정

- **점진적 프레임워크 전환 검토**: MPA 구조의 장점을 유지하면서 특정 페이지만 SPA로 전환하는 점진적 마이그레이션 전략 검토. 예를 들어, 실시간성이 중요한 댓글/알림 기능만 React/Vue로 전환

<br>

## 프로젝트의 개선점

- **실시간 알림**: 현재는 폴링 방식이지만, 댓글/좋아요 WebSocket 알림으로 실시간성 확보 및 서버 부하 감소. Socket.io나 WebSocket API 활용 검토

- **이미지 최적화**: 현재는 원본 이미지를 그대로 사용하지만, WebP 포맷 변환 및 리사이징으로 용량 최적화 필요. 이미지 CDN 도입으로 전송 속도 개선

- **에러 바운더리 패턴**: 현재는 각 페이지에서 에러를 처리하지만 전역 에러 핸들러와 에러 바운더리 패턴 도입으로 예상치 못한 에러 처리 강화
