import { initializeElements, setupPlaceholders, setupStandaloneHelperText, showButtonLoading, hideButtonLoading } from '../../utils/common/element.js';
import { navigateTo, handlePostEditorBackNavigation } from '../../utils/common/navigation.js';
import { requireLogin } from '../../utils/common/user.js';
import { uploadImages } from '../../utils/common/image.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { PostEditor } from '../../components/post-editor/post-editor.js';
import { createPost, updatePost } from '../../utils/api/posts.js';
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
    PageLayout.init();
    
    setupPlaceholders([
        { element: elements.postTitle, placeholder: PLACEHOLDER.POST_TITLE },
        { element: elements.postContent, placeholder: PLACEHOLDER.POST_CONTENT }
    ]);
    
    if (elements.helperText) {
        setupStandaloneHelperText(elements.helperText, HELPER_TEXT.POST_FORM);
    }
    
    postEditor = new PostEditor({
        ...elements,
        onSubmit: handlePostCreate
    });
}

// 게시글 초안 생성 (이미지 없이 먼저 생성하여 ID 확보)
async function createPostDraft(user, formData) {
    // 이미지 없이 먼저 게시글 생성 (ID 확보)
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

// 이미지 업로드 및 게시글 업데이트 (이미지 업로드 후 게시글 정보 업데이트)
async function uploadAndUpdatePost(postId, formData, selectedImages) {
    // 이미지 업로드 후 objectKey 배열 획득
    const imageObjectKeys = await uploadImages(selectedImages, postId, 'POST');
    
    // 업로드된 이미지 포함하여 게시글 정보 업데이트
    const updateResponse = await updatePost(postId, {
        title: formData.title,
        content: formData.content,
        imageObjectKeys
    });
    
    if (!updateResponse.success) {
        throw new Error(updateResponse.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
    }
}

// 제출 상태 초기화 (에러 발생 시 재시도 가능하도록)
function resetFormSubmitting() {
    isPostSubmitted = false;
    postEditor.setSubmitting(false);
}

// 게시글 생성 처리
async function handlePostCreate() {
    // 폼 유효성 검사
    if (!postEditor.validateForm()) {
        Toast.error(VALIDATION_MESSAGE.POST_FORM_INCOMPLETE);
        return;
    }
    
    // 중복 제출 방지
    if (isPostSubmitted) return;
    isPostSubmitted = true;
    postEditor.setSubmitting(true);
    
    try {
        // 로그인 상태 확인
        const { isLoggedIn, user } = requireLogin();
        if (!isLoggedIn) {
            Toast.error(TOAST_MESSAGE.LOGIN_REQUIRED);
            resetFormSubmitting();
            return;
        }
        
        const originalText = elements.submitBtn?.textContent || '';
        showButtonLoading(elements.submitBtn, '처리 중...');
        // 무한 지속 토스트 표시
        loadingToast = Toast.info(TOAST_MESSAGE.POST_CREATING, '처리 중', { duration: 0, showClose: false });
        
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        
        // 1단계: 이미지 없이 게시글 생성 (ID 확보)
        const postId = await createPostDraft(user, formData);
        
        // 2단계: 이미지가 있으면 업로드 후 게시글 업데이트
        if (selectedImages.length > 0) {
            await uploadAndUpdatePost(postId, formData, selectedImages);
        }
        
        showSuccess(TOAST_MESSAGE.POST_CREATE_SUCCESS);
    } catch (error) {
        resetFormSubmitting();
        showError(error.message || TOAST_MESSAGE.POST_CREATE_FAILED);
    }
}


// 에러 처리
function showError(message) {
    const originalText = elements.submitBtn?.textContent || '';
    hideButtonLoading(elements.submitBtn, originalText);
    if (loadingToast) {
        loadingToast.hide();
        loadingToast = null;
    }
    Toast.error(message, '오류 발생');
}

// 성공 처리
function showSuccess(message) {
    const originalText = elements.submitBtn?.textContent || '';
    hideButtonLoading(elements.submitBtn, originalText);
    if (loadingToast) {
        loadingToast.hide();
        loadingToast = null;
    }
    isPostSubmitted = true;
    Toast.success(message, '등록 완료', { duration: 2000 });
    setTimeout(() => navigateTo('/post-list'), 1000);
}

document.addEventListener('DOMContentLoaded', init);
// 뒤로가기 시 미저장 변경사항 확인
window.handleBackNavigation = () => handlePostEditorBackNavigation(postEditor);
