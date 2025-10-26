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

    // 페이지 HTML 생성
    render() {
        const { title, showBack, showProfile, pageTitle } = this.options;
        
        return `
            <!DOCTYPE html>
            <html lang="ko">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${title}</title>
                <!-- 말풍선 애니메이션 스크립트 -->
                <link rel="stylesheet" href="../../assets/animations/bubble-animation.css">
            </head>
            <body>
                <!-- 헤더 -->
                <app-header ${showBack ? 'show-back' : ''} ${showProfile ? 'show-profile' : ''}></app-header>

                <!-- 메인 컨텐츠 -->
                <main class="main">
                    <div class="container">
                        ${pageTitle ? `<h2 class="page-title">${pageTitle}</h2>` : ''}
                        <div class="page-content"></div>
                    </div>
                </main>

                <!-- Footer -->
                <app-footer></app-footer>

                <script src="../../assets/animations/bubble-animation.js"></script>
                <script type="module" src="/components/header/header.js"></script>
                <script type="module" src="/components/footer/footer.js"></script>
            </body>
            </html>
        `;
    }

    /**
     * 페이지 초기화 공통 로직
     */
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