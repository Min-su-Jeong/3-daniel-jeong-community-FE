import { MODAL_MESSAGE } from '../../utils/constants/modal.js';


// HTML 문자열을 DocumentFragment로 변환하여 삽입
function parseHTML(htmlString) {
    if (!htmlString) {
        return document.createDocumentFragment();
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    const fragment = document.createDocumentFragment();
    
    // body의 모든 자식 노드를 fragment로 이동
    Array.from(doc.body.childNodes).forEach(node => {
        fragment.appendChild(node.cloneNode(true));
    });
    
    return fragment;
}

/**
 * 모달 컴포넌트 클래스
 * 확인/취소 다이얼로그, 배경 스크롤 방지, 애니메이션 지원
 */
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
    }

    /**
     * 모달 표시 (DOM 생성, 이벤트 리스너 등록, 배경 스크롤 방지)
     */
    show() {
        if (this.isVisible) return;
        
        this.hide();
        
        // DOM API로 모달 생성
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // 헤더
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
        
        modal.appendChild(header);
        
        // 컨텐츠
        if (this.options.content) {
            const content = document.createElement('div');
            content.className = 'modal-content';
            // DOMParser를 사용하여 HTML 문자열을 파싱하여 안전하게 삽입
            content.appendChild(parseHTML(this.options.content));
            modal.appendChild(content);
        }
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'modal-actions';
        
        if (this.options.showCancel) {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn-cancel';
            cancelBtn.textContent = this.options.cancelText;
            actions.appendChild(cancelBtn);
        }
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = this.options.confirmType !== 'primary' 
            ? `btn-confirm ${this.options.confirmType}` 
            : 'btn-confirm';
        confirmBtn.textContent = this.options.confirmText;
        actions.appendChild(confirmBtn);
        
        modal.appendChild(actions);
        overlay.appendChild(modal);
        
        this.modalElement = overlay;
        document.body.appendChild(this.modalElement);
        
        this.setupEventListeners();
        
        this.modalElement.classList.add('show');
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
        this.isVisible = true;
        
        // 애니메이션을 위한 지연
        setTimeout(() => {
            this.modalElement.classList.add('visible');
        }, 10);
    }

    /**
     * 모달 숨김 (애니메이션 후 DOM 제거, 배경 스크롤 복구)
     */
    hide() {
        if (!this.isVisible || !this.modalElement) return;
        
        this.modalElement.classList.remove('visible');
        
        // 애니메이션 완료 후 DOM 제거
        setTimeout(() => {
            if (this.modalElement && this.modalElement.parentNode) {
                this.modalElement.parentNode.removeChild(this.modalElement);
            }
            this.modalElement = null;
            document.body.style.overflow = '';
            this.isVisible = false;
        }, 300);
    }

    /**
     * 모달 이벤트 리스너 설정 (확인/취소 버튼, 배경 클릭, ESC 키)
     */
    setupEventListeners() {
        if (!this.modalElement) return;
        
        const confirmBtn = this.modalElement.querySelector('.btn-confirm');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (this.options.onConfirm) {
                    this.options.onConfirm();
                }
                this.hide();
            });
        }
        
        const cancelBtn = this.modalElement.querySelector('.btn-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                if (this.options.onCancel) {
                    this.options.onCancel();
                }
                this.hide();
            });
        }
        
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.hide();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    // 확인 모달 (Promise 반환)
    static confirm(options = {}) {
        const modal = new Modal({
            title: '확인',
            subtitle: MODAL_MESSAGE.SUBTITLE_CONFIRM,
            ...options
        });
        
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve(true);
            modal.options.onCancel = () => resolve(false);
            modal.show();
        });
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
        
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve(true);
            modal.options.onCancel = () => resolve(false);
            modal.show();
        });
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
        
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve();
            modal.show();
        });
    }

    // 알림 모달
    static alert(options = {}) {
        const modal = new Modal({
            title: '알림',
            showCancel: false,
            confirmText: '확인',
            ...options
        });
        
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve();
            modal.show();
        });
    }
}