import { Modal } from '../modal/modal.js';
import { API_SERVER_URI } from '../../utils/constants.js';
import { logout } from '../../api/auth.js';
import { ToastUtils } from '../toast/toast.js';

/**
 * 저장소 정리 유틸리티 함수
 */
function clearUserStorage() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
}

/**
 * 사용자 정보 가져오기
 * - 저장소에 사용자 정보가 없으면 null 반환 (비회원 상태)
 * - 비회원일 때는 API 호출하지 않음
 */
async function getUserFromStorage() {
    try {
        // localStorage 확인 (rememberMe = true인 경우)
        let userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        
        // sessionStorage 확인 (rememberMe = false인 경우)
        userStr = sessionStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * 프로필 아이콘 렌더링
 */
function renderProfileIcon(icon, user) {
    icon.innerHTML = '';
    
    if (user?.profileImageKey) {
        const profileImageUrl = `${API_SERVER_URI}/files/${user.profileImageKey}`;
        const img = document.createElement('img');
        img.src = profileImageUrl;
        img.alt = user.nickname || '프로필';
        img.onerror = () => {
            icon.innerHTML = '';
            icon.textContent = '👤';
        };
        icon.appendChild(img);
    } else {
        icon.textContent = '👤';
    }
}

/**
 * 로그아웃 후 페이지 이동 처리
 */
function handlePostLogoutNavigation() {
    const currentPath = window.location.pathname;
    const isPostListPage = currentPath === '/' || currentPath === '/post-list';
    
    if (isPostListPage) {
        window.history.replaceState({ loggedOut: true }, '', currentPath);
    } else {
        window.history.pushState(null, '', '/');
        window.location.href = '/';
    }
}

/**
 * 로그아웃 처리
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
 * 드롭다운 메뉴 생성
 */
function createDropdownMenu(userProfile, isLoggedIn) {
    const dropdown = document.createElement('div');
    dropdown.className = 'profile-dropdown';
    
    // 로그인 상태에 따라 다른 메뉴 표시
    if (isLoggedIn) {
        dropdown.innerHTML = `
            <button class="dropdown-item" data-action="user-edit">회원정보수정</button>
            <button class="dropdown-item" data-action="password-edit">비밀번호수정</button>
            <button class="dropdown-item logout-item" data-action="logout">로그아웃</button>
        `;
    } else {
        dropdown.innerHTML = `
            <button class="dropdown-item" data-action="login">로그인</button>
        `;
    }
    
    userProfile.appendChild(dropdown);
    
    // 드롭다운 토글
    userProfile.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });
    
    // 드롭다운 아이템 클릭 이벤트
    dropdown.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (!action) return;
        
        e.preventDefault();
        dropdown.classList.remove('active');
        
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
    });
    

    // document에 이벤트 리스너 등록
    if (!document._hasDropdownCloseListener) {
        document.addEventListener('click', (e) => {
            // Shadow DOM 내부의 활성 드롭다운 찾기
            const headers = document.querySelectorAll('app-header');
            headers.forEach(header => {
                const shadowRoot = header.shadowRoot;
                if (shadowRoot) {
                    const activeDropdown = shadowRoot.querySelector('.profile-dropdown.active');
                    const userProfile = shadowRoot.querySelector('.user-profile');
                    if (activeDropdown && userProfile) {
                        // 클릭이 드롭다운 외부인 경우 닫기
                        const path = e.composedPath();
                        if (!path.includes(userProfile)) {
                            activeDropdown.classList.remove('active');
                        }
                    }
                }
            });
        });
        document._hasDropdownCloseListener = true;
    }
}

class AppHeader extends HTMLElement {
    static get observedAttributes() { return ['show-back', 'show-profile']; }

    constructor() {
        super();
        this._onBack = this._onBack.bind(this);
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this._renderAsync();
        // 사용자 정보 업데이트 이벤트 리스너
        window.addEventListener('userUpdated', () => {
            this._renderAsync();
        });
    }
    attributeChangedCallback() { this._renderAsync(); }
    _onBack() {
        if (window.handleBackNavigation) {
            window.handleBackNavigation();
        } else {
            history.back();
        }
    }
    async _renderAsync() {
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');

        this._shadow.innerHTML = '';

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/components/header/header.css';
        this._shadow.appendChild(styleLink);

        const header = document.createElement('header');
        header.className = 'header';

        const left = document.createElement('div');
        left.className = 'header-left';

        const center = document.createElement('div');
        center.className = 'header-center';
        const title = document.createElement('h1');
        title.className = 'logo';
        title.textContent = '아무 말 대잔치';
        center.appendChild(title);

        const right = document.createElement('div');
        right.className = 'header-right';

        if (showBack) {
            const backBtn = document.createElement('button');
            backBtn.className = 'back-btn';
            backBtn.setAttribute('aria-label', '뒤로가기');
            backBtn.textContent = '←';
            backBtn.addEventListener('click', this._onBack);
            left.appendChild(backBtn);
        }

        if (showProfile) {
            const userProfile = document.createElement('div');
            userProfile.className = 'user-profile';
            const icon = document.createElement('div');
            icon.className = 'profile-icon';
            
            // 사용자 정보 가져오기
            const user = await getUserFromStorage();
            renderProfileIcon(icon, user);
            
            userProfile.appendChild(icon);
            
            // 드롭다운 메뉴 생성
            createDropdownMenu(userProfile, !!user);
            
            right.appendChild(userProfile);
        }

        header.appendChild(left);
        header.appendChild(center);
        header.appendChild(right);
        this._shadow.appendChild(header);
    }
    
}

customElements.define('app-header', AppHeader);