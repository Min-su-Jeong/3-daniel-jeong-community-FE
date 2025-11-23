/**
 * 이미지 처리 공통 유틸리티
 * 파일 검증, 미리보기 생성, 프로필 이미지 렌더링 등 이미지 관련 로직 통합
 */
import { API_SERVER_URI } from '../constants/api.js';
import { IMAGE_CONSTANTS, S3_CONFIG } from '../constants/image.js';
import { uploadImage } from '../../api/images.js';
import { TOAST_MESSAGE } from '../constants/toast.js';

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_FALLBACK_TEXT = '👤';
const DEFAULT_ALT_TEXT = '프로필 이미지';

// 바이트를 MB 단위로 변환 (반올림)
const bytesToMB = (bytes) => Math.round(bytes / BYTES_PER_MB);

// 이미지 파일 유효성 검사 (크기/개수 제한, 하나라도 초과 시 전체 실패)
export function validateImageFiles(files, maxSize = IMAGE_CONSTANTS.MAX_IMAGE_SIZE, maxFiles = IMAGE_CONSTANTS.MAX_IMAGES) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) {
        return { validFiles: [], errors: [] };
    }

    if (fileArray.length > maxFiles) {
        return {
            validFiles: [],
            errors: [`최대 ${maxFiles}개의 이미지만 업로드 가능합니다.`]
        };
    }

    const maxSizeMB = bytesToMB(maxSize);
    const validFiles = [];

    for (const file of fileArray) {
        if (file.size > maxSize) {
            return {
                validFiles: [],
                errors: [`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`]
            };
        }
        validFiles.push(file);
    }

    return { validFiles, errors: [] };
}

// 파일을 Data URL(base64)로 변환 (미리보기용)
const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('이미지 읽기 실패'));
        reader.readAsDataURL(file);
    });
};

// 이미지 파일들을 Data URL로 변환하여 미리보기 생성 (실패한 파일도 포함)
export async function createImagePreviews(files) {
    if (!files || files.length === 0) {
        return { previews: [], errors: [] };
    }

    const results = await Promise.allSettled(
        files.map(async (file) => ({
            file,
            url: await fileToDataURL(file)
        }))
    );

    const previews = [];
    const errors = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            previews.push(result.value);
        } else {
            errors.push({
                file: files[index],
                error: result.reason
            });
        }
    });

    return { previews, errors };
}

// 이미지 갤러리 개수 표시 업데이트
export function updateImageGalleryCount(galleryCount, images) {
    if (galleryCount) {
        galleryCount.textContent = `${images.length}개`;
    }
}

// 드래그 앤 드롭 이벤트 기본 동작 차단 (파일 열기 방지)
const preventDefaultDragEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

// 이미지 업로드 이벤트 핸들러 생성 (클릭/드래그앤드롭/파일선택)
const createImageUploadHandlers = (container, input, onFileSelect) => {
    const handleContainerClick = () => input.click();

    const handleFileSelect = (files) => {
        if (files.length > 0) {
            onFileSelect(files);
        }
    };

    const handleFileChange = (event) => {
        handleFileSelect(Array.from(event.target.files));
    };

    const handleDragOver = (event) => {
        preventDefaultDragEvent(event);
        container.classList.add('dragover');
    };

    const handleDragLeave = (event) => {
        preventDefaultDragEvent(event);
        container.classList.remove('dragover');
    };

    const handleDrop = (event) => {
        preventDefaultDragEvent(event);
        container.classList.remove('dragover');
        handleFileSelect(Array.from(event.dataTransfer.files));
    };

    return {
        handleContainerClick,
        handleFileChange,
        handleDragOver,
        handleDragLeave,
        handleDrop
    };
};

// 이미지 업로드 이벤트 리스너 일괄 등록/해제
const manageImageUploadHandlers = (container, input, handlers, isRemove = false) => {
    if (!handlers) return;

    const eventMap = [
        { element: container, type: 'click', handler: handlers.handleContainerClick },
        { element: input, type: 'change', handler: handlers.handleFileChange },
        { element: container, type: 'dragover', handler: handlers.handleDragOver },
        { element: container, type: 'dragleave', handler: handlers.handleDragLeave },
        { element: container, type: 'drop', handler: handlers.handleDrop }
    ];

    eventMap.forEach(({ element, type, handler }) => {
        if (isRemove) {
            element.removeEventListener(type, handler);
        } else {
            element.addEventListener(type, handler);
        }
    });
};

// 이미지 업로드 이벤트 설정 (기존 핸들러 제거 후 새로 등록)
export function setupImageUploadEvents(container, input, onFileSelect) {
    if (!container || !input || typeof onFileSelect !== 'function') {
        return;
    }

    const existingHandlers = container.imageUploadHandlers;
    manageImageUploadHandlers(container, input, existingHandlers, true);

    const handlers = createImageUploadHandlers(container, input, onFileSelect);
    container.imageUploadHandlers = handlers;

    manageImageUploadHandlers(container, input, handlers, false);
}

// 작성자 객체에서 프로필 이미지 키 추출 (다양한 필드명 지원)
export function extractProfileImageKey(author) {
    if (!author) {
        return null;
    }
    return author.image?.objectKey || author.profileImageKey || null;
}

