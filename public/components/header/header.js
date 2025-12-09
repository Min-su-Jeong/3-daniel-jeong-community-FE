import { Modal } from '../modal/modal.js';
import { logout } from '../../utils/api/auth.js';
import { Toast } from '../toast/toast.js';
import { renderProfileImage } from '../../utils/common/image.js';
import { getUserFromStorage, removeUserFromStorage, dispatchUserUpdatedEvent } from '../../utils/common/user.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { createLogoLink } from '../../utils/common/logo.js';
import { NAVIGATION_MENU, NAVIGATION_ACTIONS } from '../../utils/constants/navigation.js';

const HOME_PATH = '/post-list';

// 프로필 아이콘 렌더링
async function renderProfileIcon(icon, user) {
    const profileImageKey = user?.profileImageKey || null;
    await renderProfileImage(icon, profileImageKey, '👤', user?.nickname || '프로필');
}

// 사용자 프로필 이미지 요소 생성
async function createUserProfileImage(user, className = 'dropdown-profile-image') {
    const profileImage = document.createElement('div');
    profileImage.className = className;
    await renderProfileIcon(profileImage, user);
    return profileImage;
}

// 사용자 이름 요소 생성
function createUserName(user, className = 'dropdown-user-name') {
    const userName = document.createElement('div');
    userName.className = className;
    userName.textContent = `${user?.nickname || '사용자'}님`;
    return userName;
}

// 사용자 이메일 요소 생성
function createUserEmail(user, className = 'dropdown-user-email') {
    const userEmail = document.createElement('div');
    userEmail.className = className;
    userEmail.textContent = user?.email || '';
    return userEmail;
}

// 사용자 상세 정보 요소 생성
function createUserDetails(user, detailsClassName = 'dropdown-user-details', nameClassName = 'dropdown-user-name', emailClassName = 'dropdown-user-email') {
    const userDetails = document.createElement('div');
    userDetails.className = detailsClassName;
    
    userDetails.appendChild(createUserName(user, nameClassName));
    
    if (user?.email) {
        userDetails.appendChild(createUserEmail(user, emailClassName));
    }
    
    return userDetails;
}

// 사용자 정보 섹션 생성
async function createUserInfo(user, options = {}) {
    const {
        containerClassName = 'dropdown-user-info',
        profileImageClassName = 'dropdown-profile-image',
        detailsClassName = 'dropdown-user-details',
        nameClassName = 'dropdown-user-name',
        emailClassName = 'dropdown-user-email'
    } = options;
    
    const userInfo = document.createElement('div');
    userInfo.className = containerClassName;
    
    const profileImage = await createUserProfileImage(user, profileImageClassName);
    userInfo.appendChild(profileImage);
    userInfo.appendChild(createUserDetails(user, detailsClassName, nameClassName, emailClassName));
    
    return userInfo;
}

// 모바일 메뉴용 사용자 정보 생성
async function createMobileUserInfo(user) {
    return await createUserInfo(user, {
        containerClassName: 'mobile-menu-user-info',
        profileImageClassName: 'mobile-menu-profile-image',
        detailsClassName: 'mobile-menu-user-details',
        nameClassName: 'mobile-menu-user-name',
        emailClassName: 'mobile-menu-user-email'
    });
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

// 프로필 드롭다운 메뉴 생성 및 이벤트 바인딩
async function createDropdownMenu(userProfile, isLoggedIn, user) {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    if (isLoggedIn && user) {
        await populateLoggedInDropdown(dropdown, user);
    } else {
        populateLoggedOutDropdown(dropdown);
    }
    
    userProfile.appendChild(dropdown);
    setupDropdownEventListeners(userProfile, dropdown);
    setupDropdownCloseListener();
}

// 로그인 상태 드롭다운 구성
async function populateLoggedInDropdown(dropdown, user) {
    dropdown.classList.add('has-user-info');
    const userInfo = await createUserInfo(user);
    dropdown.appendChild(userInfo);
    dropdown.appendChild(createDropdownDivider());
    dropdown.appendChild(createDropdownMenuItem('user-edit', '회원정보수정'));
    dropdown.appendChild(createDropdownMenuItem('password-edit', '비밀번호수정'));
    dropdown.appendChild(createDropdownDivider());
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
        const isActive = dropdown.classList.contains('active');
        // 다른 드롭다운 닫기
        document.querySelectorAll('.profile-dropdown.active').forEach(otherDropdown => {
            if (otherDropdown !== dropdown) {
                otherDropdown.classList.remove('active');
            }
        });
        // 현재 드롭다운 토글
        dropdown.classList.toggle('active', !isActive);
    });
    
    dropdown.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;
        
        e.preventDefault();
        e.stopPropagation();
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

