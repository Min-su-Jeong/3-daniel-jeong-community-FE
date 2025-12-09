import { initializeElements, setupPlaceholders, setupStandaloneHelperText } from '../../utils/common/element.js';
import { navigateTo, getUrlParam, handlePostEditorBackNavigation } from '../../utils/common/navigation.js';
import { getCurrentUserInfo } from '../../utils/common/user.js';
import { uploadImages } from '../../utils/common/image.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { PostEditor } from '../../components/post-editor/post-editor.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { getPostById, updatePost } from '../../utils/api/posts.js';

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

// 페이지 초기화
async function init() {
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
        onSubmit: handlePostUpdate
    });

    await loadPostData();
}

// 세션 스토리지 데이터 파싱 (뒤로가기 후 재진입 시 사용)
function parseSessionData(sessionData) {
    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
}

// 게시글 데이터 로드
async function loadPostData() {
    try {
        postId = getUrlParam('id');
        
        if (!postId) {
            Toast.error(TOAST_MESSAGE.POST_ID_MISSING);
            navigateTo('/post-list');
            return;
        }
        
        // 세션 스토리지에서 데이터 확인 (뒤로가기 후 재진입 시 사용)
        const sessionData = sessionStorage.getItem('editPostData');
        let postData = sessionData ? parseSessionData(sessionData) : null;
        
        // 사용 후 세션 스토리지에서 제거
        if (sessionData) {
                sessionStorage.removeItem('editPostData');
        }
        
        // 세션 데이터가 없으면 API로 조회
        if (!postData) {
            postData = await fetchPostData(postId);
            
                if (!postData) {
                    Toast.error(TOAST_MESSAGE.POST_NOT_FOUND);
                    navigateTo('/post-list');
                    return;
                }
        }
        
        // PostEditor에 제목과 내용 설정
        postEditor.setFormData({
            title: postData.title || '',
            content: postData.content || ''
        });
        
        // 기존 이미지 로드
        if (postData.imageObjectKeys?.length) {
            postEditor.loadExistingImages(postData.imageObjectKeys);
        }
    } catch (error) {
        Toast.error(TOAST_MESSAGE.POST_LOAD_FAILED);
    }
}

// 게시글 데이터 조회
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

// 이미지 objectKey 배열 준비 (기존 이미지 유지 + 새 이미지 업로드)
async function getImageObjectKeys(selectedImages) {
    const imageObjectKeys = [];
    
    // 기존 이미지의 objectKey 추가
    selectedImages.forEach((imageData) => {
        if (imageData.isExisting && imageData.objectKey) {
            imageObjectKeys.push(imageData.objectKey);
        }
    });
    
    // 새로 추가된 이미지 파일 업로드
    const newImageFiles = selectedImages.filter(img => img.file && !img.isExisting);
    if (newImageFiles.length > 0) {
        const uploadedKeys = await uploadImages(newImageFiles, postId, 'PATCH');
        imageObjectKeys.push(...uploadedKeys);
    }
    
    return imageObjectKeys;
}

// 제출 상태 설정 (중복 제출 방지)
function setFormSubmitting(submitting) {
    isPostSubmitted = submitting;
    postEditor.setSubmitting(submitting);
    if (elements.submitBtn) {
        elements.submitBtn.disabled = submitting;
    }
}

// 게시글 수정 처리
async function handlePostUpdate() {
    // 중복 제출 방지
    if (isPostSubmitted) return;
    
    // 폼 유효성 검사
    if (!postEditor.validateForm()) {
        Toast.error(VALIDATION_MESSAGE.ALL_FIELDS_REQUIRED);
        return;
    }
    
    // 로그인 상태 확인
    const { userId } = getCurrentUserInfo();
    if (!userId) {
        Toast.error(TOAST_MESSAGE.LOGIN_REQUIRED);
        return;
    }
    
    setFormSubmitting(true);
    
    try {
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        // 기존 이미지 유지 + 새 이미지 업로드하여 objectKey 배열 생성
        const imageObjectKeys = await getImageObjectKeys(selectedImages);
        
        const result = await updatePost(postId, {
            title: formData.title,
            content: formData.content,
            imageObjectKeys
        });
        
        if (!result.success) {
            throw new Error(result.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
        }
        
        Toast.success(TOAST_MESSAGE.POST_UPDATE_SUCCESS);
        // 성공 후 상세 페이지로 이동 (히스토리 교체하여 뒤로가기 방지)
        setTimeout(() => {
            window.history.replaceState(null, '', '/post-list');
            navigateTo(`/post-detail?id=${postId}`);
        }, 1200);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.POST_UPDATE_FAILED);
    } finally {
        setFormSubmitting(false);
    }
}

document.addEventListener('DOMContentLoaded', init);
// 뒤로가기 시 미저장 변경사항 확인
window.handleBackNavigation = () => handlePostEditorBackNavigation(postEditor);
