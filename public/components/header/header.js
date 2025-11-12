import { Modal } from '../modal/modal.js';
import { logout } from '../../api/auth.js';
import { ToastUtils } from '../toast/toast.js';
import { renderProfileImage } from '../../utils/common/image.js';
import { getUserFromStorage, removeUserFromStorage, dispatchUserUpdatedEvent } from '../../utils/common/user.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

const LOGO_TEXT = '아무 말 대잔치';
const HOME_PATH = '/post-list';

// 프로필 아이콘 렌더링
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
        removeUserFromStorage();
        dispatchUserUpdatedEvent();
        ToastUtils.success(TOAST_MESSAGE.LOGOUT_SUCCESS);
        handlePostLogoutNavigation();
    } catch (error) {
        removeUserFromStorage();
        dispatchUserUpdatedEvent();
        ToastUtils.error(TOAST_MESSAGE.LOGOUT_FAILED);
        handlePostLogoutNavigation();
    }
}

// 드롭다운 메뉴 아이템 생성
function createDropdownMenuItem(action, text, className = '') {
    const item = document.createElement('button');
    item.className = `dropdown-item ${className}`.trim();
    item.dataset.action = action;
    item.textContent = text;
    return item;
}

// 드롭다운 사용자 정보 섹션 생성
function createDropdownUserInfo(user) {
    const userInfo = document.createElement('div');
    userInfo.className = 'dropdown-user-info';
    
    const profileImage = document.createElement('div');
    profileImage.className = 'dropdown-profile-image';
    renderProfileIcon(profileImage, user);
    
    const userDetails = document.createElement('div');
    userDetails.className = 'dropdown-user-details';
    
    const userName = document.createElement('div');
    userName.className = 'dropdown-user-name';
    userName.textContent = `${user?.nickname || '사용자'}님`;
    
    const userEmail = document.createElement('div');
    userEmail.className = 'dropdown-user-email';
    userEmail.textContent = user?.email || '';
    
    userDetails.appendChild(userName);
    if (user?.email) {
        userDetails.appendChild(userEmail);
    }
    
    userInfo.appendChild(profileImage);
    userInfo.appendChild(userDetails);
    
    return userInfo;
}

// 프로필 드롭다운 메뉴 생성 및 이벤트 바인딩
function createDropdownMenu(userProfile, isLoggedIn, user) {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    if (isLoggedIn && user) {
        dropdown.classList.add('has-user-info');
        // 사용자 정보 섹션 추가
        const userInfo = createDropdownUserInfo(user);
        dropdown.appendChild(userInfo);
        
        // 구분선 추가
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        dropdown.appendChild(divider);
        
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

// 드롭다운 메뉴 액션 처리
function handleDropdownAction(action) {
    const actionHandlers = {
        'login': () => { window.location.href = '/login'; },
        'user-edit': () => { window.location.href = '/user-edit'; },
        'password-edit': () => { window.location.href = '/password-edit'; },
        'logout': () => {
            new Modal({
                title: MODAL_MESSAGE.TITLE_LOGOUT,
                subtitle: MODAL_MESSAGE.SUBTITLE_LOGOUT,
                confirmText: '로그아웃',
                cancelText: '취소',
                onConfirm: handleLogout
            }).show();
        }
    };
    
    const handler = actionHandlers[action];
    if (handler) handler();
}

// Shadow DOM 내부의 드롭다운 외부 클릭 시 닫기 처리 (전역 이벤트 리스너는 한 번만 등록)
function setupDropdownCloseListener() {
    if (document.hasDropdownCloseListener) return;
    
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
    
    document.hasDropdownCloseListener = true;
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
        this.onBack = this.onBack.bind(this);
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this.renderAsync();
        // 사용자 정보 업데이트 시 헤더 재렌더링
        window.addEventListener('userUpdated', () => {
            this.renderAsync();
        });
    }
    
    attributeChangedCallback() { 
        this.renderAsync(); 
    }
    
    /**
     * 뒤로가기 버튼 클릭 처리
     * - 커스텀 핸들러가 있으면 우선 사용
     * - 없으면 기본 history.back() 사용
     */
    onBack() {
        if (window.handleBackNavigation) {
            window.handleBackNavigation();
        } else {
            history.back();
        }
    }
    
    /**
     * 헤더 비동기 렌더링
     */
    async renderAsync() {
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');

        // Shadow DOM 초기화 (replaceChildren으로 모든 자식 제거)
        this.shadowRoot.replaceChildren();
        this.shadowRoot.appendChild(this.createStyleLink());
        
        const header = await this.createHeader(showBack, showProfile);
        this.shadowRoot.appendChild(header);
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
    
    // 헤더 요소 생성
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
            backButton.addEventListener('click', this.onBack);
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
        
        const user = getUserFromStorage();
        renderProfileIcon(icon, user);
        
        userProfile.appendChild(icon);
        createDropdownMenu(userProfile, !!user, user);
        
        return userProfile;
    }
}

customElements.define('app-header', AppHeader);