// 드롭다운 외부 클릭 시 닫기 처리 (전역 이벤트 리스너는 한 번만 등록)
function setupDropdownCloseListener() {
    if (document.hasDropdownCloseListener) return;
    
    document.addEventListener('click', (e) => {
        const activeDropdowns = document.querySelectorAll('.profile-dropdown.active');
        activeDropdowns.forEach(dropdown => {
            const userProfile = dropdown.closest('.user-profile');
            if (!userProfile) return;
            
            // 클릭이 드롭다운이나 프로필 영역 밖이면 닫기
            if (!userProfile.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
    
    document.hasDropdownCloseListener = true;
}

/**
 * 헤더 컴포넌트 (Web Component)
 * - show-back: 뒤로가기 버튼 표시 여부
 * - show-menu: 네비게이션 메뉴 표시 여부
 * - show-actions: 로그인/회원가입 버튼 표시 여부
 * - active-path: 현재 활성화된 메뉴 경로
 */
class AppHeader extends HTMLElement {
    static get observedAttributes() { 
        return ['show-back', 'show-profile', 'show-menu', 'show-actions', 'active-path']; 
    }

    constructor() {
        super();
        this.onBack = this.onBack.bind(this);
        this.closeMobileMenuHandler = null;
    }

    connectedCallback() { 
        this.renderAsync();
        // 사용자 정보 업데이트 시 헤더 재렌더링
        window.addEventListener('userUpdated', () => {
            this.renderAsync();
        });
        // 헤더 자체 초기화 (스크롤 효과 등)
        this.initHeaderEvents();
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
        // 이전 리스너 정리
        if (this.closeMobileMenuHandler) {
            document.removeEventListener('click', this.closeMobileMenuHandler);
            this.closeMobileMenuHandler = null;
        }
        
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');
        const showMenu = this.getAttribute('show-menu') !== 'false';
        const showActions = this.getAttribute('show-actions') !== 'false';
        const activePath = this.getAttribute('active-path') || window.location.pathname;

        this.replaceChildren();
        
        const nav = await this.createNavigation(showBack, showProfile, showMenu, showActions, activePath);
        this.appendChild(nav);
    }
    
    // 네비게이션 요소 생성
    async createNavigation(showBack, showProfile, showMenu, showActions, activePath) {
        const nav = document.createElement('nav');
        nav.className = 'nav-glass';

        const container = document.createElement('div');
        container.className = 'nav-container';

        // 로고
        const logoLink = createLogoLink({ href: '/home' });
        container.appendChild(logoLink);

        // 네비게이션 메뉴
        if (showMenu) {
            const menu = this.createNavigationMenu(activePath);
            container.appendChild(menu);
        }

        // 액션 버튼 (로그인/회원가입 또는 프로필)
        if (showActions) {
            const actions = await this.createNavigationActions(showProfile);
            container.appendChild(actions);
        }

        // 모바일 메뉴 토글 버튼
        if (showMenu) {
            const mobileToggle = this.createMobileToggle();
            container.appendChild(mobileToggle);
        }

        nav.appendChild(container);

        // 모바일 메뉴
        if (showMenu) {
            const mobileMenu = await this.createMobileMenu(activePath);
            nav.appendChild(mobileMenu);
        }

        return nav;
    }

    /**
     * 네비게이션 메뉴 생성
     */
    createNavigationMenu(activePath) {
        const menu = document.createElement('div');
        menu.className = 'nav-menu';

        NAVIGATION_MENU.forEach(item => {
            const link = document.createElement('a');
            link.href = item.path;
            link.className = 'nav-link';
            if (item.path === activePath) {
                link.classList.add('active');
            }
            link.textContent = item.label;
            menu.appendChild(link);
        });

        return menu;
    }

    /**
     * 네비게이션 액션 버튼 생성
     */
    async createNavigationActions(showProfile) {
        const actions = document.createElement('div');
        actions.className = 'nav-actions';
        actions.id = 'navActions';

        const user = getUserFromStorage();
        
        if (user && showProfile) {
            // 로그인 상태: 프로필 드롭다운 표시
            const userProfile = await this.createUserProfile(user);
            actions.appendChild(userProfile);
        } else if (!user) {
            // 로그아웃 상태: 로그인/회원가입 버튼 표시
            const loginBtn = document.createElement('a');
            loginBtn.href = NAVIGATION_ACTIONS.LOGIN.path;
            loginBtn.className = NAVIGATION_ACTIONS.LOGIN.className;
            loginBtn.id = 'navLoginBtn';
            loginBtn.textContent = NAVIGATION_ACTIONS.LOGIN.label;
            if (window.location.pathname === NAVIGATION_ACTIONS.LOGIN.path) {
                loginBtn.classList.add('active');
            }

            const signupBtn = document.createElement('a');
            signupBtn.href = NAVIGATION_ACTIONS.SIGNUP.path;
            signupBtn.className = NAVIGATION_ACTIONS.SIGNUP.className;
            signupBtn.id = 'navSignupBtn';
            signupBtn.textContent = NAVIGATION_ACTIONS.SIGNUP.label;
            if (window.location.pathname === NAVIGATION_ACTIONS.SIGNUP.path) {
                signupBtn.classList.add('active');
            }

            actions.appendChild(loginBtn);
            actions.appendChild(signupBtn);
        }

        return actions;
    }

    /**
     * 사용자 프로필 요소 생성
     */
    async createUserProfile(user) {
        const userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        const icon = await this.createProfileIcon(user);
        userProfile.appendChild(icon);
        await createDropdownMenu(userProfile, true, user);
        
        return userProfile;
    }

    /**
     * 프로필 아이콘 생성
     */
    async createProfileIcon(user) {
        const icon = document.createElement('div');
        icon.className = 'profile-icon';
        await renderProfileIcon(icon, user);
        return icon;
    }

    /**
     * 모바일 메뉴 닫기
     */
    closeMobileMenu() {
        const mobileMenu = this.querySelector('.mobile-menu');
        const toggle = this.querySelector('.nav-mobile-toggle');
        
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (toggle) toggle.classList.remove('active');
        
        if (this.closeMobileMenuHandler) {
            document.removeEventListener('click', this.closeMobileMenuHandler);
            this.closeMobileMenuHandler = null;
        }
    }

    /**
     * 모바일 메뉴 토글 버튼 생성
     */
    createMobileToggle() {
        const toggle = document.createElement('button');
        toggle.className = 'nav-mobile-toggle';
        toggle.id = 'mobileMenuBtn';
        toggle.setAttribute('aria-label', '메뉴');
        toggle.type = 'button';

        for (let i = 0; i < 3; i++) {
            const span = document.createElement('span');
            toggle.appendChild(span);
        }

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const mobileMenu = this.querySelector('.mobile-menu');
            if (!mobileMenu) return;
            
            const isActive = mobileMenu.classList.contains('active');
            mobileMenu.classList.toggle('active');
            toggle.classList.toggle('active');
            
            if (!isActive) {
                // 외부 클릭 시 메뉴 닫기
                this.closeMobileMenuHandler = (event) => {
                    if (!mobileMenu.contains(event.target) && !toggle.contains(event.target)) {
                        this.closeMobileMenu();
                    }
                };
                setTimeout(() => document.addEventListener('click', this.closeMobileMenuHandler), 0);
            } else {
                this.closeMobileMenu();
            }
        });

        return toggle;
    }

    /**
     * 모바일 메뉴 생성
     */
    async createMobileMenu(activePath) {
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';

        const content = document.createElement('div');
        content.className = 'mobile-menu-content';

        const user = getUserFromStorage();
        if (user) {
            // 로그인 상태: 프로필 정보를 맨 위에 표시
            const userInfo = await createMobileUserInfo(user);
            content.appendChild(userInfo);
            
            const divider = document.createElement('div');
            divider.className = 'mobile-menu-divider';
            content.appendChild(divider);
        }

        NAVIGATION_MENU.forEach(item => {
            const link = document.createElement('a');
            link.href = item.path;
            link.className = 'mobile-menu-link';
            if (item.path === activePath) {
                link.classList.add('active');
            }
            link.textContent = item.label;
            link.addEventListener('click', () => this.closeMobileMenu());
            content.appendChild(link);
        });

        if (user) {
            const divider = document.createElement('div');
            divider.className = 'mobile-menu-divider';
            content.appendChild(divider);
            const userEditLink = document.createElement('a');
            userEditLink.href = '/user-edit';
            userEditLink.className = 'mobile-menu-link';
            userEditLink.textContent = '회원정보수정';
            userEditLink.addEventListener('click', () => this.closeMobileMenu());
            
            const passwordEditLink = document.createElement('a');
            passwordEditLink.href = '/password-edit';
            passwordEditLink.className = 'mobile-menu-link';
            passwordEditLink.textContent = '비밀번호수정';
            passwordEditLink.addEventListener('click', () => this.closeMobileMenu());
            
            content.appendChild(userEditLink);
            content.appendChild(passwordEditLink);
            content.appendChild(divider);
            
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.className = 'mobile-menu-link mobile-menu-link-danger';
            logoutLink.textContent = '로그아웃';
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMobileMenu();
                new Modal({
                    title: MODAL_MESSAGE.TITLE_LOGOUT,
                    subtitle: MODAL_MESSAGE.SUBTITLE_LOGOUT,
                    confirmText: '로그아웃',
                    cancelText: '취소',
                    onConfirm: handleLogout
                }).show();
            });
            content.appendChild(logoutLink);
        } else {
            // 로그아웃 상태: 로그인/회원가입 링크 표시
            const divider = document.createElement('div');
            divider.className = 'mobile-menu-divider';
            
            const loginLink = document.createElement('a');
            loginLink.href = NAVIGATION_ACTIONS.LOGIN.path;
            loginLink.className = 'mobile-menu-link';
            loginLink.textContent = NAVIGATION_ACTIONS.LOGIN.label;
            loginLink.addEventListener('click', () => this.closeMobileMenu());

            const signupLink = document.createElement('a');
            signupLink.href = NAVIGATION_ACTIONS.SIGNUP.path;
            signupLink.className = 'mobile-menu-link';
            signupLink.textContent = NAVIGATION_ACTIONS.SIGNUP.label;
            signupLink.addEventListener('click', () => this.closeMobileMenu());

            content.appendChild(divider);
            content.appendChild(loginLink);
            content.appendChild(signupLink);
        }

        mobileMenu.appendChild(content);
        return mobileMenu;
    }

    /**
     * 헤더 이벤트 초기화
     */
    initHeaderEvents() {
        // 네비게이션 스크롤 효과
        this.initNavbarScroll();
    }

    /**
     * 네비게이션 스크롤 효과 초기화
     */
    initNavbarScroll() {
        const nav = this.querySelector('.nav-glass');
        if (!nav) return;

        let scrollTimeout;
        const handleNavScroll = () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (window.scrollY > 50) {
                    nav.style.background = 'rgba(12, 74, 110, 0.85)';
                    nav.style.borderBottomColor = 'rgba(255, 255, 255, 0.15)';
                } else {
                    nav.style.background = 'var(--card-bg-light)';
                    nav.style.borderBottomColor = 'var(--border-light)';
                }
            }, 50);
        };

        window.addEventListener('scroll', handleNavScroll, { passive: true });
    }
}

customElements.define('app-header', AppHeader);
