/**
 * 모달 컴포넌트
 * @param {Object} options - 모달 설정 옵션
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

    render() {
        const { title, subtitle, content, showCancel, cancelText, confirmText, confirmType } = this.options;
        const confirmClass = confirmType !== 'primary' ? `btn-confirm ${confirmType}` : 'btn-confirm';
        
        return `
            <div class="modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        ${subtitle ? `<p class="modal-subtitle">${subtitle}</p>` : ''}
                    </div>
                    ${content ? `<div class="modal-content">${content}</div>` : ''}
                    <div class="modal-actions">
                        ${showCancel ? `<button class="btn-cancel">${cancelText}</button>` : ''}
                        <button class="${confirmClass}">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 모달 표시
     * 배경 스크롤 방지 및 애니메이션 적용
     */
    show() {
        if (this.isVisible) return;
        
        this.hide();
        
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = this.render();
        
        this.modalElement = modalContainer.firstElementChild;
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
     * 모달 숨김
     * 애니메이션 완료 후 DOM에서 제거
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
     * 이벤트 리스너 설정
     * 확인/취소 버튼, 배경 클릭, ESC 키 처리
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

    /**
     * 확인 모달 (Promise 반환)
     * @param {Object} options - 모달 옵션
     * @returns {Promise<boolean>} - 확인(true) 또는 취소(false)
     */
    static confirm(options = {}) {
        const modal = new Modal({
            title: '확인',
            subtitle: '정말로 진행하시겠습니까?',
            ...options
        });
        
        return new Promise((resolve) => {
            modal.options.onConfirm = () => resolve(true);
            modal.options.onCancel = () => resolve(false);
            modal.show();
        });
    }

    /**
     * 삭제 확인 모달
     * @param {Object} options - 모달 옵션
     * @returns {Promise<boolean>} - 삭제 확인(true) 또는 취소(false)
     */
    static confirmDelete(options = {}) {
        const modal = new Modal({
            title: '삭제 확인',
            subtitle: '정말로 삭제하시겠습니까?',
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
            subtitle: '작업이 완료되었습니다.',
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