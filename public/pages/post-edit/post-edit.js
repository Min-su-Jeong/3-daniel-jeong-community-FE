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
let postId = null; // 수정할 게시글 ID

// 페이지 레이아웃 초기화
PageLayout.initializePage();

// 이벤트 리스너 설정
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

// 문자 카운터 업데이트
const updateCharCounter = () => {
    const count = postTitle.value.length;
    charCount.textContent = count;
    charCount.parentElement.classList.toggle('warning', count >= 24);
};

// 폼 유효성 검사
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

// 내용 입력 처리
function handleContentInput() {
    validateForm();
}

// 이미지 파일 처리
async function handleImageFiles(files) {
    // 파일 유효성 검사
    const validation = validateImageFiles(
        files, 
        IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
        IMAGE_CONSTANTS.SUPPORTED_TYPES, 
        IMAGE_CONSTANTS.MAX_IMAGES
    );
    
        if (validation.errors.length > 0) {
            validation.errors.forEach(error => {
                ToastUtils.error(error);
            });
            return;
        }
    
    if (selectedImages.length + validation.validFiles.length > IMAGE_CONSTANTS.MAX_IMAGES) {
        ToastUtils.error(`최대 ${IMAGE_CONSTANTS.MAX_IMAGES}개의 이미지만 업로드 가능합니다.`);
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
            });
            ToastUtils.error('일부 이미지 처리에 실패했습니다.');
        }
        
        updateImageGallery();
    } catch (error) {
        ToastUtils.error('이미지 처리 중 오류가 발생했습니다.');
    }
}

// 이미지 갤러리 업데이트
const updateImageGallery = () => {
    const isEmpty = selectedImages.length === 0;
    const isFull = selectedImages.length >= IMAGE_CONSTANTS.MAX_IMAGES;
    
    imageGallery.style.display = isEmpty ? 'none' : 'block';
    imageUploadArea.style.display = isFull ? 'none' : 'block';
    
    if (isEmpty) return;
    
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
};

// 기존 이미지를 selectedImages에 추가
function loadExistingImages(images) {
    if (!images || images.length === 0) {
        return;
    }
    
    // 기존 이미지를 selectedImages에 추가
    images.forEach(image => {
        selectedImages.push({
            file: null, // 기존 이미지는 file이 없음
            url: image.url,
            isExisting: true, // 기존 이미지 표시
            id: image.id
        });
    });
    
    // 갤러리 업데이트
    updateImageGallery();
}

// 게시글 데이터 로드
async function loadPostData() {
    try {
        // URL에서 postId 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('id');
        
        if (!postId) {
            ToastUtils.error('게시글 ID가 없습니다.');
            navigateTo('/post-list');
            return;
        }
        
        let postData = null;
        
        // 1. 세션 스토리지에서 데이터 확인 (상세 페이지에서 전달된 데이터)
        const sessionData = sessionStorage.getItem('editPostData');
        if (sessionData) {
            try {
                postData = JSON.parse(sessionData);
                // 세션 스토리지 데이터 사용 후 삭제
                sessionStorage.removeItem('editPostData');
            } catch (error) {
            }
        }
        
        // 2. 세션 스토리지에 데이터가 없으면 API 호출
        if (!postData) {
            postData = await fetchPostData(postId);
            
                if (!postData) {
                    ToastUtils.error('게시글을 찾을 수 없습니다.');
                    navigateTo('/post-list');
                    return;
                }
        }
        
        // 폼에 데이터 채우기
        postTitle.value = postData.title || '';
        postContent.value = postData.content || '';
        
        // 제목 카운터 업데이트
        updateCharCounter();
        
        // 기존 이미지 로드
        if (postData.images && postData.images.length > 0) {
            loadExistingImages(postData.images);
        }
        
        // 폼 유효성 검사
        validateForm();
        
    } catch (error) {
        ToastUtils.error('게시글 데이터를 불러오는데 실패했습니다.');
    }
}

// 게시글 데이터 가져오기 (Mock)
async function fetchPostData(postId) {
    // 실제로는 API 호출
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: postId,
                title: '수정할 게시글 제목',
                content: '수정할 게시글 내용입니다.',
                images: [
                    { id: 1, url: 'https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Image+1' },
                    { id: 2, url: 'https://via.placeholder.com/300x200/10B981/FFFFFF?text=Image+2' }
                ]
            });
        }, 500);
    });
}

// 폼 제출 처리
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isPostSubmitted) return;
    
        if (!validateForm()) {
            ToastUtils.error('모든 필수 항목을 입력해주세요.');
            return;
        }
    
    isPostSubmitted = true;
    submitBtn.disabled = true;
    
    try {
        // FormData 생성
        const formData = new FormData();
        formData.append('title', postTitle.value.trim());
        formData.append('content', postContent.value.trim());
        
        // 이미지들 처리
        selectedImages.forEach((imageData, index) => {
            if (imageData.file) {
                // 새로 추가된 이미지
                formData.append(`newImages`, imageData.file);
            } else if (imageData.isExisting) {
                // 기존 이미지 (유지)
                formData.append(`existingImages`, imageData.id);
            }
        });
        
        // 게시글 수정 API 호출 (실제로는 API 호출)
        const result = await updatePost(postId, formData);
        
        if (result.success) {
            ToastUtils.success('게시글이 수정되었습니다.');
            setTimeout(() => {
                navigateTo(`/post-detail?id=${postId}`);
            }, 1500);
        } else {
            throw new Error(result.message || '게시글 수정에 실패했습니다.');
        }
        
    } catch (error) {
        ToastUtils.error(error.message || '게시글 수정에 실패했습니다.');
    } finally {
        isPostSubmitted = false;
        submitBtn.disabled = false;
    }
}

// 게시글 수정 API 호출 (Mock)
async function updatePost(postId, formData) {
    // 실제로는 API 호출
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                success: true,
                message: '게시글이 성공적으로 수정되었습니다.'
            });
        }, 1000);
    });
}

// 페이지 초기화
async function initializePage() {
    try {
        setupEventListeners();
        setupFieldValidation();
        
        // 로딩 상태 표시
        const loadingToast = ToastUtils.info('게시글 데이터를 불러오는 중...', '로딩 중');
        
        await loadPostData();
        
        // 로딩 완료
        loadingToast.hide();
        
    } catch (error) {
        ToastUtils.error('페이지를 불러오는데 실패했습니다.');
    }
}

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

// 뒤로가기 버튼 이벤트
window.handleBackNavigation = handleBackNavigation;

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initializePage);