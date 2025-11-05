import { initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Modal } from '../../components/modal/modal.js';
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../../utils/constants.js';
import { 
    validateImageFiles,
    createImagePreviews, 
    updateImageGalleryCount,
    setupImageUploadEvents 
} from '../../utils/common/image.js';
import { getPostById, updatePost } from '../../api/posts.js';
import { uploadImage } from '../../api/images.js';

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

/**
 * 현재 사용자 정보 가져오기
 */
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

// 페이지 레이아웃 초기화
PageLayout.initializePage();
postImages.accept = IMAGE_CONSTANTS.ACCEPT;

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
function loadExistingImages(imageObjectKeys) {
    if (!imageObjectKeys || imageObjectKeys.length === 0) {
        return;
    }
    
    // 기존 이미지를 selectedImages에 추가
    imageObjectKeys.forEach(objectKey => {
        selectedImages.push({
            file: null, // 기존 이미지는 file이 없음
            url: `${API_SERVER_URI}/files/${objectKey}`,
            isExisting: true, // 기존 이미지 표시
            objectKey: objectKey // 기존 이미지의 objectKey 저장
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
        if (postData.imageObjectKeys && postData.imageObjectKeys.length > 0) {
            loadExistingImages(postData.imageObjectKeys);
        }
        
        // 폼 유효성 검사
        validateForm();
        
    } catch (error) {
        ToastUtils.error('게시글 데이터를 불러오는데 실패했습니다.');
    }
}

// 게시글 데이터 가져오기
async function fetchPostData(postId) {
    try {
        const response = await getPostById(postId);
        
        if (!response.success) {
            throw new Error(response.message || '게시글을 불러오는데 실패했습니다.');
        }
        
        return response.data;
    } catch (error) {
        throw new Error(error.message || '게시글을 불러오는데 실패했습니다.');
    }
}

// 폼 제출 처리
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (isPostSubmitted) return;
    
    if (!validateForm()) {
        ToastUtils.error('모든 필수 항목을 입력해주세요.');
        return;
    }
    
    // 현재 사용자 확인
    const user = getCurrentUser();
    if (!user || !user.id) {
        ToastUtils.error('로그인이 필요합니다.');
        return;
    }
    
    isPostSubmitted = true;
    submitBtn.disabled = true;
    
    try {
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        
        // 이미지 objectKey 배열 준비
        const imageObjectKeys = [];
        
        // 기존 이미지의 objectKey 추가
        selectedImages.forEach((imageData) => {
            if (imageData.isExisting && imageData.objectKey) {
                // 기존 이미지 (유지)
                imageObjectKeys.push(imageData.objectKey);
            }
        });
        
        // 새로운 이미지 업로드
        const newImageFiles = selectedImages.filter(img => img.file && !img.isExisting);
        if (newImageFiles.length > 0) {
            try {
                const uploadedKeys = await uploadImages(newImageFiles, postId);
                imageObjectKeys.push(...uploadedKeys);
            } catch (error) {
                throw new Error(error.message || '이미지 업로드에 실패했습니다.');
            }
        }
        
        // 게시글 수정 API 호출
        const result = await updatePost(postId, {
            title,
            content,
            imageObjectKeys
        });
        
        if (!result.success) {
            throw new Error(result.message || '게시글 수정에 실패했습니다.');
        }
        
        ToastUtils.success('게시글이 수정되었습니다.');
        setTimeout(() => {
            navigateTo(`/post-detail?id=${postId}`);
        }, 1200);
        
    } catch (error) {
        ToastUtils.error(error.message || '게시글 수정에 실패했습니다.');
    } finally {
        isPostSubmitted = false;
        submitBtn.disabled = false;
    }
}

/**
 * 이미지 업로드 (게시글 수정 시)
 */
async function uploadImages(imageFiles, postId) {
    const uploadedKeys = [];
    
    for (const imageData of imageFiles) {
        try {
            // 이미지 업로드 (resourceId는 게시글 ID)
            const response = await uploadImage('PATCH', postId, imageData.file);
            
            if (response.success && response.data && response.data.objectKey) {
                uploadedKeys.push(response.data.objectKey);
            } else {
                throw new Error('이미지 업로드에 실패했습니다.');
            }
        } catch (error) {
            throw new Error(`이미지 업로드 중 오류가 발생했습니다: ${error.message}`);
        }
    }
    
    return uploadedKeys;
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