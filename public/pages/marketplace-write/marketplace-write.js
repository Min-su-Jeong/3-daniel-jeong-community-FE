import { initializeElements, setupPlaceholders, setupStandaloneHelperText, showButtonLoading, hideButtonLoading, setupLocationCharCounter, setupPriceFormatter, getPriceValue } from '../../utils/common/element.js';
import { navigateTo, handlePostEditorBackNavigation } from '../../utils/common/navigation.js';
import { requireLogin } from '../../utils/common/user.js';
import { Modal } from '../../components/modal/modal.js';
import { uploadImages } from '../../utils/common/image.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { PostEditor } from '../../components/post-editor/post-editor.js';
import { createProduct, updateProduct } from '../../utils/api/marketplace.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

const elements = initializeElements({
    postForm: 'productForm',
    postTitle: 'productTitle',
    postContent: 'productContent',
    postImages: 'productImages',
    charCount: 'titleCharCount',
    imageUploadArea: 'imageUploadArea',
    imageGallery: 'imageGallery',
    galleryGrid: 'galleryGrid',
    galleryCount: 'galleryCount',
    submitBtn: 'submitBtn',
    helperText: 'helperText',
    productLocation: 'productLocation',
    locationCharCount: 'locationCharCount'
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

    setupLocationCharCounter(elements.productLocation, elements.locationCharCount);
    const priceInput = document.getElementById('productPrice');
    setupPriceFormatter(priceInput);
}

// 상품 초안 생성 (이미지 없이 먼저 생성하여 ID 확보)
async function createProductDraft(user, formData) {
    const priceInput = document.getElementById('productPrice');
    const categoryInput = document.querySelector('input[name="category"]:checked');
    const locationInput = document.getElementById('productLocation');
    
    const price = getPriceValue(priceInput);
    const category = categoryInput?.value || null;
    const location = locationInput?.value.trim() || '';
    
    // 이미지 없이 먼저 상품 생성 (ID 확보)
    const createResponse = await createProduct({
        userId: user.id,
        title: formData.title,
        content: formData.content,
        price: price,
        category: category,
        location: location,
        status: 'SELLING',
        imageObjectKeys: []
    });
    
    if (!createResponse.success) {
        throw new Error(createResponse.message || '상품 생성에 실패했습니다.');
    }
    
    const productId = createResponse.data?.productId;
    if (!productId) {
        throw new Error('상품 ID를 받지 못했습니다.');
    }
    
    return productId;
}

// 이미지 업로드 및 상품 업데이트 (이미지 업로드 후 상품 정보 업데이트)
async function uploadAndUpdateProduct(productId, formData, selectedImages) {
    const priceInput = document.getElementById('productPrice');
    const categoryInput = document.querySelector('input[name="category"]:checked');
    const locationInput = document.getElementById('productLocation');
    
    const price = getPriceValue(priceInput);
    const category = categoryInput?.value || null;
    const location = locationInput?.value.trim() || '';
    
    // 이미지 업로드 후 objectKey 배열 획득
    const imageObjectKeys = await uploadImages(selectedImages, productId, 'PRODUCT');
    
    // 업로드된 이미지 포함하여 상품 정보 업데이트
    const updateResponse = await updateProduct(productId, {
        title: formData.title,
        content: formData.content,
        price: price,
        category: category,
        location: location,
        status: 'SELLING',
        imageObjectKeys
    });
    
    if (!updateResponse.success) {
        throw new Error(updateResponse.message || '상품 업데이트에 실패했습니다.');
    }
}

// 제출 상태 초기화 (에러 발생 시 재시도 가능하도록)
function resetFormSubmitting() {
    isPostSubmitted = false;
    postEditor.setSubmitting(false);
}

// 상품 등록 처리
async function handlePostCreate() {
    // 폼 유효성 검사
    if (!postEditor.validateForm()) {
        Toast.error(VALIDATION_MESSAGE.POST_FORM_INCOMPLETE);
        return;
    }
    
    // 가격 검증
    const priceInput = document.getElementById('productPrice');
    const price = getPriceValue(priceInput);
    if (!price || price <= 0) {
        Toast.error('가격을 입력해주세요.');
        return;
    }

    // 카테고리 검증
    const categoryInput = document.querySelector('input[name="category"]:checked');
    if (!categoryInput?.value) {
        Toast.error('카테고리를 선택해주세요.');
        return;
    }
    
    // 거래 위치 검증
    const locationInput = document.getElementById('productLocation');
    if (!locationInput?.value.trim()) {
        Toast.error('거래 위치를 입력해주세요.');
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
            new Modal({
                title: MODAL_MESSAGE.TITLE_LOGIN_REQUIRED,
                subtitle: MODAL_MESSAGE.SUBTITLE_LOGIN_REQUIRED,
                confirmText: '로그인하기',
                cancelText: '취소',
                onConfirm: () => navigateTo('/login')
            }).show();
            resetFormSubmitting();
            return;
        }
        
        const originalText = elements.submitBtn?.textContent || '';
        showButtonLoading(elements.submitBtn, '처리 중...');
        // 무한 지속 토스트 표시
        loadingToast = Toast.info(TOAST_MESSAGE.POST_CREATING, '처리 중', { duration: 0, showClose: false });
        
        const formData = postEditor.getFormData();
        const selectedImages = postEditor.getSelectedImages();
        
        // 1단계: 이미지 없이 상품 생성 (ID 확보)
        const productId = await createProductDraft(user, formData);
        
        // 2단계: 이미지가 있으면 업로드 후 상품 업데이트
        if (selectedImages.length > 0) {
            await uploadAndUpdateProduct(productId, formData, selectedImages);
        }
        
        showSuccess('상품이 등록되었습니다.');
    } catch (error) {
        resetFormSubmitting();
        showError(error.message || '상품 등록에 실패했습니다.');
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
            setTimeout(() => navigateTo('/marketplace-list'), 1000);
}

document.addEventListener('DOMContentLoaded', init);
// 뒤로가기 시 미저장 변경사항 확인
window.handleBackNavigation = () => handlePostEditorBackNavigation(postEditor);
