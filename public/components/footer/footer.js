/**
 * Footer 컴포넌트
 * 페이지 하단 푸터 (이용약관, 개인정보처리방침 링크)
 */

import { API_SERVER_URI } from '../../utils/constants/api.js';

class AppFooter extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() { 
        this.render(); 
    }

    render() {
        const copyrightText = this.getCopyrightText();
        
        this.shadowRoot.replaceChildren();
        this.shadowRoot.appendChild(this.createStyleLink());
        
        const footer = this.createFooter(copyrightText);
        this.shadowRoot.appendChild(footer);
    }

    // 저작권 텍스트 가져오기
    getCopyrightText() {
        return this.getAttribute('copyright-text') || '© 2025 아무말대잔치 Community. All rights reserved';
    }

    // 스타일 링크 생성
    createStyleLink() {
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = '/components/footer/footer.css';
        return styleLink;
    }

    // Footer 요소 생성
    createFooter(copyrightText) {
        const footer = document.createElement('footer');
        footer.className = 'footer';
        
        footer.appendChild(this.createDivider());
        footer.appendChild(this.createFooterContent(copyrightText));
        
        return footer;
    }

    // 구분선 생성
    createDivider() {
        const divider = document.createElement('div');
        divider.className = 'footer-divider';
        return divider;
    }

    // Footer 컨텐츠 생성
    createFooterContent(copyrightText) {
        const footerContent = document.createElement('div');
        footerContent.className = 'footer-content';
        
        const footerLinks = this.createFooterLinks(copyrightText);
        footerContent.appendChild(footerLinks);
        
        return footerContent;
    }

    // Footer 링크들 생성
    createFooterLinks(copyrightText) {
        const footerLinks = document.createElement('div');
        footerLinks.className = 'footer-links';
        
        footerLinks.appendChild(this.createTermsLink());
        footerLinks.appendChild(this.createPrivacyLink());
        footerLinks.appendChild(this.createCopyright(copyrightText));
        
        return footerLinks;
    }

    // 이용약관 링크 생성
    createTermsLink() {
        const termsLink = document.createElement('a');
        termsLink.href = `${API_SERVER_URI}/terms`;
        termsLink.className = 'footer-link';
        termsLink.textContent = '커뮤니티 이용약관';
        return termsLink;
    }

    // 개인정보처리방침 링크 생성
    createPrivacyLink() {
        const privacyLink = document.createElement('a');
        privacyLink.href = `${API_SERVER_URI}/privacy`;
        privacyLink.className = 'footer-link';
        privacyLink.textContent = '개인정보처리방침';
        return privacyLink;
    }

    // 저작권 정보 생성
    createCopyright(copyrightText) {
        const copyright = document.createElement('span');
        copyright.className = 'footer-copyright';
        copyright.textContent = copyrightText;
        return copyright;
    }

}

customElements.define('app-footer', AppFooter);