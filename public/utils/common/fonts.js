// 폰트 동적 로드 유틸리티
import { S3_CONFIG } from '../constants/image.js';

export function loadFonts() {
    const style = document.createElement('style');
    style.textContent = `
        @font-face {
            font-family: 'Outfit';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('outfit/Outfit-Regular.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Outfit';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('outfit/Outfit-Medium.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Outfit';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('outfit/Outfit-SemiBold.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Outfit';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('outfit/Outfit-Bold.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Outfit';
            font-style: normal;
            font-weight: 800;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('outfit/Outfit-ExtraBold.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Noto Sans KR';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('noto-sans-kr/NotoSansKR-Regular.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Noto Sans KR';
            font-style: normal;
            font-weight: 500;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('noto-sans-kr/NotoSansKR-Medium.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Noto Sans KR';
            font-style: normal;
            font-weight: 600;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('noto-sans-kr/NotoSansKR-SemiBold.ttf')}') format('truetype');
        }
        @font-face {
            font-family: 'Noto Sans KR';
            font-style: normal;
            font-weight: 700;
            font-display: swap;
            src: url('${S3_CONFIG.getFontUrl('noto-sans-kr/NotoSansKR-Bold.ttf')}') format('truetype');
        }
    `;
    document.head.appendChild(style);
}

