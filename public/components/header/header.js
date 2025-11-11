import { Modal } from '../modal/modal.js';
import { logout } from '../../api/auth.js';
import { ToastUtils } from '../toast/toast.js';
import { renderProfileImage } from '../../utils/common/image.js';

const LOGO_TEXT = '아무 말 대잔치';
const HOME_PATH = '/post-list';

/**
 * 사용자 저장소 정리 (localStorage, sessionStorage)
 */
function clearUserStorage() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
}

/**
 * 저장소에서 사용자 정보 가져오기
 */
async function getUserFromStorage() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null;
    }
}

/**
 * 프로필 아이콘 렌더링
 * @param {HTMLElement} icon - 아이콘 컨테이너 요소
 * @param {Object|null} user - 사용자 정보
 */
function renderProfileIcon(icon, user) {
    const profileImageKey = user?.profileImageKey || null;
    renderProfileImage(icon, profileImageKey, '👤', user?.nickname || '프로필');
}

/**
 * 로그아웃 후 페이지 이동 처리
 * - 게시글 목록 페이지면 상태만 업데이트
 * - 다른 페이지면 홈으로 이동
 */
function handlePostLogoutNavigation() {
    const currentPath = window.location.pathname;
    const isPostListPage = currentPath === '/' || currentPath === HOME_PATH;
    
    if (isPostListPage) {
        window.history.replaceState({ loggedOut: true }, '', currentPath);
    } else {
        window.location.href = HOME_PATH;
    }
}

/**
 * 로그아웃 처리
 * - API 호출 후 저장소 정리 및 이벤트 발생
 * - 에러 발생 시에도 저장소 정리 및 페이지 이동
 */
async function handleLogout() {
    try {
        await logout();
        clearUserStorage();
        window.dispatchEvent(new CustomEvent('userUpdated'));
        ToastUtils.success('로그아웃되었습니다.');
        handlePostLogoutNavigation();
    } catch (error) {
        clearUserStorage();
        window.dispatchEvent(new CustomEvent('userUpdated'));
        ToastUtils.error('로그아웃 중 오류가 발생했습니다.');
        handlePostLogoutNavigation();
    }
}

/**
 * 드롭다운 메뉴 아이템 생성
 * @param {string} action - 액션 타입 (login, user-edit, password-edit, logout)
 * @param {string} text - 표시할 텍스트
 * @param {string} className - 추가 CSS 클래스
 * @returns {HTMLElement} 메뉴 아이템 요소
 */
function createDropdownMenuItem(action, text, className = '') {
    const item = document.createElement('button');
    item.className = `dropdown-item ${className}`.trim();
    item.dataset.action = action;
    item.textContent = text;
    return item;
}

/**
 * 프로필 드롭다운 메뉴 생성 및 이벤트 바인딩
 * @param {HTMLElement} userProfile - 프로필 컨테이너 요소
 * @param {boolean} isLoggedIn - 로그인 여부
 */
function createDropdownMenu(userProfile, isLoggedIn) {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    if (isLoggedIn) {
        dropdown.appendChild(createDropdownMenuItem('user-edit', '회원정보수정'));
        dropdown.appendChild(createDropdownMenuItem('password-edit', '비밀번호수정'));
        dropdown.appendChild(createDropdownMenuItem('logout', '로그아웃', 'logout-item'));
    } else {
        dropdown.appendChild(createDropdownMenuItem('login', '로그인'));
    }
    
    userProfile.appendChild(dropdown);
    
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    dropdown.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;
        
        e.preventDefault();
        dropdown.classList.remove('active');
        handleDropdownAction(action);
    });
    
    setupDropdownCloseListener();
}

/**
 * 드롭다운 메뉴 액션 처리
 * @param {string} action - 액션 타입
 */
function handleDropdownAction(action) {
    const actionHandlers = {
        'login': () => { window.location.href = '/login'; },
        'user-edit': () => { window.location.href = '/user-edit'; },
        'password-edit': () => { window.location.href = '/password-edit'; },
        'logout': () => {
            new Modal({
                title: '로그아웃',
                subtitle: '로그아웃 하시겠습니까?',
                confirmText: '로그아웃',
                cancelText: '취소',
                onConfirm: handleLogout
            }).show();
        }
    };
    
    const handler = actionHandlers[action];
    if (handler) handler();
}

/**
 * Shadow DOM 내부의 드롭다운 외부 클릭 시 닫기 처리
 * - 전역 이벤트 리스너는 한 번만 등록
 */
