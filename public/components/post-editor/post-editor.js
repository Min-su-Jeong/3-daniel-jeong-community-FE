/**
 * 게시글 작성/수정 공통 컴포넌트
 * post-write와 post-edit에서 공통으로 사용되는 로직
 */

import { validateImageFiles, createImagePreviews, updateImageGalleryCount, setupImageUploadEvents } from '../../utils/common/index.js';
import { ToastUtils } from '../index.js';
import { IMAGE_CONSTANTS } from '../../utils/constants/api.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

/**
 * 게시글 에디터 클래스
 * 이미지 갤러리, 폼 검증 등 공통 로직 관리
 */
export class PostEditor {
    constructor(options) {
        const {
            postForm,
            postTitle,
            postContent,
            postImages,
            charCount,
            imageUploadArea,
            imageGallery,
            galleryGrid,
            galleryCount,
            submitBtn,
            helperText,
            onImageChange,
            onFormChange,
            onSubmit
        } = options;

        this.elements = {
            postForm,
            postTitle,
            postContent,
            postImages,
            charCount,
            imageUploadArea,
            imageGallery,
            galleryGrid,
            galleryCount,
            submitBtn,
            helperText
        };

        this.selectedImages = [];
        this.isSubmitting = false;
        this.onImageChange = onImageChange;
        this.onFormChange = onFormChange;
        this.onSubmit = onSubmit;

        this.init();
    }

    /**
     * 에디터 초기화 (이벤트 리스너 및 유효성 검사 설정)
     */
    init() {
        if (this.elements.postImages) {
            this.elements.postImages.accept = IMAGE_CONSTANTS.ACCEPT;
        }
        this.setupEventListeners();
        this.setupFieldValidation();
    }

