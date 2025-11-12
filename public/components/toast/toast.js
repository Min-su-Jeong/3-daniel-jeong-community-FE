// Toast 컴포넌트
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

    /**
     * Toast 요소 생성
     */
    createElement() {
        const { type, title, message, showClose } = this.options;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = document.createElement('div');
        icon.className = 'toast-icon';
        icon.textContent = this.getIcon(type);
        
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        if (title) {
            const titleEl = document.createElement('div');
            titleEl.className = 'toast-title';
            titleEl.textContent = title;
            content.appendChild(titleEl);
        }
        
        const messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        content.appendChild(messageEl);
        
        toast.appendChild(icon);
        toast.appendChild(content);
        
        if (showClose) {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'toast-close';
            closeBtn.textContent = '×';
            toast.appendChild(closeBtn);
        }
        
        const progress = document.createElement('div');
        progress.className = 'toast-progress';
        toast.appendChild(progress);
        
        return toast;
    }

    /**
     * Toast 표시
     */
    show() {
        // Toast 컨테이너 생성 또는 가져오기
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Toast 요소 생성
        this.toastElement = this.createElement();
        
        container.appendChild(this.toastElement);

        // 애니메이션 적용
        requestAnimationFrame(() => {
            if (this.toastElement) {
                this.toastElement.classList.add('show');
            }
        });

        // 이벤트 리스너 설정
        this.setupEventListeners();

        // 자동 닫기 설정
        if (this.options.duration > 0) {
            this.setupAutoClose();
        }

        return this;
    }

    /**
     * Toast 숨기기
     */
    hide() {
        if (!this.toastElement) return;

        this.toastElement.classList.add('hide');
        
        setTimeout(() => {
            if (this.toastElement && this.toastElement.parentNode) {
                this.toastElement.parentNode.removeChild(this.toastElement);
            }
            this.cleanup();            
        }, 400);
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        if (!this.toastElement) return;
        
        const closeBtn = this.toastElement.querySelector('.toast-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
        
        this.toastElement.addEventListener('click', (e) => {
            if (e.target === this.toastElement || (e.target && e.target.classList && e.target.classList.contains('toast-content'))) {
                this.hide();
            }
        });
    }

    /**
     * 자동 닫기 설정
     */
    setupAutoClose() {
        if (this.options.duration <= 0) return;
        if (!this.toastElement) return;
        
        if (this.options.showProgress) {
            const progressBar = this.toastElement.querySelector('.toast-progress');
            if (progressBar) {
                progressBar.style.width = '100%';
                progressBar.style.transition = `width ${this.options.duration}ms linear`;
            }
        }
        
        this.timeoutId = setTimeout(() => this.hide(), this.options.duration);
    }

    /**
     * 정리 작업
     */
    cleanup() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        this.toastElement = null;
    }

    /**
     * 타입별 아이콘 반환
     */
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || icons.info;
    }
}

/**
 * Toast 유틸리티 함수들
 */
export const ToastUtils = {
    success(message, title = '성공', options = {}) {
        return new Toast({ type: 'success', title, message, ...options }).show();
    },
    error(message, title = '오류', options = {}) {
        return new Toast({ type: 'error', title, message, duration: 5000, ...options }).show();
    },
    warning(message, title = '경고', options = {}) {
        return new Toast({ type: 'warning', title, message, ...options }).show();
    },
    info(message, title = '알림', options = {}) {
        return new Toast({ type: 'info', title, message, ...options }).show();
    }
};