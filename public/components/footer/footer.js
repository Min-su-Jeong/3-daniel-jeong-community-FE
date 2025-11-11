import { API_SERVER_URI } from '../../utils/constants/api.js';

class AppFooter extends HTMLElement {
    constructor() {
        super();
        this._shadow = this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this._render(); 
    }

    _render() {
        const copyrightText = this.getAttribute('copyright-text') || '© 2025 아무말대잔치 Community. All rights reserved';


        this._shadow.innerHTML = '';

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/components/footer/footer.css';
        this._shadow.appendChild(styleLink);


        const footer = document.createElement('footer');
        footer.className = 'footer';

        // 구분선 추가
        const divider = document.createElement('div');
        divider.className = 'footer-divider';

        const footerContent = document.createElement('div');
        footerContent.className = 'footer-content';

        // 링크들
        const footerLinks = document.createElement('div');
        footerLinks.className = 'footer-links';

        // 이용약관 링크
        const termsLink = document.createElement('a');
        termsLink.href = `${API_SERVER_URI}/terms`;
        termsLink.className = 'footer-link';
        termsLink.textContent = '커뮤니티 이용약관';
        footerLinks.appendChild(termsLink);

        // 개인정보처리방침 링크
        const privacyLink = document.createElement('a');
        privacyLink.href = `${API_SERVER_URI}/privacy`;
        privacyLink.className = 'footer-link';
        privacyLink.textContent = '개인정보처리방침';
        footerLinks.appendChild(privacyLink);

        // 저작권 정보
        const copyright = document.createElement('span');
        copyright.className = 'footer-copyright';
        copyright.textContent = copyrightText;
        footerLinks.appendChild(copyright);

        footerContent.appendChild(footerLinks);
        footer.appendChild(divider);
        footer.appendChild(footerContent);
        this._shadow.appendChild(footer);
    }

}

customElements.define('app-footer', AppFooter);