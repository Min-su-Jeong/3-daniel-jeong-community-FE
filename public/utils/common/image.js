/**
 * 이미지 처리 공통 유틸리티
 * 프로필 업로드, 게시글 이미지 업로드 등에서 공통으로 사용
 */
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../constants.js';

const BYTES_PER_MB = 1024 * 1024;
const DEFAULT_FALLBACK_TEXT = '👤';
const DEFAULT_ALT_TEXT = '프로필 이미지';

/**
 * 바이트를 MB로 변환
 * @param {number} bytes - 바이트
 * @returns {number} MB
 */
const bytesToMB = (bytes) => Math.round(bytes / BYTES_PER_MB);

/**
 * 이미지 파일들을 유효성 검사
 * @param {FileList|File[]} files - 검사할 파일들
 * @param {number} maxSize - 최대 파일 크기 (바이트)
 * @param {number} maxFiles - 최대 파일 개수
 * @returns {Object} { validFiles: File[], errors: string[] }
 */
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

/**
 * 파일을 Data URL로 변환
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} Data URL
 */
const fileToDataURL = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = () => reject(new Error('이미지 읽기 실패'));
        reader.readAsDataURL(file);
    });
};

/**
 * 이미지 미리보기 URL 생성
 * @param {File[]} files - 이미지 파일들
 * @returns {Promise<{previews: Array<{file: File, url: string}>, errors: Array<{file: File, error: Error}>}>} 결과 객체
 */
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

/**
 * 이미지 갤러리 데이터 업데이트
 * @param {HTMLElement} galleryCount - 갤러리 카운트 요소
 * @param {Array} images - 이미지 배열
 */
export function updateImageGalleryCount(galleryCount, images) {
    if (galleryCount) {
        galleryCount.textContent = `${images.length}개`;
    }
}

/**
 * 드래그 앤 드롭 이벤트 기본 동작 방지
 * @param {Event} event - 이벤트 객체
 */
const preventDefaultDragEvent = (event) => {
    event.preventDefault();
    event.stopPropagation();
};

/**
 * 이미지 업로드 이벤트 핸들러 생성
 * @param {HTMLElement} container - 업로드 컨테이너
 * @param {HTMLElement} input - 파일 입력 요소
 * @param {Function} onFileSelect - 파일 선택 시 실행할 함수
 * @returns {Object} 이벤트 핸들러 객체
 */
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

/**
 * 이벤트 리스너 관리 (제거/추가)
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {HTMLElement} input - 입력 요소
 * @param {Object} handlers - 핸들러 객체
 * @param {boolean} isRemove - 제거 여부
 */
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

/**
 * 이미지 업로드 이벤트 설정
 * @param {HTMLElement} container - 업로드 컨테이너
 * @param {HTMLElement} input - 파일 입력 요소
 * @param {Function} onFileSelect - 파일 선택 시 실행할 함수
 */
export function setupImageUploadEvents(container, input, onFileSelect) {
    if (!container || !input || typeof onFileSelect !== 'function') {
        return;
    }

    const existingHandlers = container._imageUploadHandlers;
    manageImageUploadHandlers(container, input, existingHandlers, true);

    const handlers = createImageUploadHandlers(container, input, onFileSelect);
    container._imageUploadHandlers = handlers;

    manageImageUploadHandlers(container, input, handlers, false);
}

/**
 * 프로필 이미지 키 추출
 * @param {Object} author - 작성자 객체 (author.image?.objectKey 또는 author.profileImageKey 포함 가능)
 * @returns {string|null} 프로필 이미지 키 또는 null
 */
export function extractProfileImageKey(author) {
    if (!author) {
        return null;
    }
    return author.image?.objectKey || author.profileImageKey || null;
}

/**
 * 프로필 이미지 URL 생성
 * @param {string} imageKey - 이미지 키
 * @returns {string} 이미지 URL
 */
const createProfileImageUrl = (imageKey) => `${API_SERVER_URI}/files/${imageKey}`;

/**
 * 이미지 요소 생성
 * @param {string} imageKey - 이미지 키
 * @param {string} altText - alt 텍스트
 * @param {string} fallbackText - fallback 텍스트
 * @param {HTMLElement} container - 컨테이너 요소
 * @returns {HTMLImageElement} 이미지 요소
 */
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

/**
 * 이미지 재렌더링 필요 여부 확인
 * @param {HTMLElement} container - 컨테이너 요소
 * @param {string|null} imageKey - 이미지 키
 * @param {string} fallbackText - fallback 텍스트
 * @returns {boolean} 재렌더링 필요 여부
 */
const shouldRerenderImage = (container, imageKey, fallbackText) => {
    const existingImage = container.querySelector('img');
    const currentImageUrl = existingImage?.src;
    const expectedImageUrl = imageKey ? createProfileImageUrl(imageKey) : null;

    if (imageKey && currentImageUrl === expectedImageUrl) {
        return false;
    }

    if (!imageKey && !existingImage && container.textContent === fallbackText) {
        return false;
    }

    return true;
};

/**
 * 프로필 이미지 렌더링
 * @param {HTMLElement} container - 이미지를 표시할 컨테이너 요소
 * @param {string|null} imageKey - 프로필 이미지 키
 * @param {string} fallbackText - 이미지가 없을 때 표시할 텍스트 (기본값: '👤')
 * @param {string} altText - 이미지 alt 텍스트 (기본값: '프로필 이미지')
 */
export function renderProfileImage(container, imageKey, fallbackText = DEFAULT_FALLBACK_TEXT, altText = DEFAULT_ALT_TEXT) {
    if (!container) {
        return;
    }

    if (!shouldRerenderImage(container, imageKey, fallbackText)) {
        return;
    }

    container.innerHTML = '';

    if (imageKey) {
        const image = createImageElement(imageKey, altText, fallbackText, container);
        container.appendChild(image);
    } else {
        container.textContent = fallbackText;
    }
}