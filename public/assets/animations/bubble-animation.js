/**
 * 떠오르는 말풍선 애니메이션
 */

// 기본 말풍선 텍스트
const BUBBLE_TEXTS = [
    '#S.W.M', '#오수완', '#수영일지', '#수린이', '#수영입문',
    '#새벽수영', '#저녁수영', '#자유수영', '#수질', '#강습후기',
    '#영법연습', '#자유형연습', '#배영연습', '#평영연습', '#접영연습',
    '#발차기연습', '#킥판', '#물반사람반', '#스노클', '#핀수영',
    '#장비추천', '#수영복추천', '#수경추천', '#오리발추천', '#코어관리',
    '#수영장후기', '#수영대회', '#수용인원', '#레인수', '#출석도장',
    '#기록도전', '#페이스조절', '#호흡연습', '#턴연습', '#킥연습',
    '#체력관리', '#부상주의', '#어깨보호', '#스트레칭', '#회복운동',
    '#수영팁', '#수영질문', '#수영답변', '#정보공유', '#수영소통',
    '#동호회', '#수영친구', '#번개모임', '#수영취미', '#함께수영해요'
];

class BubbleAnimation {
    constructor(container = 'body') {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.isRunning = false;
        this.usedTexts = new Set(); // 사용된 텍스트 저장
        this.usedPositions = new Set(); // 사용된 위치 저장
        this.animationFrameId = null;
        this.init();
    }
    
    init() {
        this.createBubblesContainer();
        this.startContinuousAnimation();
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
        this.container.appendChild(this.bubblesContainer);
    }
    
    startContinuousAnimation() {
        if (this.isRunning) return;
        this.isRunning = true;
        
        let lastTime = 0;
        let nextInterval = 1500 + Math.random() * 2500;
        
        const animate = (currentTime) => {
            if (this.isRunning) {
                if (currentTime - lastTime >= nextInterval) {
                    // 말풍선 생성
                    this.createBubble();
                    lastTime = currentTime;
                    nextInterval = 1500 + Math.random() * 2500; // 다음 간격 랜덤 설정
                }
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    createBubble() {
        // 왼쪽 말풍선 생성
        this.createSingleBubble('left');
        // 오른쪽 말풍선 생성
        this.createSingleBubble('right');
    }
    
    createSingleBubble(side = null) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        // 중복되지 않는 텍스트 선택
        let randomText;
        const maxTextAttempts = 20;
        
        for (let textAttempts = 0; textAttempts < maxTextAttempts; textAttempts++) {
            randomText = BUBBLE_TEXTS[Math.floor(Math.random() * BUBBLE_TEXTS.length)];
            if (!this.usedTexts.has(randomText)) {
                break;
            }
        }
        
        this.usedTexts.add(randomText);
        bubble.textContent = randomText;
        
        // 랜덤 위치 설정
        let randomPosition;
        const maxPositionAttempts = 20;
        
        // 위치 범위 정의
        const leftRange = { min: 5, max: 30 };
        const rightRange = { min: 65, max: 90 };
        
        for (let positionAttempts = 0; positionAttempts < maxPositionAttempts; positionAttempts++) {
            // 지정된 쪽 또는 랜덤 선택
            if (side === 'left') {
                randomPosition = Math.random() * (leftRange.max - leftRange.min) + leftRange.min;
            } else if (side === 'right') {
                randomPosition = Math.random() * (rightRange.max - rightRange.min) + rightRange.min;
            } else {
                const isLeft = Math.random() < 0.5;
                const range = isLeft ? leftRange : rightRange;
                randomPosition = Math.random() * (range.max - range.min) + range.min;
            }
            
            const isPositionValid = !Array.from(this.usedPositions).some(pos => Math.abs(pos - randomPosition) < 15);
            if (isPositionValid) {
                break;
            }
        }
        
        this.usedPositions.add(randomPosition);
        bubble.style.left = `${randomPosition}%`;
        
        // 초기 위치 설정
        bubble.style.bottom = '-100px';
        bubble.style.opacity = '0';
        
        // 애니메이션 설정
        const duration = 22;
        
        bubble.style.animation = `bubbleFloat ${duration}s linear forwards`;
        
        this.bubblesContainer.appendChild(bubble);
        
        // 메모리 누수 방지를 위한 timeout ID 저장
        const timeoutId = setTimeout(() => {
            if (bubble.parentNode) {
                bubble.remove();
                this.usedTexts.delete(randomText);
                this.usedPositions.delete(randomPosition);
            }
        }, duration * 1000);
        
        bubble.timeoutId = timeoutId;
    }
    
    stopAnimation() {
        this.isRunning = false;
        
        // requestAnimationFrame 정리
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // 모든 timeout 정리
        const bubbles = this.bubblesContainer.querySelectorAll('.bubble');
        bubbles.forEach(bubble => {
            if (bubble.timeoutId) {
                clearTimeout(bubble.timeoutId);
            }
        });
        
        // 기존 말풍선 제거
        this.bubblesContainer.replaceChildren();
        
        // Set 초기화
        this.usedTexts.clear();
        this.usedPositions.clear();
    }
    
    destroy() {
        this.stopAnimation();
        if (this.bubblesContainer) {
            this.bubblesContainer.remove();
        }
    }
}

// 전역으로 사용할 수 있도록 export
window.BubbleAnimation = BubbleAnimation;

// 기본 인스턴스 생성 함수
window.createBubbleAnimation = (container = 'body') => {
    return new BubbleAnimation(container);
};