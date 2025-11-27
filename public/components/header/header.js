import { Modal } from '../modal/modal.js';
import { logout } from '../../utils/api/auth.js';
import { Toast } from '../toast/toast.js';
import { renderProfileImage } from '../../utils/common/image.js';
import { getUserFromStorage, removeUserFromStorage, dispatchUserUpdatedEvent } from '../../utils/common/user.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

const LOGO_TEXT = 'S.W.M';
const HOME_PATH = '/post-list';

// 프로필 아이콘 렌더링
function renderProfileIcon(icon, user) {
    const profileImageKey = user?.profileImageKey || null;
    renderProfileImage(icon, profileImageKey, '👤', user?.nickname || '프로필');
}

// 로그아웃 후 페이지 이동 처리
function handlePostLogoutNavigation() {
    const currentPath = window.location.pathname;
    const isPostListPage = currentPath === HOME_PATH;
    
    if (isPostListPage) {
        window.history.replaceState({ loggedOut: true }, '', currentPath);
    } else {
        window.location.href = HOME_PATH;
    }
}

// 로그아웃 처리
async function handleLogout() {
    try {
        await logout();
        cleanupUserSession();
        Toast.success(TOAST_MESSAGE.LOGOUT_SUCCESS);
        handlePostLogoutNavigation();
    } catch (error) {
        cleanupUserSession();
        Toast.error(TOAST_MESSAGE.LOGOUT_FAILED);
        handlePostLogoutNavigation();
    }
}

// 사용자 세션 정리
function cleanupUserSession() {
    removeUserFromStorage();
    dispatchUserUpdatedEvent();
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
    
    userInfo.appendChild(createUserProfileImage(user));
    userInfo.appendChild(createUserDetails(user));
    
    return userInfo;
}

// 사용자 프로필 이미지 생성
function createUserProfileImage(user) {
    const profileImage = document.createElement('div');
    profileImage.className = 'dropdown-profile-image';
    renderProfileIcon(profileImage, user);
    return profileImage;
}

// 사용자 상세 정보 생성
function createUserDetails(user) {
    const userDetails = document.createElement('div');
    userDetails.className = 'dropdown-user-details';
    
    userDetails.appendChild(createUserName(user));
    
    if (user?.email) {
        userDetails.appendChild(createUserEmail(user));
    }
    
    return userDetails;
}

// 사용자 이름 생성
function createUserName(user) {
    const userName = document.createElement('div');
    userName.className = 'dropdown-user-name';
    userName.textContent = `${user?.nickname || '사용자'}님`;
    return userName;
}

// 사용자 이메일 생성
function createUserEmail(user) {
    const userEmail = document.createElement('div');
    userEmail.className = 'dropdown-user-email';
    userEmail.textContent = user?.email || '';
    return userEmail;
}

// 프로필 드롭다운 메뉴 생성 및 이벤트 바인딩
function createDropdownMenu(userProfile, isLoggedIn, user) {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    if (isLoggedIn && user) {
        populateLoggedInDropdown(dropdown, user);
    } else {
        populateLoggedOutDropdown(dropdown);
    }
    
    userProfile.appendChild(dropdown);
    setupDropdownEventListeners(userProfile, dropdown);
    setupDropdownCloseListener();
}

// 로그인 상태 드롭다운 구성
function populateLoggedInDropdown(dropdown, user) {
    dropdown.classList.add('has-user-info');
    dropdown.appendChild(createDropdownUserInfo(user));
    dropdown.appendChild(createDropdownDivider());
    dropdown.appendChild(createDropdownMenuItem('user-edit', '회원정보수정'));
    dropdown.appendChild(createDropdownMenuItem('password-edit', '비밀번호수정'));
    dropdown.appendChild(createDropdownMenuItem('logout', '로그아웃', 'logout-item'));
}

// 로그아웃 상태 드롭다운 구성
function populateLoggedOutDropdown(dropdown) {
    dropdown.appendChild(createDropdownMenuItem('login', '로그인'));
}

// 드롭다운 구분선 생성
function createDropdownDivider() {
    const divider = document.createElement('div');
    divider.className = 'dropdown-divider';
    return divider;
}

// 드롭다운 이벤트 리스너 설정
function setupDropdownEventListeners(userProfile, dropdown) {
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
            
            if (!activeDropdown || !userProfile) return;
            
            const path = e.composedPath();
            if (!path.includes(userProfile)) {
                activeDropdown.classList.remove('active');
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
    
    // 뒤로가기 버튼 클릭 처리 (커스텀 핸들러 우선, 없으면 기본 history.back())
    onBack() {
        if (window.handleBackNavigation) {
            window.handleBackNavigation();
        } else {
            history.back();
        }
    }
    
    // 헤더 비동기 렌더링
    async renderAsync() {
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');

        this.shadowRoot.replaceChildren();
        this.shadowRoot.appendChild(this.createStyleLink());
        
        const header = await this.createHeader(showBack, showProfile);
        this.shadowRoot.appendChild(header);
    }
    
    // 스타일시트 링크 생성
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
        
        header.appendChild(this.createLeftSection(showBack));
        header.appendChild(this.createCenterSection());
        header.appendChild(await this.createRightSection(showProfile));
        
        return header;
    }
    
    // 헤더 왼쪽 섹션 생성 (뒤로가기 버튼)
    createLeftSection(showBack) {
        const left = document.createElement('div');
        left.className = 'header-left';
        
        if (showBack) {
            left.appendChild(this.createBackButton());
        }
        
        return left;
    }

    // 뒤로가기 버튼 생성
    createBackButton() {
        const backButton = document.createElement('button');
        backButton.className = 'back-btn';
        backButton.setAttribute('aria-label', '뒤로가기');
        backButton.textContent = '←';
        backButton.addEventListener('click', this.onBack);
        return backButton;
    }
    
    // 헤더 중앙 섹션 생성 (로고)
    createCenterSection() {
        const center = document.createElement('div');
        center.className = 'header-center';
        
        center.appendChild(this.createLogo());
        return center;
    }

    // 로고 요소 생성
    createLogo() {
        const title = document.createElement('h1');
        title.className = 'logo';
        title.textContent = LOGO_TEXT;
        title.addEventListener('click', () => {
            window.location.href = HOME_PATH;
        });
        return title;
    }
    
    // 헤더 오른쪽 섹션 생성 (프로필 메뉴)
    async createRightSection(showProfile) {
        const right = document.createElement('div');
        right.className = 'header-right';
        
        if (showProfile) {
            const userProfile = await this.createUserProfile();
            right.appendChild(userProfile);
        }
        
        return right;
    }
    
    // 사용자 프로필 요소 생성
    async createUserProfile() {
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        const user = getUserFromStorage();
        const icon = this.createProfileIcon(user);
        userProfile.appendChild(icon);
        
        createDropdownMenu(userProfile, !!user, user);
        
        return userProfile;
    }

    // 프로필 아이콘 생성
    createProfileIcon(user) {
        const icon = document.createElement('div');
        icon.className = 'profile-icon';
        renderProfileIcon(icon, user);
        return icon;
    }
}

customElements.define('app-header', AppHeader);