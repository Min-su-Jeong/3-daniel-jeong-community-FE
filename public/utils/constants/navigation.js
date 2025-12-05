/**
 * 네비게이션 메뉴 상수
 * 모든 페이지에서 공통으로 사용되는 네비게이션 메뉴 구조
 */
export const NAVIGATION_MENU = [
    { path: '/post-list', label: '커뮤니티' },
    { path: '/competitions', label: '대회일정' },
    { path: '/certifications', label: '자격증' },
    { path: '/brands', label: '브랜드' },
    { path: '/marketplace', label: '중고거래' },
    { path: '/pool-finder', label: '수영장 위치 찾기' }
];

/**
 * 네비게이션 액션 상수
 * 로그인/회원가입 버튼 설정
 */
export const NAVIGATION_ACTIONS = {
    LOGIN: { path: '/login', label: '로그인', className: 'nav-btn nav-btn-ghost' },
    SIGNUP: { path: '/signup', label: '회원가입', className: 'nav-btn nav-btn-primary' }
};

