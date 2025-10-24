import { initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';

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
const MAX_IMAGES = 10;
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
    
    // 이미지 업로드 이벤트
    postImages.addEventListener('change', handleImageSelect);
    imageUploadArea.addEventListener('click', () => postImages.click());
    imageUploadArea.addEventListener('dragover', handleDragOver);
    imageUploadArea.addEventListener('dragleave', handleDragLeave);
    imageUploadArea.addEventListener('drop', handleDrop);
}

function setupFieldValidation() {
    // 제목 필드 유효성 검사 설정
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

/**
 * 문자 카운터 업데이트
 */
function updateCharCounter() {
    const count = postTitle.value.length;
    charCount.textContent = count;
    
    // 경고 상태 표시
    if (count >= 24) {
        charCount.parentElement.classList.add('warning');
    } else {
        charCount.parentElement.classList.remove('warning');
    }
}

/**
 * 이미지 선택 처리
 */
function handleImageSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        processImageFiles(files);
    }
}

/**
 * 드래그 오버 처리
 */
function handleDragOver(e) {
    e.preventDefault();
    imageUploadArea.classList.add('dragover');
}

/**
 * 드래그 리브 처리
 */
function handleDragLeave(e) {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
}

/**
 * 드롭 처리
 */
function handleDrop(e) {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            processImageFiles(imageFiles);
        } else {
            showError('이미지 파일만 업로드 가능합니다.');
        }
    }
}

/**
 * 다중 이미지 파일 처리
 */
function processImageFiles(files) {
    if (selectedImages.length + files.length > MAX_IMAGES) {
        showError(`최대 ${MAX_IMAGES}개의 이미지만 업로드 가능합니다.`);
        return;
    }
    
    const validFiles = files.filter(file => validateImageFile(file));
    if (validFiles.length === 0) return;
    
    selectedImages.push(...validFiles);
    updateImageGallery();
}

/**
 * 이미지 파일 유효성 검사
 */
function validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showError(`${file.name}: 파일 크기는 5MB 이하여야 합니다.`);
        return false;
    }
    if (!file.type.startsWith('image/')) {
        showError(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
        return false;
    }
    return true;
}

/**
 * 이미지 갤러리 업데이트
 */
function updateImageGallery() {
    const isEmpty = selectedImages.length === 0;
    const isFull = selectedImages.length >= MAX_IMAGES;
    
    imageGallery.style.display = isEmpty ? 'none' : 'block';
    imageUploadArea.style.display = isFull ? 'none' : 'block';
    
    if (isEmpty) return;
    
    galleryCount.textContent = `${selectedImages.length}/${MAX_IMAGES}`;
    galleryGrid.innerHTML = '';
    
    selectedImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            galleryGrid.appendChild(createImagePreviewItem(e.target.result, index));
        };
        reader.readAsDataURL(file);
    });
}

/**
 * 이미지 미리보기 아이템 생성
 */
function createImagePreviewItem(imageSrc, index) {
    const item = document.createElement('div');
    item.className = 'image-preview-item';
    item.innerHTML = `
        <img src="${imageSrc}" alt="미리보기 ${index + 1}">
        <div class="image-order">${index + 1}</div>
        <button type="button" class="remove-image" data-index="${index}">×</button>
    `;
    
    // 제거 버튼 이벤트
    const removeBtn = item.querySelector('.remove-image');
    removeBtn.clickHandler = () => removeImage(index);
    removeBtn.addEventListener('click', removeBtn.clickHandler);
    
    return item;
}

/**
 * 이미지 제거 처리
 */
function removeImage(index) {
    // 배열에서 이미지 제거
    selectedImages.splice(index, 1);
    
    // 갤러리 카운트 업데이트
    galleryCount.textContent = `${selectedImages.length}/${MAX_IMAGES}`;
    
    // 해당 DOM 요소 직접 제거
    const galleryItems = galleryGrid.querySelectorAll('.image-preview-item');
    if (galleryItems[index]) {
        galleryItems[index].remove();
    }
    
    // 남은 이미지들의 순서 번호 업데이트
    const remainingItems = galleryGrid.querySelectorAll('.image-preview-item');
    remainingItems.forEach((item, newIndex) => {
        const orderElement = item.querySelector('.image-order');
        if (orderElement) {
            orderElement.textContent = newIndex + 1;
        }
        // 이벤트 리스너 재설정
        const removeBtn = item.querySelector('.remove-image');
        if (removeBtn) {
            removeBtn.removeEventListener('click', removeBtn.clickHandler);
            removeBtn.clickHandler = () => removeImage(newIndex);
            removeBtn.addEventListener('click', removeBtn.clickHandler);
        }
    });
    
    // 갤러리가 비어있으면 숨기기
    if (selectedImages.length === 0) {
        imageGallery.style.display = 'none';
        imageUploadArea.style.display = 'block';
    } else if (selectedImages.length < MAX_IMAGES) {
        imageUploadArea.style.display = 'block';
    }
    
    // input 초기화
    postImages.value = '';
}

/**
 * 폼 유효성 검사
 */
function validateForm() {
    const title = postTitle.value.trim();
    const content = postContent.value.trim();
    
    const isValid = title.length > 0 && content.length > 0;
    
    submitBtn.disabled = !isValid;
    
    if (isValid) {
        submitBtn.classList.add('valid');
        helperText.classList.add('hidden');
    } else {
        submitBtn.classList.remove('valid');
        helperText.classList.remove('hidden');
        helperText.textContent = helperText.dataset.defaultText;
        helperText.classList.remove('success', 'error', 'warning');
    }
    
    return isValid;
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

/**
 * 에러 메시지 표시
 */
function showError(message) {
    ToastUtils.error(message, '오류 발생');
}


/**
 * 성공 메시지 표시
 */
function showSuccess(message) {
    isPostSubmitted = true; // 게시글 제출 완료로 표시
    ToastUtils.success(message, '등록 완료', {
        duration: 2000
    });
    
    // 토스트 표시 후 바로 이동
    setTimeout(() => {
        navigateTo('/post-list');
    }, 1000);
}

let loadingToast = null;

function showLoading() {
    // 버튼 비활성화
    submitBtn.disabled = true;
    submitBtn.style.opacity = '0.6';
    submitBtn.style.cursor = 'not-allowed';
    
    // 토스트 표시
    loadingToast = ToastUtils.info('게시글을 등록하는 중...', '처리 중', {
        duration: 0,
        showClose: false
    });
}

function hideLoading() {
    // 버튼 활성화
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    
    // 토스트 숨김
    if (loadingToast) {
        loadingToast.hide();
        loadingToast = null;
    }
}

/**
 * 뒤로가기 처리
 */
function handleBackNavigation() {
    const hasContent = postTitle.value.trim() || postContent.value.trim() || selectedImages.length > 0;
    
    if (hasContent && !confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
        return;
    }
    window.history.back();
}

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