// 프로필 이미지 S3 Public URL 생성
const createProfileImageUrl = (imageKey) => {
    if (!imageKey) return null;
    return S3_CONFIG.getPublicUrl(imageKey);
};

// 프로필 이미지 img 요소 생성 (로드 실패 시 fallback 텍스트 표시)
const createImageElement = (imageKey, altText, fallbackText, container) => {
    const image = document.createElement('img');
    image.src = createProfileImageUrl(imageKey);
    image.alt = altText;
    image.loading = 'lazy';
    image.onerror = () => {
        container.textContent = fallbackText;
    };
    return image;
};

// 프로필 이미지 재렌더링 필요 여부 판단
const shouldRerenderImage = (container, imageKey, fallbackText) => {
    const existingImage = container.querySelector('img');
    const currentImageUrl = existingImage?.src;
    const expectedImageUrl = imageKey ? createProfileImageUrl(imageKey) : null;

    // 이미지 키가 있고 URL이 같으면 재렌더링 불필요
    if (imageKey && currentImageUrl === expectedImageUrl) {
        return false;
    }

    // 이미지 키가 null이고 이미지 요소가 없고 텍스트가 이미 fallback이면 재렌더링 불필요
    if (!imageKey && !existingImage && container.textContent === fallbackText) {
        return false;
    }

    // 이미지가 삭제된 경우 (imageKey가 null이고 기존 이미지가 있음) 항상 재렌더링
    if (!imageKey && existingImage) {
        return true;
    }

    return true;
};

// 프로필 이미지 렌더링 (이미지 키 있으면 img, 없으면 fallback 텍스트)
export function renderProfileImage(container, imageKey, fallbackText = DEFAULT_FALLBACK_TEXT, altText = DEFAULT_ALT_TEXT) {
    if (!container) {
        return;
    }

    if (!shouldRerenderImage(container, imageKey, fallbackText)) {
        return;
    }

    // 기존 내용 제거
    const existingImage = container.querySelector('img');
    if (existingImage) {
        existingImage.src = '';
        existingImage.onload = null;
        existingImage.onerror = null;
    }
    
    container.replaceChildren();

    if (imageKey) {
        const image = createImageElement(imageKey, altText, fallbackText, container);
        container.appendChild(image);
    } else {
        // 이미지가 삭제된 경우 명시적으로 기본 프로필 표시
        container.textContent = fallbackText;
    }
}

// 프로필 이미지 placeholder 생성 (+ 아이콘 표시)
export function createProfilePlaceholder(container) {
    if (!container) return;
    
    container.replaceChildren();
    
    const plusIcon = document.createElement('span');
    plusIcon.className = 'plus-icon';
    plusIcon.textContent = '+';
    container.appendChild(plusIcon);
}

// 프로필 이미지 미리보기 설정 (파일 선택/삭제 이벤트 처리)
export function setupProfileImagePreview({ imageContainer, imageInput, removeButton, onChange, onRemove }) {
    if (!imageContainer || !imageInput) return;

    imageInput.accept = IMAGE_CONSTANTS.ACCEPT;
    
    // 컨테이너 클릭 시 파일 선택
    imageContainer.addEventListener('click', () => {
        imageInput.click();
    });

    // 삭제 버튼 클릭 이벤트
    if (removeButton) {
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onRemove) {
                onRemove();
            } else {
                createProfilePlaceholder(imageContainer);
                removeButton.classList.remove('visible');
                imageInput.value = '';
            }
        });
    }

    // 파일 선택 이벤트
    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const { validFiles, errors } = validateImageFiles([file], IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 1);
        
        if (errors.length > 0) {
            imageInput.value = '';
            return;
        }

        if (validFiles.length === 0) return;

        try {
            const { previews, errors: previewErrors } = await createImagePreviews(validFiles);
            
            if (previewErrors.length > 0 || previews.length === 0) {
                imageInput.value = '';
                return;
            }

            const preview = previews[0];
            imageContainer.replaceChildren();
            
            const img = document.createElement('img');
            img.src = preview.url;
            img.alt = '프로필 이미지';
            imageContainer.appendChild(img);
            
            if (removeButton) {
                removeButton.classList.add('visible');
            }
            
            if (onChange) {
                onChange(preview.url);
            }
        } catch (error) {
            imageInput.value = '';
        }
    });
}

// 여러 이미지 파일 업로드
// 순차적으로 업로드하여 서버 부하를 줄이고, 하나라도 실패하면 전체 실패 처리
export async function uploadImages(imageFiles, resourceId, imageType = 'POST') {
    const uploadedKeys = [];
    
    for (const imageData of imageFiles) {
        try {
            const response = await uploadImage(imageType, resourceId, imageData.file);
            
            if (response && response.objectKey) {
                uploadedKeys.push(response.objectKey);
            } else {
                throw new Error(TOAST_MESSAGE.IMAGE_UPLOAD_FAILED);
            }
        } catch (error) {
            throw new Error(`${TOAST_MESSAGE.IMAGE_UPLOAD_FAILED}: ${error.message}`);
        }
    }
    
    return uploadedKeys;
}