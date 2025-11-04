/**
 * 공통 버튼 컴포넌트
 * @param {Object} options - 버튼 설정 옵션
 * @param {string} options.text - 버튼 텍스트
 * @param {string} options.variant - 버튼 스타일 (primary, secondary, danger, success)
 * @param {string} options.size - 버튼 크기 (small, medium, large)
 * @param {Function} options.onClick - 클릭 이벤트 핸들러
 */
export class Button {
    constructor(options = {}) {
        this.options = {
            text: '버튼',
            type: 'button',
            variant: 'primary',
            size: 'medium',
            disabled: false,
            loading: false,
            icon: null,
            onClick: null,
            ...options
        };
    }

    /**
     * 버튼 HTML 생성
     */
    render() {
        const { text, type, variant, size, disabled, loading, icon } = this.options;
        
        const buttonClass = `btn btn-${variant} btn-${size} ${loading ? 'loading' : ''}`;
        
        return `
            <button 
                type="${type}" 
                class="${buttonClass}" 
                ${disabled ? 'disabled' : ''}
            >
                ${icon ? `<span class="btn-icon">${icon}</span>` : ''}
                <span class="btn-text">${loading ? '처리중...' : text}</span>
                ${loading ? '<span class="btn-spinner"></span>' : ''}
            </button>
        `;
    }

    /**
     * 버튼을 DOM에 추가
     * @param {HTMLElement} container - 버튼을 추가할 컨테이너
     * @returns {HTMLElement} - 생성된 버튼 요소
     */
    appendTo(container) {
        const button = document.createElement('div');
        button.innerHTML = this.render();
        
        const buttonElement = button.firstElementChild;
        this.buttonElement = buttonElement; // DOM 참조 저장
        
        // 클릭 이벤트 설정
        if (this.options.onClick) {
            buttonElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.options.onClick(e);
            });
        }
        
        container.appendChild(buttonElement);
        return buttonElement;
    }

    /**
     * 버튼 상태 업데이트
     */
    updateState(newState) {
        this.options = { ...this.options, ...newState };
    }

    /**
     * 로딩 상태 설정
     */
    setLoading(loading) {
        this.options.loading = loading;
        // 실제 DOM 업데이트는 필요시 구현
    }

    /**
     * 비활성화 상태 설정
     * @param {boolean} disabled - 비활성화 여부
     */
    setDisabled(disabled) {
        this.options.disabled = disabled;
        
        // DOM 요소 상태 업데이트
        if (this.buttonElement) {
            this.buttonElement.disabled = disabled;
            if (disabled) {
                this.buttonElement.classList.add('disabled');
            } else {
                this.buttonElement.classList.remove('disabled');
                this.buttonElement.style.opacity = '';
                this.buttonElement.style.background = '';
            }
        }
    }
}