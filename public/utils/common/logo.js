// 로고 아이콘 생성 유틸리티
import { S3_CONFIG } from '../constants/image.js';

// 로고 아이콘 이미지 요소 생성
function createLogoIcon() {
    const img = document.createElement('img');
    img.src = S3_CONFIG.getImageUrl('misc/logo.svg');
    img.alt = 'S.W.M Logo';
    img.loading = 'eager';
    img.decoding = 'async';
    return img;
}

// 로고 링크 요소 생성
export function createLogoLink({ href = '/home', text = 'S.W.M' } = {}) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'nav-logo';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'logo-icon';
    iconContainer.appendChild(createLogoIcon());
    
    const textSpan = document.createElement('span');
    textSpan.className = 'logo-text';
    textSpan.textContent = text;
    
    link.appendChild(iconContainer);
    link.appendChild(textSpan);
    
    return link;
}

