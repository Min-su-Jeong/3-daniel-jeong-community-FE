/**
 * 공통 버튼 컴포넌트
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
        this.buttonElement = null;
    }

    // 버튼 요소를 DOM에 추가
    appendTo(container) {
        const buttonElement = document.createElement('button');
        buttonElement.type = this.options.type;
        buttonElement.className = `btn btn-${this.options.variant} btn-${this.options.size}`;
        
        if (this.options.disabled) {
            buttonElement.disabled = true;
            buttonElement.classList.add('disabled');
        }
        
        if (this.options.loading) {
            buttonElement.classList.add('loading');
        }

        // 아이콘 추가
        if (this.options.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = 'btn-icon';
            iconSpan.textContent = this.options.icon;
            buttonElement.appendChild(iconSpan);
        }

        // 텍스트 추가
        const textSpan = document.createElement('span');
        textSpan.className = 'btn-text';
        textSpan.textContent = this.options.loading ? '처리중...' : this.options.text;
        buttonElement.appendChild(textSpan);

        // 로딩 스피너 추가
        if (this.options.loading) {
            const spinnerSpan = document.createElement('span');
            spinnerSpan.className = 'btn-spinner';
            buttonElement.appendChild(spinnerSpan);
        }
        
        // 클릭 이벤트 설정
        if (this.options.onClick) {
            buttonElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.options.onClick(e);
            });
        }
        
        this.buttonElement = buttonElement;
        container.appendChild(buttonElement);
        return buttonElement;
    }

    // 버튼 옵션 및 DOM 상태 업데이트
    updateState(newState) {
        this.options = { ...this.options, ...newState };
        if (this.buttonElement) {
            this.updateDOMState();
        }
    }

    // 버튼 DOM 상태 동기화 (텍스트, 로딩 스피너 표시/숨김)
    updateDOMState() {
        if (!this.buttonElement) return;

        const textSpan = this.buttonElement.querySelector('.btn-text');
        if (textSpan) {
            textSpan.textContent = this.options.loading ? '처리중...' : this.options.text;
        }

        if (this.options.loading) {
            this.buttonElement.classList.add('loading');
            if (!this.buttonElement.querySelector('.btn-spinner')) {
                const spinnerSpan = document.createElement('span');
                spinnerSpan.className = 'btn-spinner';
                this.buttonElement.appendChild(spinnerSpan);
            }
        } else {
            this.buttonElement.classList.remove('loading');
            const spinner = this.buttonElement.querySelector('.btn-spinner');
            if (spinner) {
                spinner.remove();
            }
        }
    }

    // 버튼 로딩 상태 설정 (스피너 표시/숨김)
    setLoading(loading) {
        this.options.loading = loading;
        this.updateDOMState();
    }

    // 버튼 비활성화 상태 설정
    setDisabled(disabled) {
        this.options.disabled = disabled;
        
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

    // 버튼 그룹 생성 (여러 버튼 일괄 생성 및 관리)
    static createGroup(container, configs, options = {}) {
        const containerElement = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        if (!containerElement) {
            console.error('Button container not found');
            return null;
        }

        const { clearOnCreate = true, wrapInRow = false } = options;

        if (clearOnCreate) {
            Button.clearGroup(containerElement);
        }

        const buttons = [];
        const targetContainer = wrapInRow ? document.createElement('div') : containerElement;

        configs.forEach(config => {
            const button = new Button(config);
            const buttonElement = button.appendTo(targetContainer);
            buttons.push({ button, element: buttonElement, config });
        });

        if (wrapInRow && targetContainer !== containerElement) {
            containerElement.appendChild(targetContainer);
        }

        return {
            container: containerElement,
            buttons,
            clear: () => Button.clearGroup(containerElement),
            findButton: (predicate) => buttons.find(({ config }) => predicate(config)),
            getButtons: () => buttons.map(({ element }) => element)
        };
    }

    // 버튼 그룹 초기화 (컨테이너 내 모든 버튼 제거)
    static clearGroup(container) {
        const containerElement = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        if (!containerElement) return;

        while (containerElement.firstChild) {
            containerElement.removeChild(containerElement.firstChild);
        }
    }

    // 단일 버튼 생성 및 컨테이너에 추가
    static create(container, config) {
        const containerElement = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        if (!containerElement) {
            console.error('Button container not found');
            return null;
        }

        const button = new Button(config);
        button.appendTo(containerElement);
        return button;
    }
}
