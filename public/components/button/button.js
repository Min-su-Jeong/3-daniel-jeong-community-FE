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
        const buttonElement = this.createButtonElement();
        this.setupButtonContent(buttonElement);
        this.setupButtonEvents(buttonElement);
        
        this.buttonElement = buttonElement;
        container.appendChild(buttonElement);
        return buttonElement;
    }

    // 버튼 요소 생성
    createButtonElement() {
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
        
        return buttonElement;
    }

    // 버튼 내용 설정 (아이콘, 텍스트, 스피너)
    setupButtonContent(buttonElement) {
        if (this.options.icon) {
            buttonElement.appendChild(this.createIconElement());
        }
        
        buttonElement.appendChild(this.createTextElement());
        
        if (this.options.loading) {
            buttonElement.appendChild(this.createSpinnerElement());
        }
    }

    // 아이콘 요소 생성
    createIconElement() {
        const iconSpan = document.createElement('span');
        iconSpan.className = 'btn-icon';
        iconSpan.textContent = this.options.icon;
        return iconSpan;
    }

    // 텍스트 요소 생성
    createTextElement() {
        const textSpan = document.createElement('span');
        textSpan.className = 'btn-text';
        textSpan.textContent = this.options.loading ? '처리중...' : this.options.text;
        return textSpan;
    }

    // 스피너 요소 생성
    createSpinnerElement() {
        const spinnerSpan = document.createElement('span');
        spinnerSpan.className = 'btn-spinner';
        return spinnerSpan;
    }

    // 버튼 이벤트 설정
    setupButtonEvents(buttonElement) {
        if (this.options.onClick) {
            buttonElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.options.onClick(e);
            });
        }
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

        this.updateTextContent();
        this.updateLoadingState();
    }

    // 텍스트 내용 업데이트
    updateTextContent() {
        const textSpan = this.buttonElement.querySelector('.btn-text');
        if (textSpan) {
            textSpan.textContent = this.options.loading ? '처리중...' : this.options.text;
        }
    }

    // 로딩 상태 업데이트
    updateLoadingState() {
        if (this.options.loading) {
            this.buttonElement.classList.add('loading');
            this.ensureSpinnerExists();
        } else {
            this.buttonElement.classList.remove('loading');
            this.removeSpinner();
        }
    }

    // 스피너 존재 확인 및 추가
    ensureSpinnerExists() {
        if (!this.buttonElement.querySelector('.btn-spinner')) {
            this.buttonElement.appendChild(this.createSpinnerElement());
        }
    }

    // 스피너 제거
    removeSpinner() {
        const spinner = this.buttonElement.querySelector('.btn-spinner');
        if (spinner) {
            spinner.remove();
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
        const containerElement = Button.resolveContainer(container);
        if (!containerElement) return null;

        const { clearOnCreate = true, wrapInRow = false } = options;

        if (clearOnCreate) {
            Button.clearGroup(containerElement);
        }

        const targetContainer = wrapInRow ? document.createElement('div') : containerElement;
        const buttons = Button.createButtonsFromConfigs(configs, targetContainer);

        if (wrapInRow && targetContainer !== containerElement) {
            containerElement.appendChild(targetContainer);
        }

        return Button.createGroupResult(containerElement, buttons);
    }

    // 컨테이너 요소 해석
    static resolveContainer(container) {
        const containerElement = typeof container === 'string' 
            ? document.getElementById(container) 
            : container;
        
        if (!containerElement) {
            console.error('Button container not found');
            return null;
        }
        
        return containerElement;
    }

    // 설정 배열로부터 버튼 생성
    static createButtonsFromConfigs(configs, container) {
        const buttons = [];
        configs.forEach(config => {
            const button = new Button(config);
            const buttonElement = button.appendTo(container);
            buttons.push({ button, element: buttonElement, config });
        });
        return buttons;
    }

    // 그룹 결과 객체 생성
    static createGroupResult(container, buttons) {
        return {
            container,
            buttons,
            clear: () => Button.clearGroup(container),
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

        containerElement.replaceChildren();
    }

    // 단일 버튼 생성 및 컨테이너에 추가
    static create(container, config) {
        const containerElement = Button.resolveContainer(container);
        if (!containerElement) return null;

        const button = new Button(config);
        button.appendTo(containerElement);
        return button;
    }
}
