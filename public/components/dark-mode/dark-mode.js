/**
 * 다크모드 컴포넌트
 * 오른쪽 하단에 해/달 아이콘 토글 버튼
 */

import { STORAGE_KEY, DARK_CLASS, CSS_PATH } from '../../utils/constants/darkmode.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

class DarkMode extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.isDark = this.loadDarkMode();
        this.button = null;
        this.icon = null;
    }

    connectedCallback() {
        this.init();
        this.applyDarkMode();
    }

    init() {
        if (!this.shadowRoot.querySelector('link[rel="stylesheet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = CSS_PATH;
            this.shadowRoot.appendChild(link);
        }
        
        this.button = this.createButton();
        this.icon = this.button.querySelector('.darkmode-icon');
        this.shadowRoot.appendChild(this.button);
    }

    createButton() {
        const button = document.createElement('button');
        button.className = 'darkmode-button';
        button.setAttribute('aria-label', this.isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
        button.addEventListener('click', () => this.toggle());
        
        const icon = document.createElement('div');
        icon.className = 'darkmode-icon';
        icon.appendChild(this.isDark ? this.createSunIcon() : this.createMoonIcon());
        
        button.appendChild(icon);
        return button;
    }

    createSunIcon() {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', '12');
        circle.setAttribute('cy', '12');
        circle.setAttribute('r', '5');
        svg.appendChild(circle);
        
        [
            ['12', '1', '12', '3'], ['12', '21', '12', '23'],
            ['4.22', '4.22', '5.64', '5.64'], ['18.36', '18.36', '19.78', '19.78'],
            ['1', '12', '3', '12'], ['21', '12', '23', '12'],
            ['4.22', '19.78', '5.64', '18.36'], ['18.36', '5.64', '19.78', '4.22']
        ].forEach(([x1, y1, x2, y2]) => {
            const line = document.createElementNS(SVG_NS, 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            svg.appendChild(line);
        });
        
        return svg;
    }

    createMoonIcon() {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '24');
        svg.setAttribute('height', '24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
        svg.appendChild(path);
        return svg;
    }

    toggle() {
        this.isDark = !this.isDark;
        this.saveDarkMode();
        this.applyDarkMode();
        this.updateIcon();
    }

    updateIcon() {
        if (!this.icon || !this.button) return;
        
        this.button.setAttribute('aria-label', this.isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
        this.icon.replaceChildren();
        this.icon.appendChild(this.isDark ? this.createSunIcon() : this.createMoonIcon());
    }

    applyDarkMode() {
        document.documentElement.classList.toggle(DARK_CLASS, this.isDark);
    }

    loadDarkMode() {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    }

    saveDarkMode() {
        localStorage.setItem(STORAGE_KEY, String(this.isDark));
    }
}

customElements.define('app-darkmode', DarkMode);