    /**
     * 이벤트 리스너 설정 (폼 입력, 이미지 업로드, 제출 처리)
     */
    setupEventListeners() {
        const { postContent, postForm, imageUploadArea, postImages } = this.elements;

        if (postContent) {
            postContent.addEventListener('input', () => {
                this.validateForm();
                if (this.onFormChange) this.onFormChange();
            });
        }

        if (postForm) {
            postForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.onSubmit) {
                    this.onSubmit();
                }
            });
        }

        if (imageUploadArea && postImages) {
            setupImageUploadEvents(imageUploadArea, postImages, (files) => {
                this.handleImageFiles(files);
            });
        }
    }

    /**
     * 필드 유효성 검사 설정 (제목 길이 제한, 문자 카운터 업데이트)
     */
    setupFieldValidation() {
        const { postTitle, charCount } = this.elements;
        if (!postTitle || !charCount) return;

        postTitle.addEventListener('input', () => {
            if (postTitle.value.length > 26) {
                postTitle.value = postTitle.value.substring(0, 26);
            }
            this.updateCharCounter();
            this.validateForm();
        });
    }

    /**
     * 제목 문자 카운터 업데이트 (24자 이상 시 경고 표시)
     */
    updateCharCounter() {
        const { postTitle, charCount } = this.elements;
        if (!postTitle || !charCount) return;

        const count = postTitle.value.length;
        charCount.textContent = count;
        if (charCount.parentElement) {
            charCount.parentElement.classList.toggle('warning', count >= 24);
        }
    }

    // 이미지 파일 처리 (검증, 미리보기 생성, 갤러리 업데이트)
    async handleImageFiles(files) {
        const validation = validateImageFiles(
            files,
            IMAGE_CONSTANTS.MAX_IMAGE_SIZE,
            IMAGE_CONSTANTS.MAX_IMAGES
        );

        if (validation.errors.length > 0) {
            validation.errors.forEach(error => {
                ToastUtils.error(error);
            });
            return;
        }

        if (validation.validFiles.length === 0) return;

        if (this.selectedImages.length + validation.validFiles.length > IMAGE_CONSTANTS.MAX_IMAGES) {
            ToastUtils.error(`${TOAST_MESSAGE.IMAGE_MAX_EXCEEDED} (최대 ${IMAGE_CONSTANTS.MAX_IMAGES}개)`);
            return;
        }

        try {
            const { previews, errors } = await createImagePreviews(validation.validFiles);

            if (previews.length > 0) {
                this.selectedImages.push(...previews);
            }

            if (errors.length > 0) {
                ToastUtils.error(TOAST_MESSAGE.IMAGE_PARTIAL_FAILED);
            }

            this.updateImageGallery();
            if (this.onImageChange) {
                this.onImageChange(this.selectedImages);
            }
        } catch (error) {
            ToastUtils.error(TOAST_MESSAGE.IMAGE_PROCESS_FAILED);
        }
    }

    /**
     * 이미지 갤러리 UI 업데이트 (갤러리 표시/숨김, 미리보기 렌더링)
     */
    updateImageGallery() {
        const { imageGallery, imageUploadArea, galleryGrid, galleryCount } = this.elements;
        if (!imageGallery || !imageUploadArea || !galleryGrid) return;

        const isEmpty = this.selectedImages.length === 0;
        const isFull = this.selectedImages.length >= IMAGE_CONSTANTS.MAX_IMAGES;

        imageGallery.style.display = isEmpty ? 'none' : 'block';
        imageUploadArea.style.display = isFull ? 'none' : 'block';

        if (isEmpty) return;

        if (galleryCount) {
            updateImageGalleryCount(galleryCount, this.selectedImages);
        }

        while (galleryGrid.firstChild) {
            galleryGrid.removeChild(galleryGrid.firstChild);
        }

        this.selectedImages.forEach((imageData, index) => {
            galleryGrid.appendChild(this.createImagePreviewItem(imageData.url, index));
        });
    }

    // 이미지 미리보기 아이템 DOM 생성 (이미지, 순서 번호, 삭제 버튼 포함)
    createImagePreviewItem(imageSrc, index) {
        const item = document.createElement('div');
        item.className = 'image-preview-item';

        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `미리보기 ${index + 1}`;
        item.appendChild(img);

        const orderDiv = document.createElement('div');
        orderDiv.className = 'image-order';
        orderDiv.textContent = index + 1;
        item.appendChild(orderDiv);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'remove-image';
        removeButton.setAttribute('data-index', index);
        removeButton.textContent = '×';
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeImage(index);
        });
        item.appendChild(removeButton);

        return item;
    }

    // 선택된 이미지 제거 (배열에서 삭제 후 갤러리 UI 업데이트)
    removeImage(index) {
        this.selectedImages.splice(index, 1);
        this.updateImageGallery();
        
        const { imageGallery, imageUploadArea, postImages } = this.elements;
        
        if (this.selectedImages.length === 0) {
            if (imageGallery) imageGallery.style.display = 'none';
            if (imageUploadArea) imageUploadArea.style.display = 'block';
        } else if (this.selectedImages.length < IMAGE_CONSTANTS.MAX_IMAGES) {
            if (imageUploadArea) imageUploadArea.style.display = 'block';
        }
        
        if (postImages) postImages.value = '';

        if (this.onImageChange) {
            this.onImageChange(this.selectedImages);
        }
    }

    // 폼 유효성 검사 (제목/내용 필수, 제출 버튼 활성화 제어)
    validateForm() {
        const { postTitle, postContent, submitBtn, helperText } = this.elements;
        if (!postTitle || !postContent || !submitBtn) return false;

        const title = postTitle.value.trim();
        const content = postContent.value.trim();

        if (!title || !content) {
            submitBtn.disabled = true;
            if (helperText) {
                helperText.style.display = 'block';
                helperText.textContent = '제목, 내용을 모두 작성해주세요';
                helperText.classList.add('error');
            }
            return false;
        }

        submitBtn.disabled = false;
        if (helperText) {
            helperText.style.display = 'none';
        }
        return true;
    }

    // 기존 이미지 로드 (수정 모드에서 서버에 저장된 이미지 표시)
    loadExistingImages(imageObjectKeys, apiServerUri) {
        if (!imageObjectKeys || imageObjectKeys.length === 0) return;

        imageObjectKeys.forEach(objectKey => {
            this.selectedImages.push({
                file: null,
                url: `${apiServerUri}/files/${objectKey}`,
                isExisting: true,
                objectKey: objectKey
            });
        });

        this.updateImageGallery();
    }

    // 폼 데이터 추출 (제목, 내용, 선택된 이미지)
    getFormData() {
        const { postTitle, postContent } = this.elements;
        return {
            title: postTitle?.value.trim() || '',
            content: postContent?.value.trim() || '',
            images: this.selectedImages
        };
    }

    // 폼 데이터 설정 (수정 모드에서 기존 데이터 로드)
    setFormData(data) {
        const { postTitle, postContent } = this.elements;
        if (postTitle && data.title) {
            postTitle.value = data.title;
        }
        if (postContent && data.content) {
            postContent.value = data.content;
        }
        this.updateCharCounter();
        this.validateForm();
    }

    // 제출 상태 설정 (중복 제출 방지용)
    setSubmitting(isSubmitting) {
        this.isSubmitting = isSubmitting;
    }

    // 제출 상태 확인
    getSubmitting() {
        return this.isSubmitting;
    }

    // 선택된 이미지 배열 반환
    getSelectedImages() {
        return this.selectedImages;
    }
}

