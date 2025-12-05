/**
 * Footer 컴포넌트
 */

class AppFooter extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() { 
        this.render(); 
    }

    render() {
        this.replaceChildren();
        const footer = this.createFooter();
        this.appendChild(footer);
    }

    // Footer 요소 생성
    createFooter() {
        const footer = document.createElement('footer');
        footer.className = 'footer-glass';
        
        footer.appendChild(this.createFooterContainer());
        footer.appendChild(this.createFooterBottom());
        
        return footer;
    }

    // Footer 컨테이너 생성
    createFooterContainer() {
        const container = document.createElement('div');
        container.className = 'footer-container';
        
        container.appendChild(this.createFooterBrand());
        container.appendChild(this.createFooterLinks());
        
        return container;
    }

    // Footer 브랜드 섹션 생성
    createFooterBrand() {
        const brand = document.createElement('div');
        brand.className = 'footer-brand';
        
        const logoLink = document.createElement('a');
        logoLink.href = '/home';
        logoLink.className = 'footer-logo';
        
        const logoText = document.createElement('span');
        logoText.className = 'logo-text';
        logoText.textContent = 'S.W.M';
        logoLink.appendChild(logoText);
        
        const tagline = document.createElement('p');
        tagline.className = 'footer-tagline';
        tagline.textContent = 'Make Your Own Swim Way';
        
        brand.appendChild(logoLink);
        brand.appendChild(tagline);
        
        return brand;
    }

    // Footer 링크 섹션 생성
    createFooterLinks() {
        const links = document.createElement('div');
        links.className = 'footer-links';
        
        links.appendChild(this.createServiceColumn());
        links.appendChild(this.createBrandColumn());
        links.appendChild(this.createRelatedSitesColumn());
        links.appendChild(this.createPolicyColumn());
        
        return links;
    }

    // 서비스 컬럼 생성
    createServiceColumn() {
        const column = document.createElement('div');
        column.className = 'footer-column';
        
        const heading = document.createElement('h4');
        heading.className = 'footer-heading';
        heading.textContent = '서비스';
        
        const links = [
            { href: '/post-list', text: '커뮤니티' },
            { href: '/competitions', text: '대회일정' },
            { href: '/certifications', text: '자격증' },
            { href: '/brands', text: '브랜드' }
        ];
        
        column.appendChild(heading);
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'footer-link';
            a.textContent = link.text;
            column.appendChild(a);
        });
        
        return column;
    }

    // 브랜드 컬럼 생성
    createBrandColumn() {
        const column = document.createElement('div');
        column.className = 'footer-column';
        
        const heading = document.createElement('h4');
        heading.className = 'footer-heading';
        heading.textContent = '브랜드';
        
        const links = [
            { href: 'https://kor.mizuno.com/', text: '미즈노' },
            { href: 'https://www.swim.co.kr/', text: '가나스윔' },
            { href: 'https://www.arena.co.kr/', text: '아레나' },
            { href: 'https://speedo.co.kr/', text: '스피도' }
        ];
        
        column.appendChild(heading);
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'footer-link';
            a.textContent = link.text;
            column.appendChild(a);
        });
        
        return column;
    }

    // 관련 사이트 컬럼 생성
    createRelatedSitesColumn() {
        const column = document.createElement('div');
        column.className = 'footer-column';
        
        const heading = document.createElement('h4');
        heading.className = 'footer-heading';
        heading.textContent = '관련 사이트';
        
        const links = [
            { href: 'https://www.koreaaquatics.or.kr/', text: '대한수영연맹' },
            { href: 'https://www.sports.or.kr/', text: '대한체육회' },
            { href: 'https://www.kspo.or.kr/', text: '국민체육진흥공단' }
        ];
        
        column.appendChild(heading);
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'footer-link';
            a.textContent = link.text;
            column.appendChild(a);
        });
        
        return column;
    }

    // 정책 컬럼 생성
    createPolicyColumn() {
        const column = document.createElement('div');
        column.className = 'footer-column';
        
        const heading = document.createElement('h4');
        heading.className = 'footer-heading';
        heading.textContent = '정책';
        
        const links = [
            { href: '/policy/terms', text: '커뮤니티 이용약관' },
            { href: '/policy/privacy', text: '개인정보처리방침' }
        ];
        
        column.appendChild(heading);
        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.className = 'footer-link';
            a.textContent = link.text;
            column.appendChild(a);
        });
        
        return column;
    }

    // Footer 하단 생성
    createFooterBottom() {
        const bottom = document.createElement('div');
        bottom.className = 'footer-bottom';
        
        const copyright = document.createElement('p');
        copyright.className = 'footer-copyright';
        copyright.textContent = '2025 Swim Way Makers. All rights reserved.';
        
        bottom.appendChild(copyright);
        return bottom;
    }
}

customElements.define('app-footer', AppFooter);
