/**
 * 떠오르는 물방울 애니메이션
 * bubbles 컨테이너에 물방울을 생성하는 함수
 */

// 다른 페이지에서 사용하는 createBubbles 함수 (bubbles 컨테이너용)
export function createBubbles() {
    const container = document.getElementById('bubblesContainer');
    if (!container) return;

    const BUBBLE_CONFIG = {
        count: 12,
        minSize: 8,
        maxSize: 35,
        minDuration: 10,
        maxDuration: 22
    };

    for (let i = 0; i < BUBBLE_CONFIG.count; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * (BUBBLE_CONFIG.maxSize - BUBBLE_CONFIG.minSize) + BUBBLE_CONFIG.minSize;
        const left = Math.random() * 100;
        const duration = Math.random() * (BUBBLE_CONFIG.maxDuration - BUBBLE_CONFIG.minDuration) + BUBBLE_CONFIG.minDuration;
        const delay = Math.random() * duration;
        
        bubble.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${left}%;
            animation-duration: ${duration}s;
            animation-delay: -${delay}s;
        `;
        
        container.appendChild(bubble);
        }
    }
