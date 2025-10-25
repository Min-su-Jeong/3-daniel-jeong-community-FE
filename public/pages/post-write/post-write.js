import { initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Modal } from '../../components/modal/modal.js';
import { IMAGE_CONSTANTS } from '../../utils/constants.js';
import { 
    validateImageFiles,
    createImagePreviews,
    updateImageGalleryCount,
    setupImageUploadEvents 
} from '../../utils/common/image.js';

// DOM 요소들 초기화
const elements = initializeElements({
    postForm: 'postForm',
    postTitle: 'postTitle',
    postContent: 'postContent',
    postImages: 'postImages',
    charCount: 'charCount',
    imageUploadArea: 'imageUploadArea',
    imageGallery: 'imageGallery',
    galleryGrid: 'galleryGrid',
    galleryCount: 'galleryCount',
    submitBtn: 'submitBtn',
    helperText: 'helperText'
});

// 개별 변수로 분리
const { postForm, postTitle, postContent, postImages, charCount, imageUploadArea, 
        imageGallery, galleryGrid, galleryCount, submitBtn, helperText } = elements;

// 상태 관리
let selectedImages = [];
let isPostSubmitted = false; // 게시글 제출 완료 여부

/**
 * 페이지 초기화
 */
function init() {
    PageLayout.initializePage();
    setupEventListeners();
    updateCharCounter();
    validateForm();
    setupFieldValidation();
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 폼 이벤트
    postContent.addEventListener('input', handleContentInput);
    postForm.addEventListener('submit', handleFormSubmit);
    
    // 이미지 업로드 이벤트 설정
    setupImageUploadEvents(
        imageUploadArea,
        postImages,
        handleImageFiles
    );
}

function setupFieldValidation() {
    postTitle.addEventListener('input', () => {
        if (postTitle.value.length > 26) {
            postTitle.value = postTitle.value.substring(0, 26);
        }
        updateCharCounter();
        validateForm();
    });
}


/**
 * 내용 입력 처리
 */
function handleContentInput(e) {
    validateForm();
}

// 문자 카운터 업데이트
const updateCharCounter = () => {
    const count = postTitle.value.length;
    charCount.textContent = count;
    charCount.parentElement.classList.toggle('warning', count >= 24);
};

/**
 * 이미지 파일 처리
 */
async function handleImageFiles(files) {
    // 파일 유효성 검사
    const validation = validateImageFiles(
        files, 
        IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
        IMAGE_CONSTANTS.SUPPORTED_TYPES, 
        IMAGE_CONSTANTS.MAX_IMAGES
    );
    
    // 에러 표시
    if (validation.errors.length > 0) {
        validation.errors.forEach(error => showError(error));
    }
    
    // 유효한 파일이 없으면 종료
    if (validation.validFiles.length === 0) return;
    
    // 기존 이미지와 합쳐서 최대 개수 확인
    if (selectedImages.length + validation.validFiles.length > IMAGE_CONSTANTS.MAX_IMAGES) {
        showError(`최대 ${IMAGE_CONSTANTS.MAX_IMAGES}개의 이미지만 업로드 가능합니다.`);
        return;
    }
    
    // 미리보기 URL 생성
    try {
        const { previews, errors } = await createImagePreviews(validation.validFiles);
        
        // 성공한 미리보기 추가
        if (previews.length > 0) {
            selectedImages.push(...previews);
        }
        
        // 실패한 파일들에 대한 에러 표시
        if (errors.length > 0) {
            errors.forEach(({ file, error }) => {
                console.error(`${file.name} 처리 실패:`, error);
            });
            showError('일부 이미지 처리에 실패했습니다.');
        }
        
        updateImageGallery();
    } catch (error) {
        console.error('이미지 미리보기 생성 실패:', error);
        showError('이미지 처리 중 오류가 발생했습니다.');
    }
}

// 이미지 갤러리 업데이트
const updateImageGallery = () => {
    const isEmpty = selectedImages.length === 0;
    const isFull = selectedImages.length >= IMAGE_CONSTANTS.MAX_IMAGES;
    
    imageGallery.style.display = isEmpty ? 'none' : 'block';
    imageUploadArea.style.display = isFull ? 'none' : 'block';
    
    if (isEmpty) return;
    
    // 갤러리 카운트 업데이트
    updateImageGalleryCount(galleryCount, selectedImages);
    galleryGrid.innerHTML = '';
    selectedImages.forEach((imageData, index) => {
        galleryGrid.appendChild(createImagePreviewItem(imageData.url, index));
    });
};

