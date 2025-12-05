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
import { getProductById, updateProduct } from '../../utils/api/marketplace.js';

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
let productId = null;

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

    setupLocationCharCounter();
    setupPriceFormatter();

    await loadProductData();
}

// 거래 위치 글자수 제한
function setupLocationCharCounter() {
    const locationInput = elements.productLocation;
    const locationCounter = elements.locationCharCount;
    
    if (!locationInput || !locationCounter) return;

    locationCounter.textContent = locationInput.value.length;
    const charCounterParent = locationCounter.parentElement;

    locationInput.addEventListener('input', () => {
        // 최대 26자 제한
        if (locationInput.value.length > 26) {
            locationInput.value = locationInput.value.substring(0, 26);
        }
        
        const count = locationInput.value.length;
        locationCounter.textContent = count;
        // 24자 이상일 때 경고 표시
        charCounterParent?.classList.toggle('warning', count >= 24);
    });
}

// 가격 입력 포맷팅 (숫자 8자리 제한 + 쉼표 단위 구분)
function setupPriceFormatter() {
    const priceInput = document.getElementById('productPrice');
    if (!priceInput) return;

    priceInput.addEventListener('input', (e) => {
        // 숫자만 추출
        let digits = e.target.value.replace(/[^0-9]/g, '');

        if (!digits) {
            if (e.target.value !== '') e.target.value = '';
            return;
        }

        // 최대 8자리까지만 허용
        if (digits.length > 8) {
            digits = digits.slice(0, 8);
        }

        // 숫자 값으로 변환
        const numeric = Number(digits);
        if (Number.isNaN(numeric)) {
            e.target.value = '';
            return;
        }

        // 천 단위 콤마 포맷팅
        const formatted = numeric.toLocaleString('ko-KR');
        // 무한 루프 방지: 포맷된 값과 다를 때만 업데이트
        if (e.target.value !== formatted) {
            e.target.value = formatted;
        }
    });
}

// 가격 값 추출 (콤마 제거 후 숫자로 변환)
function getPriceValue(priceInput) {
    if (!priceInput || !priceInput.value) return null;
    const numeric = priceInput.value.replace(/[^0-9]/g, '');
    return numeric ? Number(numeric) : null;
}

// 세션 스토리지 데이터 파싱 (뒤로가기 후 재진입 시 사용)
function parseSessionData(sessionData) {
    try {
        return JSON.parse(sessionData);
    } catch {
        return null;
    }
}

// 상품 데이터 로드
async function loadProductData() {
    try {
        productId = getUrlParam('id');
        
        if (!productId) {
            Toast.error('상품 ID가 필요합니다.');
            navigateTo('/marketplace');
            return;
        }
        
        // 세션 스토리지에서 데이터 확인 (뒤로가기 후 재진입 시 사용)
        const sessionData = sessionStorage.getItem('editProductData');
        let productData = sessionData ? parseSessionData(sessionData) : null;
        
        // 사용 후 세션 스토리지에서 제거
        if (sessionData) {
            sessionStorage.removeItem('editProductData');
        }
        
        // 세션 데이터가 없으면 API로 조회
        if (!productData) {
            productData = await fetchProductData(productId);
            
            if (!productData) {
                Toast.error('상품을 찾을 수 없습니다.');
                navigateTo('/marketplace');
                return;
            }
        }
        
        // PostEditor에 제목과 내용 설정
        postEditor.setFormData({
            title: productData.title || '',
            content: productData.content || ''
        });
        
        const priceInput = document.getElementById('productPrice');
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        const statusRadios = document.querySelectorAll('input[name="status"]');
        const locationInput = document.getElementById('productLocation');
        
        // 가격 포맷팅하여 표시
        if (priceInput && productData.price) {
            priceInput.value = productData.price.toLocaleString('ko-KR');
        }
        // 카테고리 라디오 버튼 선택
        if (productData.category && categoryRadios.length > 0) {
            categoryRadios.forEach((radio) => {
                radio.checked = radio.value === productData.category;
            });
        }
        if (locationInput && productData.location) {
            locationInput.value = productData.location;
        }
        // 상품 상태 라디오 버튼 선택
        if (productData.status && statusRadios.length > 0) {
            statusRadios.forEach((radio) => {
                radio.checked = radio.value === productData.status;
            });
        }
        
        // 위치 글자수 카운터 초기화
        if (locationInput && elements.locationCharCount) {
            elements.locationCharCount.textContent = locationInput.value.length;
        }
        
        // 기존 이미지 로드
        if (productData.imageObjectKeys?.length) {
            postEditor.loadExistingImages(productData.imageObjectKeys);
        }
    } catch (error) {
        Toast.error('상품 데이터를 불러오는데 실패했습니다.');
    }
}

// 상품 데이터 조회
async function fetchProductData(productId) {
    try {
        const response = await getProductById(productId);
        
        if (!response.success) {
            throw new Error(response.message || '상품 데이터를 불러오는데 실패했습니다.');
        }
        
        return response.data;
    } catch (error) {
        throw new Error(error.message || '상품 데이터를 불러오는데 실패했습니다.');
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
        const uploadedKeys = await uploadImages(newImageFiles, productId, 'PRODUCT');
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

// 상품 수정 처리
async function handlePostUpdate() {
    // 중복 제출 방지
    if (isPostSubmitted) return;
    
    // 폼 유효성 검사
    if (!postEditor.validateForm()) {
        Toast.error(VALIDATION_MESSAGE.ALL_FIELDS_REQUIRED);
        return;
    }
    
    // 가격 검증
    const priceInput = document.getElementById('productPrice');
    const price = getPriceValue(priceInput);
    if (!price || price <= 0) {
        Toast.error('가격을 입력해주세요.');
        return;
    }
    
    // 거래 위치 검증
    const locationInput = document.getElementById('productLocation');
    if (!locationInput?.value.trim()) {
        Toast.error('거래 위치를 입력해주세요.');
        return;
    }

    // 카테고리 검증
    const categoryInput = document.querySelector('input[name="category"]:checked');
    if (!categoryInput?.value) {
        Toast.error('카테고리를 선택해주세요.');
        return;
    }

    // 상품 상태 검증
    const statusInput = document.querySelector('input[name="status"]:checked');
    if (!statusInput?.value) {
        Toast.error('상품 상태를 선택해주세요.');
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
        
        const result = await updateProduct(productId, {
            title: formData.title,
            content: formData.content,
            price: price,
            category: categoryInput.value,
            location: locationInput.value.trim(),
            status: statusInput.value,
            imageObjectKeys
        });
        
        if (!result.success) {
            throw new Error(result.message || '상품 수정에 실패했습니다.');
        }
        
        Toast.success('상품이 수정되었습니다.');
        // 성공 후 상세 페이지로 이동 (히스토리 교체하여 뒤로가기 방지)
        setTimeout(() => {
            window.history.replaceState(null, '', '/marketplace');
            navigateTo(`/marketplace-detail?id=${productId}`);
        }, 1200);
    } catch (error) {
        Toast.error(error.message || '상품 수정에 실패했습니다.');
    } finally {
        setFormSubmitting(false);
    }
}

document.addEventListener('DOMContentLoaded', init);
// 뒤로가기 시 미저장 변경사항 확인
window.handleBackNavigation = () => handlePostEditorBackNavigation(postEditor);
