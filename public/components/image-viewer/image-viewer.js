// 이미지 뷰어 컴포넌트
const ANIMATION_DURATION = 300;

export class ImageViewer {
    constructor() {
        this.overlay = null;
        this.currentIndex = 0;
        this.images = [];
        this.boundKeyDown = this.handleKeyDown.bind(this);
    }

    show(imageUrls, initialIndex = 0) {
        this.images = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
        this.currentIndex = Math.max(0, Math.min(initialIndex, this.images.length - 1));
        this.hide();
        this.create();
    }

    create() {
        const overlay = document.createElement('div');
        overlay.className = 'image-viewer-overlay';
        
        const viewer = document.createElement('div');
        viewer.className = 'image-viewer';
        
        viewer.appendChild(this.createCloseButton());
        viewer.appendChild(this.createImageContainer());
        
        if (this.images.length > 1) {
            viewer.appendChild(this.createNavButton('prev'));
            viewer.appendChild(this.createNavButton('next'));
            viewer.appendChild(this.createIndexIndicator());
        }
        
        overlay.appendChild(viewer);
        this.overlay = overlay;
        document.body.appendChild(overlay);
        
        this.setupEventListeners();
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            this.update();
        });
    }

    createCloseButton() {
        const btn = document.createElement('button');
        btn.className = 'image-viewer-close';
        btn.setAttribute('aria-label', '닫기');
        btn.textContent = '×';
        return btn;
    }

    createImageContainer() {
        const container = document.createElement('div');
        container.className = 'image-viewer-container';
        
        const img = document.createElement('img');
        img.className = 'image-viewer-img';
        img.alt = '확대 이미지';
        
        container.appendChild(img);
        return container;
    }

    createNavButton(direction) {
        const btn = document.createElement('button');
        btn.className = `image-viewer-nav image-viewer-${direction}`;
        btn.setAttribute('aria-label', direction === 'prev' ? '이전 이미지' : '다음 이미지');
        return btn;
    }

    createIndexIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'image-viewer-index';
        return indicator;
    }

    setupEventListeners() {
        const closeBtn = this.overlay.querySelector('.image-viewer-close');
        const prevBtn = this.overlay.querySelector('.image-viewer-prev');
        const nextBtn = this.overlay.querySelector('.image-viewer-next');
        
        closeBtn?.addEventListener('click', () => this.hide());
        prevBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(-1);
        });
        nextBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.navigate(1);
        });
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.hide();
        });
        
        document.addEventListener('keydown', this.boundKeyDown);
    }

    handleKeyDown(e) {
        if (e.key === 'Escape') {
            this.hide();
        } else if (e.key === 'ArrowLeft' && this.currentIndex > 0) {
            e.preventDefault();
            this.navigate(-1);
        } else if (e.key === 'ArrowRight' && this.currentIndex < this.images.length - 1) {
            e.preventDefault();
            this.navigate(1);
        }
    }

    navigate(delta) {
        if (this.images.length <= 1) return;
        
        const newIndex = this.currentIndex + delta;
        if (newIndex < 0 || newIndex >= this.images.length) return;
        
        this.currentIndex = newIndex;
        this.update();
    }

    update() {
        if (!this.overlay) return;
        
        const img = this.overlay.querySelector('.image-viewer-img');
        const indexEl = this.overlay.querySelector('.image-viewer-index');
        const prevBtn = this.overlay.querySelector('.image-viewer-prev');
        const nextBtn = this.overlay.querySelector('.image-viewer-next');
        
        if (img) img.src = this.images[this.currentIndex];
        if (indexEl) indexEl.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        
        if (prevBtn) {
            const isDisabled = this.currentIndex === 0;
            prevBtn.disabled = isDisabled;
            prevBtn.classList.toggle('disabled', isDisabled);
        }
        if (nextBtn) {
            const isDisabled = this.currentIndex === this.images.length - 1;
            nextBtn.disabled = isDisabled;
            nextBtn.classList.toggle('disabled', isDisabled);
        }
    }

    hide() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('show');
        document.removeEventListener('keydown', this.boundKeyDown);
        document.body.style.overflow = '';
        
        setTimeout(() => {
            this.overlay?.remove();
            this.overlay = null;
        }, ANIMATION_DURATION);
    }
}
