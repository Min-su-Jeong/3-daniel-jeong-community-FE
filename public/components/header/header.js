import { Modal } from '../modal/modal.js';
import { API_SERVER_URI } from '../../utils/constants.js';

class AppHeader extends HTMLElement {
    static get observedAttributes() { return ['show-back', 'show-profile']; }

    constructor() {
        super();
        this._onBack = this._onBack.bind(this);
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this._render();
        // 사용자 정보 업데이트 이벤트 리스너
        window.addEventListener('userUpdated', () => {
            this._render();
        });
    }
    attributeChangedCallback() { this._render(); }
    _onBack() {
        if (window.handleBackNavigation) {
            window.handleBackNavigation();
        } else {
            history.back();
        }
    }
    _render() {
        const showBack = this.hasAttribute('show-back');
        const showProfile = this.hasAttribute('show-profile');

        // Clear
        this._shadow.innerHTML = '';

        // Styles (isolated)
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/components/header/header.css';
        this._shadow.appendChild(styleLink);

        // Structure: always three zones to keep center fixed
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

        // Show/hide elements based on attributes
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
            
            // localStorage에서 사용자 정보 가져오기
            try {
                const userStr = localStorage.getItem('user');
                
                if (userStr) {
                    const user = JSON.parse(userStr);
                    // profileImageKey가 있으면 동적으로 URL 생성
                    if (user.profileImageKey) {
                        const profileImageUrl = `${API_SERVER_URI}/files/${user.profileImageKey}`;
                        const img = document.createElement('img');
                        img.src = profileImageUrl;
                        img.alt = user.nickname || '프로필';
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                        img.style.display = 'block';
                        // 이미지 로드 실패 시 기본 아이콘 표시
                        img.onerror = () => {
                            icon.innerHTML = '';
                            icon.textContent = '👤';
                        };
                        icon.innerHTML = '';
                        icon.appendChild(img);
                    } else {
                        // 프로필 이미지가 없으면 기본 아이콘
                        icon.innerHTML = '';
                        icon.textContent = '👤';
                    }
                } else {
                    // 사용자 정보가 없으면 기본 아이콘
                    icon.innerHTML = '';
                    icon.textContent = '👤';
                }
            } catch (error) {
                icon.innerHTML = '';
                icon.textContent = '👤';
            }
            
            userProfile.appendChild(icon);
            
            // 드롭다운 메뉴
            const dropdown = document.createElement('div');
            dropdown.className = 'profile-dropdown';
            dropdown.innerHTML = `
                <button class="dropdown-item" data-action="user-edit">회원정보수정</button>
                <button class="dropdown-item" data-action="password-edit">비밀번호수정</button>
                <button class="dropdown-item logout-item" data-action="logout">로그아웃</button>
            `;
            userProfile.appendChild(dropdown);
            
            // 드롭다운 토글
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.toggle('active');
            });
            
            // 드롭다운 아이템 클릭 이벤트
            dropdown.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action) {
                    e.preventDefault();
                    dropdown.classList.remove('active');
                    
                    switch (action) {
                        case 'user-edit':
                            window.location.href = '/user-edit';
                            break;
                        case 'password-edit':
                            window.location.href = '/password-edit';
                            break;
                        case 'logout':
                            new Modal({
                                title: '로그아웃',
                                subtitle: '로그아웃 하시겠습니까?',
                                confirmText: '로그아웃',
                                cancelText: '취소',
                                onConfirm: () => {
                                    // TODO: 로그아웃 API 호출
                                    window.location.href = '/login';
                                }
                            }).show();
                            break;
                    }
                }
            });
            
            // 외부 클릭 시 드롭다운 닫기
            document.addEventListener('click', () => {
                dropdown.classList.remove('active');
            });
            
            right.appendChild(userProfile);
        }

        header.appendChild(left);
        header.appendChild(center);
        header.appendChild(right);
        this._shadow.appendChild(header);
    }
}

customElements.define('app-header', AppHeader);