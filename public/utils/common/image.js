/**
 * 이미지 처리 공통 유틸리티
 * - 업로드 전 파일 검증 및 미리보기
 * - 드래그 앤 드롭/파일 입력 이벤트 바인딩
 * - 프로필 이미지 렌더링 및 S3 public URL 연동
 * - 다중 이미지 업로드 헬퍼
 * - 프로필 이미지 설정 및 검증
 */
import { IMAGE_CONSTANTS, S3_CONFIG } from '../constants/image.js';
import { uploadImage } from '../api/images.js';
import { TOAST_MESSAGE } from '../constants/toast.js';
import { Toast } from '../../components/toast/toast.js';

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_FALLBACK_TEXT = '👤';
const DEFAULT_ALT_TEXT = '프로필 이미지';

// 바이트를 MB 단위로 변환
const bytesToMB = (bytes) => Math.round(bytes / BYTES_PER_MB);

// 허용된 이미지 타입 목록 추출
const getAllowedTypes = () => IMAGE_CONSTANTS.ACCEPT.split(',').map(type => type.trim());

// 허용된 확장자 목록 추출
const getAllowedExtensions = () => {
    return getAllowedTypes()
        .map(type => type.replace('image/', ''))
        .filter(ext => ext);
};

// 파일 확장자 추출 (마지막 점 이후 문자열)
const getFileExtension = (fileName) => {
    if (!fileName) return '';
    const lastDot = fileName.toLowerCase().lastIndexOf('.');
    return lastDot > 0 ? fileName.slice(lastDot + 1) : '';
};

// 파일 타입 검증 (MIME 타입 또는 확장자로 확인)
const isValidImageType = (file, allowedTypes, allowedExtensionsSet) => {
    const fileType = file.type?.toLowerCase();
    // MIME 타입으로 확인
    if (fileType && allowedTypes.includes(fileType)) {
        return true;
    }
    
    // 확장자로 확인 (MIME 타입이 없는 경우 대비)
    const fileExtension = getFileExtension(file.name);
    return fileExtension && allowedExtensionsSet.has(fileExtension);
};

// 이미지 파일 유효성 검사
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
    const allowedTypes = getAllowedTypes();
    const allowedExtensions = getAllowedExtensions();
    const allowedExtensionsSet = new Set(allowedExtensions);
    const allowedExtensionsStr = allowedExtensions.join(', ');
    const validFiles = [];

    for (const file of fileArray) {
        // 파일 타입 검증 (하나라도 실패하면 전체 실패)
        if (!isValidImageType(file, allowedTypes, allowedExtensionsSet)) {
            return {
                validFiles: [],
                errors: [`지원하지 않는 이미지 형식입니다. (${allowedExtensionsStr}만 가능)`]
            };
        }
        
        // 파일 크기 검증 (하나라도 초과하면 전체 실패)
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

// 파일을 Data URL로 변환
const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('이미지 읽기 실패'));
        reader.readAsDataURL(file);
    });
};