// 이미지 미리보기 아이템 생성
const createImagePreviewItem = (imageSrc, index) => {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML = `
        <img src="${imageSrc}" alt="미리보기 ${index + 1}">
        <div class="image-order">${index + 1}</div>
        <button type="button" class="remove-image" data-index="${index}">×</button>
    `;
    
    item.querySelector('.remove-image').addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage(index);
    });
    
    return item;
};

// 이미지 제거 처리
const removeImage = (index) => {
    selectedImages.splice(index, 1);
    updateImageGallery();
    if (selectedImages.length === 0) {
        imageGallery.style.display = 'none';
        imageUploadArea.style.display = 'block';
    } else if (selectedImages.length < IMAGE_CONSTANTS.MAX_IMAGES) {
        imageUploadArea.style.display = 'block';
    }
    postImages.value = '';
};

/**
 * 폼 유효성 검사
 */
function validateForm() {
    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    
    // 제목과 내용이 모두 있는지 검사
    if (!title || !content) {
        submitBtn.disabled = true;
        helperText.style.display = 'block';
        helperText.textContent = '제목, 내용을 모두 작성해주세요';
        helperText.classList.add('error');
        return false;
    }
    
    // 모든 검증 통과
    submitBtn.disabled = false;
    helperText.style.display = 'none';
    return true;
}

/**
 * 폼 제출 처리
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        showError('제목, 내용을 모두 작성해주세요');
        return;
    }
    
    try {
        showLoading();
        const response = await submitPost(createFormData());
        
        if (response.success) {
            showSuccess('게시글이 성공적으로 등록되었습니다!');
        } else {
            throw new Error(response.message || '게시글 등록에 실패했습니다.');
        }
    } catch (error) {
        console.error('게시글 등록 오류:', error);
        showError(error.message || '게시글 등록 중 오류가 발생했습니다.');
    } finally {
        hideLoading();
    }
}

/**
 * FormData 생성
 */
function createFormData() {
    const formData = new FormData();
    formData.append('title', postTitle.value.trim());
    formData.append('content', postContent.value.trim());
    selectedImages.forEach(image => formData.append('images', image));
    return formData;
}

/**
 * 게시글 제출 API 호출
 */
async function submitPost(formData) {
    // 실제 구현 시 서버 API 엔드포인트로 변경
    // 현재는 모의 구현
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: '게시글이 등록되었습니다.'
            });
        }, 2000);
    });
}

// Toast 유틸리티 함수들
const showError = (message) => ToastUtils.error(message, '오류 발생');
const showSuccess = (message) => {
    isPostSubmitted = true;
    ToastUtils.success(message, '등록 완료', { duration: 2000 });
    setTimeout(() => navigateTo('/post-list'), 1000);
};

let loadingToast = null;
const showLoading = () => {
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    loadingToast = ToastUtils.info('게시글을 등록하는 중...', '처리 중', { duration: 0, showClose: false });
};
const hideLoading = () => {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    if (loadingToast) {
        loadingToast.hide();
        loadingToast = null;
    }
};

// 뒤로가기 처리
const handleBackNavigation = () => {
    const hasContent = postTitle.value.trim() || postContent.value.trim() || selectedImages.length > 0;
    if (hasContent) {
        new Modal({
            title: '확인',
            subtitle: '작성 중인 내용이 있습니다.<br>정말 나가시겠습니까?',
            confirmText: '나가기',
            cancelText: '취소',
            confirmType: 'danger',
            onConfirm: () => {
                window.history.back();
            }
        }).show();
        return;
    }
    window.history.back();
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);

// 뒤로가기 버튼 이벤트
window.handleBackNavigation = handleBackNavigation;

// 페이지 언로드 시 경고
window.addEventListener('beforeunload', (e) => {
    if (isPostSubmitted) return;
    
    const hasContent = postTitle.value.trim() || postContent.value.trim() || selectedImages.length > 0;
    if (hasContent) {
        e.preventDefault();
        e.returnValue = '작성 중인 내용이 있습니다. 정말 나가시겠습니까?';
    }
});