/**
 * Toast 컴포넌트
 * 알림 메시지 표시 컴포넌트 (성공/에러/경고/정보)
 */
export class Toast {
    constructor(options = {}) {
        this.options = {
            type: 'info', // success, error, warning, info
            title: '',
            message: '',
            duration: 3000,
            showClose: true,
            showProgress: true,
            ...options
        };
        this.toastElement = null;
        this.timeoutId = null;
    }

    // Toast 요소 생성
    createElement() {
        const toast = document.createElement('div');
        toast.className = `toast ${this.options.type}`;
        
        toast.appendChild(this.createIconElement());
        toast.appendChild(this.createContentElement());
        
        if (this.options.showClose) {
            toast.appendChild(this.createCloseButton());
        }
        
        toast.appendChild(this.createProgressElement());
        
        return toast;
    }

    // 아이콘 요소 생성
    createIconElement() {
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.textContent = this.getIcon(this.options.type);
        return icon;
    }

    // 컨텐츠 요소 생성
    createContentElement() {
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        if (this.options.title) {
            content.appendChild(this.createTitleElement());
        }
        
        content.appendChild(this.createMessageElement());
        
        return content;
    }

    // 제목 요소 생성
    createTitleElement() {
        const titleEl = document.createElement('div');
        titleEl.className = 'toast-title';
        titleEl.textContent = this.options.title;
        return titleEl;
    }

    // 메시지 요소 생성
    createMessageElement() {
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = this.options.message;
        return messageEl;
    }

    // 닫기 버튼 생성
    createCloseButton() {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.textContent = '×';
        return closeBtn;
    }

    // 프로그레스 바 요소 생성
    createProgressElement() {
        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        return progress;
    }

    // Toast 표시
    show() {
        const container = this.getOrCreateContainer();
        this.toastElement = this.createElement();
        
        container.appendChild(this.toastElement);
        this.applyShowAnimation();
        this.setupEventListeners();
        
        if (this.options.duration > 0) {
            this.setupAutoClose();
        }

        return this;
    }

    // Toast 컨테이너 가져오기 또는 생성
    getOrCreateContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // 표시 애니메이션 적용
    applyShowAnimation() {
        requestAnimationFrame(() => {
            if (this.toastElement) {
                this.toastElement.classList.add('show');
            }
        });
    }

    // Toast 숨기기
    hide() {
        if (!this.toastElement) return;

        this.toastElement.classList.add('hide');
        
        setTimeout(() => {
            this.removeToastElement();
            this.cleanup();
        }, 400);
    }

    // Toast 요소 제거
    removeToastElement() {
        if (this.toastElement?.parentNode) {
            this.toastElement.parentNode.removeChild(this.toastElement);
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        if (!this.toastElement) return;
        
        this.setupCloseButtonListener();
        this.setupToastClickListener();
    }

    // 닫기 버튼 이벤트 리스너 설정
    setupCloseButtonListener() {
        const closeBtn = this.toastElement.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
    }

    // Toast 클릭 이벤트 리스너 설정
    setupToastClickListener() {
        this.toastElement.addEventListener('click', (e) => {
            if (this.shouldHideOnClick(e.target)) {
                this.hide();
            }
        });
    }

    // 클릭 시 숨김 여부 확인
    shouldHideOnClick(target) {
        return target === this.toastElement || 
               (target?.classList?.contains('toast-content'));
    }

    // 자동 닫기 설정
    setupAutoClose() {
        if (this.options.duration <= 0 || !this.toastElement) return;
        
        if (this.options.showProgress) {
            this.setupProgressBar();
        }
        
        this.timeoutId = setTimeout(() => this.hide(), this.options.duration);
    }

    // 프로그레스 바 설정
    setupProgressBar() {
        const progressBar = this.toastElement.querySelector('.toast-progress');
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${this.options.duration}ms linear`;
        }
    }

    // 정리 작업
    cleanup() {
        this.clearTimeout();
        this.toastElement = null;
    }

    // 타임아웃 제거
    clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    // 타입별 아이콘 반환
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }

    // 성공 Toast
    static success(message, title = '성공', options = {}) {
        return new Toast({ type: 'success', title, message, ...options }).show();
    }

    // 에러 Toast
    static error(message, title = '오류', options = {}) {
        return new Toast({ type: 'error', title, message, duration: 5000, ...options }).show();
    }

    // 경고 Toast
    static warning(message, title = '경고', options = {}) {
        return new Toast({ type: 'warning', title, message, ...options }).show();
    }

    // 정보 Toast
    static info(message, title = '알림', options = {}) {
        return new Toast({ type: 'info', title, message, ...options }).show();
    }
}