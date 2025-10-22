/**
 * 떠오르는 말풍선 애니메이션
 * 
 * 기능:
 * - 화면 하단에서 위로 떠오르는 말풍선 애니메이션
 * - 커뮤니티 키워드들이 랜덤하게 표시됨
 * - 호버 시 팝 애니메이션 효과
 * - 화면 전체에 균등 분포로 배치
 */

// 기본 말풍선 텍스트 상수
const BUBBLE_TEXTS = {
    COMMUNITY: [
        '#아무말대잔치',
        '#오늘의이야기',
        '#자유게시판',
        '#댓글달기',
        '#함께나눠요',
        '#소소한일상',
        '#질문있어요',
        '#정보공유',
        '#같이이야기해요',
        '#우리들의공간',
        '#일상톡톡',
        '#맛집후기',
        '#여행후기',
        '#영화추천',
        '#책추천',
        '#음악추천',
        '#운동후기',
        '#요리후기',
        '#반려동물후기',
        '#취미공유'
    ]
};

class BubbleAnimation {
    constructor(container = 'body', options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.options = {
            // 기본 설정
            bubbleCount: 20, 
            animationDuration: { min: 15, max: 20 }, // 애니메이션 시간
            delayRange: { min: 1, max: 12 }, // 지연 시간 범위
            positionRange: { min: 5, max: 95 }, // 위치 범위
            
            // 말풍선 텍스트
            bubbleTexts: BUBBLE_TEXTS.COMMUNITY,
            
            // 스타일 옵션
            bubbleStyle: {
                background: 'white'
            },
            
            // 애니메이션 옵션
            animationOptions: {
                startOpacity: 0,
                endOpacity: 0,
                visibleOpacity: 1,
                startScale: 0.9,
                endScale: 1.3,
                startBottom: 0,
                endBottom: '100vh'
            },
            
            // 이벤트 옵션
            enableHover: true,
            hoverAnimation: 'bubblePop',
            
            ...options
        };
        
        this.bubbles = [];
        this.isRunning = false;
        this.init();
    }
    
    init() {
        this.createBubblesContainer();
        this.generateBubbles();
        this.startAnimation();
    }
    
    createBubblesContainer() {
        // 기존 컨테이너가 있으면 제거
        const existingContainer = this.container.querySelector('.bubbles-container');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        // 새 컨테이너 생성
        this.bubblesContainer = document.createElement('div');
        this.bubblesContainer.className = 'bubbles-container';
        this.bubblesContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.container.appendChild(this.bubblesContainer);
    }
    
    generateBubbles() {
        this.bubbles = [];
        this.usedPositions = [];
        
        for (let i = 0; i < this.options.bubbleCount; i++) {
            const bubble = this.createBubble(i);
            this.bubbles.push(bubble);
            this.bubblesContainer.appendChild(bubble);
        }
    }
    
    createBubble(index) {
        const bubble = document.createElement('div');
        bubble.className = `bubble bubble-${index + 1}`;
        
        // 텍스트 설정 
        const textIndex = index % this.options.bubbleTexts.length;
        bubble.textContent = this.options.bubbleTexts[textIndex];
        
        // CSS 클래스 적용
        bubble.className = 'bubble';
        
        // JavaScript에서만 필요한 동적 스타일만 적용
        Object.assign(bubble.style, {
            opacity: this.options.animationOptions.startOpacity,
            bottom: `${this.options.animationOptions.startBottom}px`,
            transform: `scale(${this.options.animationOptions.startScale})`,
            cursor: this.options.enableHover ? 'pointer' : 'default'
        });
        
        // 위치 설정
        const leftPosition = this.getRandomPosition();
        bubble.style.left = `${leftPosition}%`;
        
        // 애니메이션 설정
        const duration = this.getRandomDuration();
        const delay = this.getRandomDelay();
        
        bubble.style.animation = `floatUp ${duration}s linear infinite ${delay}s`;
        
        // 호버 이벤트
        if (this.options.enableHover) {
            bubble.addEventListener('mouseenter', () => {
                bubble.style.animation = `${this.options.hoverAnimation} 0.6s ease-out forwards`;
                bubble.style.pointerEvents = 'none'; // 중복 클릭 방지
            });
        }
        
        // 말풍선 꼬리 추가
        this.addBubbleTail(bubble);
        
        return bubble;
    }
    
