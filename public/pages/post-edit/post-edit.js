import { initializeElements, navigateTo, getCurrentUser, getUrlParam } from '../../utils/common/index.js';
import { ToastUtils, PageLayout, Modal, PostEditor } from '../../components/index.js';
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../../utils/constants/api.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { getPostById, updatePost, uploadImage } from '../../api/index.js';

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

let postEditor = null;
let isPostSubmitted = false;
let postId = null;

// Placeholder 및 Helper Text 설정
function setupPlaceholdersAndHelperTexts() {
    if (elements.postTitle) elements.postTitle.placeholder = PLACEHOLDER.POST_TITLE;
    if (elements.postContent) elements.postContent.placeholder = PLACEHOLDER.POST_CONTENT;
    if (elements.helperText) {
        elements.helperText.textContent = HELPER_TEXT.POST_FORM;
        elements.helperText.dataset.defaultText = HELPER_TEXT.POST_FORM;
    }
}

/**
 * 페이지 초기화
 */
async function init() {
    setupPlaceholdersAndHelperTexts();
    PageLayout.initializePage();

    postEditor = new PostEditor({
        ...elements,
        onSubmit: handleFormSubmit
    });

    await loadPostData();
}

/**
 * 게시글 데이터 로드
 */
async function loadPostData() {
    try {
        postId = getUrlParam('id');
        
        if (!postId) {
            ToastUtils.error(TOAST_MESSAGE.POST_ID_MISSING);
            navigateTo('/post-list');
            return;
        }
        
        let postData = null;
        
        // 세션 스토리지에서 데이터 확인
        const sessionData = sessionStorage.getItem('editPostData');
        if (sessionData) {
            try {
                postData = JSON.parse(sessionData);
                sessionStorage.removeItem('editPostData');
            } catch (error) {
                // 파싱 실패 시 무시
            }
        }
        
        // 세션 스토리지에 데이터가 없으면 API 호출
        if (!postData) {
            postData = await fetchPostData(postId);
            
                if (!postData) {
                    ToastUtils.error(TOAST_MESSAGE.POST_NOT_FOUND);
                    navigateTo('/post-list');
                    return;
                }
        }
        
        // 폼에 데이터 채우기
        postEditor.setFormData({
            title: postData.title || '',
            content: postData.content || ''
        });
        
        // 기존 이미지 로드
        if (postData.imageObjectKeys && postData.imageObjectKeys.length > 0) {
            postEditor.loadExistingImages(postData.imageObjectKeys, API_SERVER_URI);
        }
    } catch (error) {
        ToastUtils.error(TOAST_MESSAGE.POST_LOAD_FAILED);
    }
}

/**
 * 게시글 데이터 가져오기
 */
async function fetchPostData(postId) {
    try {
        const response = await getPostById(postId);
        
        if (!response.success) {
            throw new Error(response.message || TOAST_MESSAGE.POST_LOAD_ERROR);
        }
        
        return response.data;
    } catch (error) {
        throw new Error(error.message || TOAST_MESSAGE.POST_LOAD_ERROR);
    }
}

/**
 * 폼 제출 처리
 */
async function handleFormSubmit() {
    if (isPostSubmitted) return;
    
    if (!postEditor.validateForm()) {
        ToastUtils.error(VALIDATION_MESSAGE.ALL_FIELDS_REQUIRED);
        return;
    }
    
    const user = getCurrentUser();
    if (!user || !user.id) {
        ToastUtils.error(TOAST_MESSAGE.LOGIN_REQUIRED);
        return;
    }
    
    isPostSubmitted = true;
    postEditor.setSubmitting(true);

    if (elements.submitBtn) {
        elements.submitBtn.disabled = true;
    }
    
    try {
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        
        // 이미지 objectKey 배열 준비
        const imageObjectKeys = [];
        
        // 기존 이미지의 objectKey 추가
        selectedImages.forEach((imageData) => {
            if (imageData.isExisting && imageData.objectKey) {
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
                throw new Error(error.message || TOAST_MESSAGE.IMAGE_UPLOAD_FAILED);
            }
        }
        
        // 게시글 수정 API 호출
        const result = await updatePost(postId, {
            title: formData.title,
            content: formData.content,
            imageObjectKeys
        });
        
        if (!result.success) {
            throw new Error(result.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
        }
        
        ToastUtils.success(TOAST_MESSAGE.POST_UPDATE_SUCCESS);
        setTimeout(() => {
            navigateTo(`/post-detail?id=${postId}`);
        }, 1200);
    } catch (error) {
        ToastUtils.error(error.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
    } finally {
        isPostSubmitted = false;
        postEditor.setSubmitting(false);
        if (elements.submitBtn) {
            elements.submitBtn.disabled = false;
        }
    }
}

/**
 * 이미지 업로드
 */
async function uploadImages(imageFiles, postId) {
    const uploadedKeys = [];
    
    for (const imageData of imageFiles) {
        try {
            const response = await uploadImage('PATCH', postId, imageData.file);
            
            if (response.success && response.data && response.data.objectKey) {
                uploadedKeys.push(response.data.objectKey);
            } else {
                throw new Error(TOAST_MESSAGE.IMAGE_UPLOAD_FAILED);
            }
        } catch (error) {
            throw new Error(`${TOAST_MESSAGE.IMAGE_UPLOAD_FAILED}: ${error.message}`);
        }
    }
    
    return uploadedKeys;
}

/**
 * 뒤로가기 처리
 */
function handleBackNavigation() {
    const formData = postEditor?.getFormData();
    const selectedImages = postEditor?.getSelectedImages() || [];
    const hasContent = (formData?.title || formData?.content || selectedImages.length > 0);

    if (hasContent) {
        new Modal({
            title: '확인',
            subtitle: MODAL_MESSAGE.SUBTITLE_UNSAVED_CHANGES,
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
}

document.addEventListener('DOMContentLoaded', init);
window.handleBackNavigation = handleBackNavigation;
