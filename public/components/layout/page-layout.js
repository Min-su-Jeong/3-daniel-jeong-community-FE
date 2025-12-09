/**
 * 공통 페이지 레이아웃 컴포넌트
 */
import { createBubbles } from '../../assets/animations/bubble-animation.js';
import { loadFonts } from '../../utils/common/fonts.js';
import { convertPageImagesToS3 } from '../../utils/common/image.js';

export class PageLayout {
    // Water Background 생성
    static createWaterBackground() {
        if (document.querySelector('.water-bg')) return;
        
        const waterBg = document.createElement('div');
        waterBg.className = 'water-bg';
        
        const waterOverlay = document.createElement('div');
        waterOverlay.className = 'water-overlay';
        
        const bubblesContainer = document.createElement('div');
        bubblesContainer.className = 'bubbles';
        bubblesContainer.id = 'bubblesContainer';
        
        waterBg.appendChild(waterOverlay);
        waterBg.appendChild(bubblesContainer);
        
        document.body.insertBefore(waterBg, document.body.firstChild);
    }

    // Footer 생성
    static createFooter() {
        if (document.querySelector('app-footer')) return;
        
        const footer = document.createElement('app-footer');
        document.body.appendChild(footer);
    }

    // 버블 애니메이션 초기화
    static initBubbles() {
        const bubblesContainer = document.getElementById('bubblesContainer');
        if (bubblesContainer) {
            createBubbles();
        }
    }

    // 공통 페이지 초기화
    static init(options = {}) {
        const {
            bubbles = true,
            waterBg = true,
            footer = true
        } = options;

        // 폰트 로드
        loadFonts();
        
        // 이미지 경로를 S3 URL로 변환
        convertPageImagesToS3();

        // 레이아웃 요소 생성
        if (waterBg) {
            this.createWaterBackground();
        }
        if (footer) {
            this.createFooter();
        }

        // 버블 애니메이션 초기화
        if (bubbles) {
            this.initBubbles();
        }
    }
}