function setupDropdownCloseListener() {
    if (document._hasDropdownCloseListener) return;
    
    document.addEventListener('click', (e) => {
        const headers = document.querySelectorAll('app-header');
        headers.forEach(header => {
            const shadowRoot = header.shadowRoot;
            if (!shadowRoot) return;
            
            const activeDropdown = shadowRoot.querySelector('.profile-dropdown.active');
            const userProfile = shadowRoot.querySelector('.user-profile');
            if (activeDropdown && userProfile) {
                const path = e.composedPath();
                if (!path.includes(userProfile)) {
                    activeDropdown.classList.remove('active');
                }
            }
        });
    });
    
    document._hasDropdownCloseListener = true;
}

/**
 * 헤더 컴포넌트 (Web Component)
 * - show-back: 뒤로가기 버튼 표시 여부
 * - show-profile: 프로필 메뉴 표시 여부
 */
class AppHeader extends HTMLElement {
    static get observedAttributes() { return ['show-back', 'show-profile']; }

    constructor() {
        super();
        this._onBack = this._onBack.bind(this);
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this._renderAsync();
        // 사용자 정보 업데이트 시 헤더 재렌더링
        window.addEventListener('userUpdated', () => {
            this._renderAsync();
        });
    }
    
    attributeChangedCallback() { 
        this._renderAsync(); 
    }
    
    /**
     * 뒤로가기 버튼 클릭 처리
     * - 커스텀 핸들러가 있으면 우선 사용
     * - 없으면 기본 history.back() 사용
     */
    _onBack() {
        if (window.handleBackNavigation) {
            window.handleBackNavigation();
        } else {
            history.back();
        }
    }
    
    /**
     * 헤더 비동기 렌더링
     */
    async _renderAsync() {
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');

        this._shadow.innerHTML = '';
        this._shadow.appendChild(this.createStyleLink());
        
        const header = await this.createHeader(showBack, showProfile);
        this._shadow.appendChild(header);
    }
    
    /**
     * 스타일시트 링크 생성
     */
    createStyleLink() {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/components/header/header.css';
        return styleLink;
    }
    
    /**
     * 헤더 요소 생성
     * @param {boolean} showBack - 뒤로가기 버튼 표시 여부
     * @param {boolean} showProfile - 프로필 메뉴 표시 여부
     */
    async createHeader(showBack, showProfile) {
        const header = document.createElement('header');
        header.className = 'header';
        
        const left = this.createLeftSection(showBack);
        const center = this.createCenterSection();
        const right = await this.createRightSection(showProfile);
        
        header.appendChild(left);
        header.appendChild(center);
        header.appendChild(right);
        
        return header;
    }
    
    /**
     * 헤더 왼쪽 섹션 생성 (뒤로가기 버튼)
     */
    createLeftSection(showBack) {
        const left = document.createElement('div');
        left.className = 'header-left';
        
        if (showBack) {
            const backButton = document.createElement('button');
            backButton.className = 'back-btn';
            backButton.setAttribute('aria-label', '뒤로가기');
            backButton.textContent = '←';
            backButton.addEventListener('click', this._onBack);
            left.appendChild(backButton);
        }
        
        return left;
    }
    
    /**
     * 헤더 중앙 섹션 생성 (로고)
     */
    createCenterSection() {
        const center = document.createElement('div');
        center.className = 'header-center';
        
        const title = document.createElement('h1');
        title.className = 'logo';
        title.textContent = LOGO_TEXT;
        title.addEventListener('click', () => {
            window.location.href = HOME_PATH;
        });
        
        center.appendChild(title);
        return center;
    }
    
    /**
     * 헤더 오른쪽 섹션 생성 (프로필 메뉴)
     */
    async createRightSection(showProfile) {
        const right = document.createElement('div');
        right.className = 'header-right';
        
        if (showProfile) {
            const userProfile = await this.createUserProfile();
            right.appendChild(userProfile);
        }
        
        return right;
    }
    
    /**
     * 사용자 프로필 요소 생성
     * - 프로필 아이콘 및 드롭다운 메뉴 포함
     */
    async createUserProfile() {
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        const icon = document.createElement('div');
        icon.className = 'profile-icon';
        
        const user = await getUserFromStorage();
        renderProfileIcon(icon, user);
        
        userProfile.appendChild(icon);
        createDropdownMenu(userProfile, !!user);
        
        return userProfile;
    }
}

customElements.define('app-header', AppHeader);