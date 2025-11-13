import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

/**
 * 모달 컴포넌트
 * 확인/취소 다이얼로그, 배경 스크롤 방지, 애니메이션 지원
 */

const ANIMATION_DELAY = 10;
const ANIMATION_DURATION = 300;
const ESCAPE_KEY = 'Escape';

// HTML 문자열을 DocumentFragment로 변환하여 삽입
function parseHTML(htmlString) {
    if (!htmlString) {
        return document.createDocumentFragment();
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const fragment = document.createDocumentFragment();
    
    Array.from(doc.body.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true));
    });
    
    return fragment;
}

export class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            subtitle: '',
            content: '',
            showCancel: true,
            cancelText: '취소',
            confirmText: '확인',
            confirmType: 'primary',
            onConfirm: null,
            onCancel: null,
            ...options
        };
        
        this.modalElement = null;
        this.isVisible = false;
        this.escapeKeyHandler = null;
    }

    // 모달 표시 (DOM 생성, 이벤트 리스너 등록, 배경 스크롤 방지)
    show() {
        if (this.isVisible) return;
        
        this.hide();
        this.createModalStructure();
        this.setupEventListeners();
        this.applyModalStyles();
        this.scheduleAnimation();
    }

    // 모달 DOM 구조 생성
    createModalStructure() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.appendChild(this.createHeader());
        
        if (this.options.content) {
            modal.appendChild(this.createContent());
        }
        
        modal.appendChild(this.createActions());
        
        overlay.appendChild(modal);
        this.modalElement = overlay;
        document.body.appendChild(this.modalElement);
    }

    // 모달 헤더 생성
    createHeader() {
        const header = document.createElement('div');
        header.className = 'modal-header';
        
        const title = document.createElement('h3');
        title.className = 'modal-title';
        title.appendChild(parseHTML(this.options.title));
        header.appendChild(title);
        
        if (this.options.subtitle) {
            const subtitle = document.createElement('p');
            subtitle.className = 'modal-subtitle';
            subtitle.appendChild(parseHTML(this.options.subtitle));
            header.appendChild(subtitle);
        }
        
        return header;
    }

    // 모달 컨텐츠 생성
    createContent() {
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.appendChild(parseHTML(this.options.content));
        return content;
    }

    // 모달 액션 버튼 생성
    createActions() {
        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        
        if (this.options.showCancel) {
            actions.appendChild(this.createCancelButton());
        }
        
        actions.appendChild(this.createConfirmButton());
        
        return actions;
    }

    // 취소 버튼 생성
    createCancelButton() {
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-cancel';
        cancelBtn.textContent = this.options.cancelText;
        return cancelBtn;
    }

    // 확인 버튼 생성
    createConfirmButton() {
        const confirmBtn = document.createElement('button');
        const confirmClass = this.options.confirmType !== 'primary' 
            ? `btn-confirm ${this.options.confirmType}` 
            : 'btn-confirm';
        confirmBtn.className = confirmClass;
        confirmBtn.textContent = this.options.confirmText;
        return confirmBtn;
    }

    // 모달 스타일 적용 (배경 스크롤 방지)
    applyModalStyles() {
        this.modalElement.classList.add('show');
        document.body.style.overflow = 'hidden';
        this.isVisible = true;
    }

    // 애니메이션 스케줄링
    scheduleAnimation() {
        setTimeout(() => {
            if (this.modalElement) {
                this.modalElement.classList.add('visible');
            }
        }, ANIMATION_DELAY);
    }

    // 모달 숨김 (애니메이션 후 DOM 제거, 배경 스크롤 복구)
    hide() {
        if (!this.isVisible || !this.modalElement) return;
        
        this.modalElement.classList.remove('visible');
        this.removeEscapeKeyListener();
        
        setTimeout(() => {
            this.removeModalFromDOM();
            this.resetModalState();
        }, ANIMATION_DURATION);
    }

    // 모달 DOM 제거
    removeModalFromDOM() {
        if (this.modalElement?.parentNode) {
            this.modalElement.parentNode.removeChild(this.modalElement);
        }
    }

    // 모달 상태 초기화
    resetModalState() {
        this.modalElement = null;
        document.body.style.overflow = '';
        this.isVisible = false;
    }

    // 모달 이벤트 리스너 설정 (확인/취소 버튼, 배경 클릭, ESC 키)
    setupEventListeners() {
        if (!this.modalElement) return;
        
        this.setupConfirmButtonListener();
        this.setupCancelButtonListener();
        this.setupOverlayClickListener();
        this.setupEscapeKeyListener();
    }

    // 확인 버튼 이벤트 리스너 설정
    setupConfirmButtonListener() {
        const confirmBtn = this.modalElement.querySelector('.btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                this.handleConfirm();
            });
        }
    }

    // 취소 버튼 이벤트 리스너 설정
    setupCancelButtonListener() {
        const cancelBtn = this.modalElement.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.handleCancel();
            });
        }
    }

    // 배경 클릭 이벤트 리스너 설정
    setupOverlayClickListener() {
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });
    }

    // ESC 키 이벤트 리스너 설정
    setupEscapeKeyListener() {
        this.escapeKeyHandler = (e) => {
            if (e.key === ESCAPE_KEY && this.isVisible) {
                this.hide();
            }
        };
        document.addEventListener('keydown', this.escapeKeyHandler);
    }

    // ESC 키 리스너 제거
    removeEscapeKeyListener() {
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
            this.escapeKeyHandler = null;
        }
    }

    // 확인 버튼 클릭 처리
    handleConfirm() {
        if (this.options.onConfirm) {
            this.options.onConfirm();
        }
        this.hide();
    }

    // 취소 버튼 클릭 처리
    handleCancel() {
        if (this.options.onCancel) {
            this.options.onCancel();
        }
        this.hide();
    }

    // 확인 모달 (Promise 반환)
    static confirm(options = {}) {
        const modal = new Modal({
            title: '확인',
            subtitle: MODAL_MESSAGE.SUBTITLE_CONFIRM,
            ...options
        });
        
        return Modal.createPromiseModal(modal, true);
    }

    // 삭제 확인 모달
    static confirmDelete(options = {}) {
        const modal = new Modal({
            title: MODAL_MESSAGE.TITLE_DELETE,
            subtitle: MODAL_MESSAGE.SUBTITLE_DELETE_CONFIRM,
            confirmText: '삭제',
            confirmType: 'danger',
            ...options
        });
        
        return Modal.createPromiseModal(modal, true);
    }

    // 성공 모달
    static success(options = {}) {
        const modal = new Modal({
            title: '성공',
            subtitle: MODAL_MESSAGE.SUBTITLE_SUCCESS,
            confirmText: '확인',
            confirmType: 'success',
            showCancel: false,
            ...options
        });
        
        return Modal.createPromiseModal(modal, false);
    }

    // 알림 모달
    static alert(options = {}) {
        const modal = new Modal({
            title: '알림',
            showCancel: false,
            confirmText: '확인',
            ...options
        });
        
        return Modal.createPromiseModal(modal, false);
    }

    // Promise 기반 모달 생성 헬퍼
    static createPromiseModal(modal, resolveOnConfirm = true) {
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve(resolveOnConfirm ? true : undefined);
            modal.options.onCancel = () => resolve(false);
            modal.show();
        });
    }
}