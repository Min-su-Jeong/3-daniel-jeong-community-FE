import { initializeElements, navigateTo, requireLogin } from '../../utils/common/index.js';
import { ToastUtils, PageLayout, Modal, PostEditor } from '../../components/index.js';
import { createPost, updatePost, uploadImage } from '../../api/index.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

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
let loadingToast = null;

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
function init() {
    setupPlaceholdersAndHelperTexts();
    PageLayout.initializePage();
    
    postEditor = new PostEditor({
        ...elements,
        onSubmit: handleFormSubmit
    });
}

/**
 * 폼 제출 처리
 */
async function handleFormSubmit() {
    if (!postEditor.validateForm()) {
        ToastUtils.error(VALIDATION_MESSAGE.POST_FORM_INCOMPLETE);
        return;
    }
    
    if (isPostSubmitted) return;
    isPostSubmitted = true;
    postEditor.setSubmitting(true);
    
    try {
        const { isLoggedIn, user } = requireLogin();
        if (!isLoggedIn) {
            ToastUtils.error(TOAST_MESSAGE.LOGIN_REQUIRED);
            isPostSubmitted = false;
            postEditor.setSubmitting(false);
            return;
        }
        
        showLoading();
        
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        
        // 1. 게시글 먼저 생성 (이미지 없이)
        const createResponse = await createPost({
            userId: user.id,
            title: formData.title,
            content: formData.content,
            imageObjectKeys: []
        });
        
        if (!createResponse.success) {
            throw new Error(createResponse.message || '게시글 생성에 실패했습니다.');
        }
        
        const postId = createResponse.data?.postId;
        if (!postId) {
            throw new Error('게시글 ID를 받지 못했습니다.');
        }
        
        // 2. 이미지 업로드 및 게시글 업데이트 (이미지가 있는 경우)
        if (selectedImages.length > 0) {
            try {
                const imageObjectKeys = await uploadImages(selectedImages, postId);
                
                const updateResponse = await updatePost(postId, {
                    title: formData.title,
                    content: formData.content,
                    imageObjectKeys
                });
                
                if (!updateResponse.success) {
                    throw new Error(updateResponse.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
                }
            } catch (error) {
                throw new Error(error.message || TOAST_MESSAGE.IMAGE_UPLOAD_FAILED);
            }
        }
        
        showSuccess(TOAST_MESSAGE.POST_CREATE_SUCCESS);
    } catch (error) {
        isPostSubmitted = false;
        postEditor.setSubmitting(false);
        showError(error.message || TOAST_MESSAGE.POST_CREATE_FAILED);
    }
}

/**
 * 이미지 업로드
 */
async function uploadImages(imageFiles, postId) {
    const uploadedKeys = [];
    
    for (const imageData of imageFiles) {
        try {
            const response = await uploadImage('POST', postId, imageData.file);
            
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
 * 로딩 상태 표시
 */
function showLoading() {
    if (elements.submitBtn) {
        elements.submitBtn.disabled = true;
        elements.submitBtn.style.opacity = '0.6';
        elements.submitBtn.style.cursor = 'not-allowed';
    }
    loadingToast = ToastUtils.info(TOAST_MESSAGE.POST_CREATING, '처리 중', { duration: 0, showClose: false });
}

/**
 * 로딩 상태 해제
 */
function hideLoading() {
    if (elements.submitBtn) {
        elements.submitBtn.disabled = false;
        elements.submitBtn.style.opacity = '1';
        elements.submitBtn.style.cursor = 'pointer';
    }
    if (loadingToast) {
        loadingToast.hide();
        loadingToast = null;
    }
}

/**
 * 에러 표시
 */
function showError(message) {
    hideLoading();
    ToastUtils.error(message, '오류 발생');
}

/**
 * 성공 표시
 */
function showSuccess(message) {
    hideLoading();
    isPostSubmitted = true;
    ToastUtils.success(message, '등록 완료', { duration: 2000 });
    setTimeout(() => navigateTo('/post-list'), 1000);
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