    addBubbleTail(bubble) {
        const tail = document.createElement('div');
        tail.className = 'bubble-tail';
        
        // CSS 삼각형을 이용한 말풍선 꼬리 생성
        tail.style.cssText = `
            position: absolute;
            bottom: -10px;
            left: 20px;
            border-width: 10px 10px 0; /* 위쪽 화살표 모양 */
            border-style: solid;
            border-color: ${this.options.bubbleStyle.background} transparent transparent transparent;
        `;
        bubble.appendChild(tail);
    }
    
    getRandomPosition() {
        const { min, max } = this.options.positionRange;
        let position;
        let attempts = 0;
        const maxAttempts = 20;
        
        do {
            // 화면을 4개 구역으로 나누어 균등 분포 (겹침 방지)
            const section = this.bubbles.length % 4; // 0, 1, 2, 3 순환
            const sectionWidth = (max - min) / 4; // 각 구역의 너비
            const sectionStart = min + section * sectionWidth; // 구역 시작점
            
            // 해당 구역 내에서 랜덤 위치 선택
            position = sectionStart + Math.random() * sectionWidth;
            attempts++;
        } while (this.isPositionTooClose(position) && attempts < maxAttempts);
        
        // 위치를 기록하여 겹침 방지
        this.usedPositions.push(position);
        
        return Math.max(min, Math.min(max, position));
    }
    
    isPositionTooClose(newPosition) {
        const minDistance = 12; // 최소 거리 (겹침 방지)
        
        // 기존 위치들과 너무 가까운지 확인
        return this.usedPositions.some(pos => {
            return Math.abs(pos - newPosition) < minDistance;
        });
    }
    
    getRandomDuration() {
        const { min, max } = this.options.animationDuration;
        return Math.random() * (max - min) + min;
    }
    
    getRandomDelay() {
        const { min, max } = this.options.delayRange;
        
        // 균등한 간격을 위해 인덱스 기반 계산
        const totalRange = max - min; // 전체 지연 시간 범위
        const step = totalRange / Math.max(1, this.options.bubbleCount - 1); // 각 말풍선 간 간격
        const baseDelay = min + (this.bubbles.length * step); // 기본 지연 시간
        const randomOffset = Math.random() * (step * 0.3); // 30% 범위 내 랜덤 오프셋
        
        return Math.min(baseDelay + randomOffset, max);
    }
    
    startAnimation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.addAnimationStyles();
    }
    
    addAnimationStyles() {
        // 기존 스타일이 있으면 제거 (중복 방지)
        const existingStyle = document.querySelector('#bubble-animation-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        
        // CSS 애니메이션 스타일을 동적으로 생성
        const style = document.createElement('style');
        style.id = 'bubble-animation-styles';
        const { startOpacity, endOpacity, visibleOpacity, startScale, endScale, startBottom, endBottom } = this.options.animationOptions;
        
        // 말풍선이 아래에서 위로 떠오르는 애니메이션
        style.textContent = `
            @keyframes floatUp {
                0% { opacity: ${startOpacity}; bottom: ${startBottom}px; transform: scale(${startScale}); }
                10%, 90% { opacity: ${visibleOpacity}; }
                100% { opacity: ${endOpacity}; bottom: ${endBottom}; transform: scale(${endScale}); }
            }
            
            @keyframes bubblePop {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(0); opacity: 0; }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    stopAnimation() {
        this.isRunning = false;
        this.bubbles.forEach(bubble => {
            bubble.style.animation = 'none';
        });
    }
    
    destroy() {
        this.stopAnimation();
        if (this.bubblesContainer) {
            this.bubblesContainer.remove();
        }
        this.bubbles = [];
    }
    
    // 설정 업데이트
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.destroy();
        this.init();
    }
    
    // 말풍선 텍스트 업데이트
    updateBubbleTexts(newTexts) {
        this.options.bubbleTexts = newTexts;
        this.bubbles.forEach((bubble, index) => {
            const textIndex = index % this.options.bubbleTexts.length;
            bubble.textContent = this.options.bubbleTexts[textIndex];
        });
    }
}

// 전역으로 사용할 수 있도록 export
window.BubbleAnimation = BubbleAnimation;

// 기본 인스턴스 생성 함수
window.createBubbleAnimation = (container = 'body', options = {}) => {
    return new BubbleAnimation(container, options);
};