// 이미지 미리보기 생성 (Data URL로 변환)
export async function createImagePreviews(files) {
    if (!files || files.length === 0) {
        return { previews: [], errors: [] };
    }

    // 모든 파일을 병렬로 처리 (일부 실패해도 계속 진행)
    const results = await Promise.allSettled(
        files.map(file => fileToDataURL(file))
    );

    const previews = [];
    const errors = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            previews.push({ file: files[index], url: result.value });
        } else {
            errors.push(result.reason?.message || '이미지 읽기 실패');
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

// 드래그 앤 드롭 이벤트 기본 동작 차단
const preventDefaultDragEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

// 이미지 업로드 이벤트 핸들러 생성
const createImageUploadHandlers = (container, input, onFileSelect) => {
    const handleFileSelect = (files) => {
        if (files.length > 0) {
            onFileSelect(files);
        }
    };

    return {
        handleContainerClick: () => input.click(),
        handleFileChange: (event) => handleFileSelect(Array.from(event.target.files)),
        handleDragOver: (event) => {
            preventDefaultDragEvent(event);
            container.classList.add('dragover');
        },
        handleDragLeave: (event) => {
            preventDefaultDragEvent(event);
            container.classList.remove('dragover');
        },
        handleDrop: (event) => {
            preventDefaultDragEvent(event);
            container.classList.remove('dragover');
            handleFileSelect(Array.from(event.dataTransfer.files));
        }
    };
};

// 이미지 업로드 이벤트 리스너 관리
const manageImageUploadHandlers = (container, input, handlers, isRemove = false) => {
    if (!handlers) return;

    if (isRemove) {
        container.removeEventListener('click', handlers.handleContainerClick);
        input.removeEventListener('change', handlers.handleFileChange);
        container.removeEventListener('dragover', handlers.handleDragOver);
        container.removeEventListener('dragleave', handlers.handleDragLeave);
        container.removeEventListener('drop', handlers.handleDrop);
    } else {
        container.addEventListener('click', handlers.handleContainerClick);
        input.addEventListener('change', handlers.handleFileChange);
        container.addEventListener('dragover', handlers.handleDragOver);
        container.addEventListener('dragleave', handlers.handleDragLeave);
        container.addEventListener('drop', handlers.handleDrop);
    }
};

// 이미지 업로드 이벤트 설정
export function setupImageUploadEvents(container, input, onFileSelect) {
    if (!container || !input || typeof onFileSelect !== 'function') {
        return;
    }

    const existingHandlers = container.imageUploadHandlers;
    if (existingHandlers) {
        manageImageUploadHandlers(container, input, existingHandlers, true);
    }

    const handlers = createImageUploadHandlers(container, input, onFileSelect);
    container.imageUploadHandlers = handlers;
    manageImageUploadHandlers(container, input, handlers, false);
}

// 프로필 이미지 키 추출
export function extractProfileImageKey(author) {
    if (!author) return null;
    return author.image?.objectKey || author.profileImageKey || null;
}

// 프로필 이미지 S3 Public URL 생성
const createProfileImageUrl = async (imageKey) => {
    if (!imageKey) return null;
    return await S3_CONFIG.getPublicUrl(imageKey);
};

// 프로필 이미지 img 요소 생성
const createImageElement = async (imageKey, altText, fallbackText, container) => {
    const image = document.createElement('img');
    const url = await createProfileImageUrl(imageKey);
    
    if (url) {
        image.src = url;
    }
    
    image.alt = altText;
    image.loading = 'lazy';
    image.onerror = () => {
        container.textContent = fallbackText;
    };
    
    // 현재 이미지 키 저장
    image.dataset.imageKey = imageKey || '';
    return image;
};

// 프로필 이미지 렌더링
export async function renderProfileImage(
    container,
    imageKey,
    fallbackText = DEFAULT_FALLBACK_TEXT,
    altText = DEFAULT_ALT_TEXT
) {
    if (!container) {
        return;
    }

    const normalizedKey = imageKey || '';
    const existingImage = container.querySelector('img');
    const currentKey = existingImage?.dataset?.imageKey || '';

    if (existingImage && normalizedKey === currentKey) {
        return;
    }

    container.replaceChildren();

    if (imageKey) {
        const image = await createImageElement(imageKey, altText, fallbackText, container);
        container.appendChild(image);
    } else {
        container.textContent = fallbackText;
    }
}

// 프로필 이미지 placeholder 생성
export function createProfilePlaceholder(container) {
    if (!container) return;
    container.replaceChildren();
}

// 파일 선택 에러 처리
const handleFileSelectionError = (errors, imageInput) => {
    errors.forEach(error => {
        const message = typeof error === 'string' ? error : error.message || TOAST_MESSAGE.IMAGE_INVALID;
        Toast.error(message);
    });
    imageInput.value = '';
};

// 프로필 이미지 미리보기
export function setupProfileImagePreview({ imageContainer, imageInput, removeButton, onChange, onRemove }) {
    if (!imageContainer || !imageInput) return;

    imageInput.accept = IMAGE_CONSTANTS.ACCEPT;
    
    imageContainer.addEventListener('click', () => imageInput.click());

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

    imageInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const { validFiles, errors } = validateImageFiles([file], IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 1);
        
        if (errors.length > 0) {
            handleFileSelectionError(errors, imageInput);
            return;
        }

        if (validFiles.length === 0) return;

        try {
            const { previews, errors: previewErrors } = await createImagePreviews(validFiles);
            
            if (previewErrors.length > 0) {
                handleFileSelectionError(previewErrors, imageInput);
                return;
            }
            
            if (previews.length === 0) {
                Toast.error(TOAST_MESSAGE.IMAGE_INVALID);
                imageInput.value = '';
                return;
            }

            const preview = previews[0];
            imageContainer.replaceChildren();
            
            const img = document.createElement('img');
            img.src = preview.url;
            img.alt = DEFAULT_ALT_TEXT;
            imageContainer.appendChild(img);
            
            if (removeButton) {
                removeButton.classList.add('visible');
            }
            
            if (onChange) {
                onChange(preview.url);
            }
        } catch (error) {
            Toast.error(TOAST_MESSAGE.IMAGE_INVALID);
            imageInput.value = '';
        }
    });
}

// 프로필 이미지 설정
export function setupProfileImage({ 
    imageContainer, 
    imageInput, 
    removeButton, 
    onRemove, 
    onChange,
    onImageChange 
}) {
    if (!imageContainer || !imageInput) return;

    const handleRemove = () => {
        createProfilePlaceholder(imageContainer);
        if (removeButton) {
            removeButton.classList.remove('visible');
        }
        imageInput.value = '';
        if (onRemove) {
            onRemove();
        }
    };

    setupProfileImagePreview({
        imageContainer,
        imageInput,
        removeButton,
        onRemove: handleRemove,
        onChange: (previewUrl) => {
            if (onChange) {
                onChange(previewUrl);
            }
            if (onImageChange) {
                onImageChange();
            }
        }
    });
}

// 프로필 이미지 유효성 검사 (크기/형식 검증)
export function validateProfileImage(profileImage) {
    if (!profileImage) return true;
    
    const { validFiles, errors } = validateImageFiles(
        [profileImage], 
        IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
        1
    );
    
    if (errors.length > 0) {
        errors.forEach(error => Toast.error(error));
        return false;
    }
    
    if (validFiles.length === 0) {
        Toast.error(TOAST_MESSAGE.IMAGE_INVALID);
        return false;
    }
    
    return true;
}

export async function uploadImages(imageFiles, resourceId, imageType = 'POST') {
    const uploadedKeys = [];
    
    for (const imageData of imageFiles) {
        // 기존 이미지인 경우 objectKey 사용
        if (imageData.isExisting && imageData.objectKey) {
            uploadedKeys.push(imageData.objectKey);
            continue;
        }

        // 새로 업로드할 파일
        const file = imageData?.file || imageData;
        if (!file) continue;

        try {
            const response = await uploadImage(imageType, resourceId, file);
            
            if (response?.objectKey) {
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

// 페이지의 모든 이미지 경로를 S3 URL로 변환
export function convertPageImagesToS3() {
    const dataPathImages = document.querySelectorAll('img[data-path]');
    dataPathImages.forEach(img => {
        const path = img.getAttribute('data-path');
        if (path) {
            img.src = S3_CONFIG.getImageUrl(path);
        }
    });
}
