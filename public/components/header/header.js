class AppHeader extends HTMLElement {
    static get observedAttributes() { return ['show-back', 'show-profile']; }

    constructor() {
        super();
        this._onBack = this._onBack.bind(this);
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { this._render(); }
    attributeChangedCallback() { this._render(); }
    _onBack() { history.back(); }
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
            icon.textContent = '👤';
            userProfile.appendChild(icon);
            right.appendChild(userProfile);
        }

        header.appendChild(left);
        header.appendChild(center);
        header.appendChild(right);
        this._shadow.appendChild(header);
    }
}

customElements.define('app-header', AppHeader);