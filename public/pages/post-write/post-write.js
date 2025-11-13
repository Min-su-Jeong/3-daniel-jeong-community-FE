import { initializeElements, setupPlaceholders, setupStandaloneHelperText } from '../../utils/common/element.js';
import { navigateTo, handlePostEditorBackNavigation } from '../../utils/common/navigation.js';
import { requireLogin } from '../../utils/common/user.js';
import { uploadImages } from '../../utils/common/image.js';
import { Toast, PageLayout, PostEditor } from '../../components/index.js';
import { createPost, updatePost } from '../../api/index.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';

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

// 페이지 초기화
function init() {
    setupPlaceholders([
        { element: elements.postTitle, placeholder: PLACEHOLDER.POST_TITLE },
        { element: elements.postContent, placeholder: PLACEHOLDER.POST_CONTENT }
    ]);
    
    if (elements.helperText) {
        setupStandaloneHelperText(elements.helperText, HELPER_TEXT.POST_FORM);
    }
    PageLayout.initializePage();
    
    postEditor = new PostEditor({
        ...elements,
        onSubmit: handlePostCreate
    });
}

// 게시글 생성 (이미지 없이 먼저 생성하여 postId 획득)
// 이미지 업로드에 postId가 필요하므로 게시글을 먼저 생성
async function createPostDraft(user, formData) {
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
    
    return postId;
}

// 이미지 업로드 및 게시글 업데이트
// 생성된 게시글에 이미지를 업로드한 후 게시글 정보 업데이트
async function uploadAndUpdatePost(postId, formData, selectedImages) {
    const imageObjectKeys = await uploadImages(selectedImages, postId, 'POST');
    
    const updateResponse = await updatePost(postId, {
        title: formData.title,
        content: formData.content,
        imageObjectKeys
    });
    
    if (!updateResponse.success) {
        throw new Error(updateResponse.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
    }
}

// 폼 제출 상태 초기화
function resetFormSubmitting() {
    isPostSubmitted = false;
    postEditor.setSubmitting(false);
}

// 폼 제출 처리
async function handlePostCreate() {
    if (!postEditor.validateForm()) {
        Toast.error(VALIDATION_MESSAGE.POST_FORM_INCOMPLETE);
        return;
    }
    
    if (isPostSubmitted) return;
    isPostSubmitted = true;
    postEditor.setSubmitting(true);
    
    try {
        const { isLoggedIn, user } = requireLogin();
        if (!isLoggedIn) {
            Toast.error(TOAST_MESSAGE.LOGIN_REQUIRED);
            resetFormSubmitting();
            return;
        }
        
        showLoading();
        
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        
        const postId = await createPostDraft(user, formData);
        
        if (selectedImages.length > 0) {
            await uploadAndUpdatePost(postId, formData, selectedImages);
        }
        
        showSuccess(TOAST_MESSAGE.POST_CREATE_SUCCESS);
    } catch (error) {
        resetFormSubmitting();
        showError(error.message || TOAST_MESSAGE.POST_CREATE_FAILED);
    }
}

// 로딩 상태 표시
function showLoading() {
    if (elements.submitBtn) {
        elements.submitBtn.disabled = true;
        elements.submitBtn.style.opacity = '0.6';
        elements.submitBtn.style.cursor = 'not-allowed';
    }
    loadingToast = Toast.info(TOAST_MESSAGE.POST_CREATING, '처리 중', { duration: 0, showClose: false });
}

// 로딩 상태 해제
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

// 에러 표시
function showError(message) {
    hideLoading();
    Toast.error(message, '오류 발생');
}

// 성공 표시
function showSuccess(message) {
    hideLoading();
    isPostSubmitted = true;
    Toast.success(message, '등록 완료', { duration: 2000 });
    setTimeout(() => navigateTo('/post-list'), 1000);
}

document.addEventListener('DOMContentLoaded', init);
window.handleBackNavigation = () => handlePostEditorBackNavigation(postEditor);
