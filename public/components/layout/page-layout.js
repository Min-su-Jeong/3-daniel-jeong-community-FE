/**
 * 공통 페이지 레이아웃 컴포넌트
 */
export class PageLayout {
    constructor(options = {}) {
        this.options = {
            title: '',
            showBack: false,
            showProfile: false,
            pageTitle: '',
            ...options
        };
    }

    // 페이지 초기화 공통 로직
    static initializePage() {
        // 말풍선 애니메이션 초기화
        if (window.BubbleAnimation) {
            window.bubbleAnimation = new window.BubbleAnimation('body');
        }
    }

    // 로딩 상태 관리
    static showLoading(button, loadingText = '처리중...') {
        if (button) {
            button.disabled = true;
            button.textContent = loadingText;
        }
    }

    static hideLoading(button, originalText) {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}