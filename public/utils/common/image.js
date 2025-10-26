/**
 * 이미지 처리 공통 유틸리티
 * 프로필 업로드, 게시글 이미지 업로드 등에서 공통으로 사용
 */
import { IMAGE_CONSTANTS } from '../constants.js';

/**
 * 이미지 파일들을 유효성 검사
 * @param {FileList} files - 검사할 파일들
 * @param {number} maxSize - 최대 파일 크기 (바이트)
 * @param {string[]} supportedTypes - 지원되는 파일 타입
 * @param {number} maxFiles - 최대 파일 개수
 * @returns {Object} { validFiles: File[], errors: string[] }
 */
export function validateImageFiles(files, maxSize = IMAGE_CONSTANTS.MAX_IMAGE_SIZE, supportedTypes = IMAGE_CONSTANTS.SUPPORTED_TYPES, maxFiles = IMAGE_CONSTANTS.MAX_IMAGES) {
    if (files.length === 0) return { validFiles: [], errors: [] };
    
    const validFiles = [];
    const errors = [];

    // 파일 개수 검사
    if (files.length > maxFiles) {
        errors.push(`최대 ${maxFiles}개의 이미지만 업로드 가능합니다.`);
        return { validFiles, errors };
    }

    // 각 파일 검사
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 파일 크기 검사
        if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            errors.push(`${file.name}: 파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
            continue;
        }

        // 파일 타입 검사
        if (!supportedTypes.includes(file.type)) {
            errors.push(`${file.name}: 이미지 파일만 업로드 가능합니다.`);
            continue;
        }

        validFiles.push(file);
    }

    return { validFiles, errors };
}

/**
 * 이미지 미리보기 URL 생성
 * @param {File[]} files - 이미지 파일들
 * @returns {Promise<{previews: Array<{file: File, url: string}>, errors: Array<{file: File, error: Error}>}>} 결과 객체
 */
export async function createImagePreviews(files) {
    const previews = [];
    const errors = [];
    
    const promises = files.map(async (file) => {
        try {
            const url = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = () => reject(new Error('이미지 읽기 실패'));
                reader.readAsDataURL(file);
            });
            return { file, url, success: true };
        } catch (error) {
            console.error('이미지 미리보기 생성 실패:', error);
            return { file, error, success: false };
        }
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
        if (result.success) {
            previews.push({ file: result.file, url: result.url });
        } else {
            errors.push({ file: result.file, error: result.error });
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
 * 이미지 업로드 이벤트 설정
 * @param {HTMLElement} container - 업로드 컨테이너
 * @param {HTMLElement} input - 파일 입력 요소
 * @param {Function} onFileSelect - 파일 선택 시 실행할 함수
 */
export function setupImageUploadEvents(container, input, onFileSelect) {
    // 기존 이벤트 리스너 제거 (중복 방지)
    container.removeEventListener('click', handleContainerClick);
    input.removeEventListener('change', handleFileChange);
    container.removeEventListener('dragover', handleDragOver);
    container.removeEventListener('dragleave', handleDragLeave);
    container.removeEventListener('drop', handleDrop);
    
    // 이벤트 핸들러 함수들
    function handleContainerClick() {
        input.click();
    }
    
    function handleFileChange(e) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            onFileSelect(files);
        }
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        container.classList.add('dragover');
    }
    
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        container.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        onFileSelect(files);
    }
    
    // 이벤트 리스너 추가
    container.addEventListener('click', handleContainerClick);
    input.addEventListener('change', handleFileChange);
    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('dragleave', handleDragLeave);
    container.addEventListener('drop', handleDrop);
}