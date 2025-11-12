// 프로필 이미지 관리 공통 유틸리티
// 회원가입/회원정보수정 페이지에서 공통으로 사용하는 프로필 이미지 관련 로직

import { 
    validateImageFiles, 
    setupProfileImagePreview, 
    createProfilePlaceholder 
} from './image.js';
import { IMAGE_CONSTANTS } from '../constants/api.js';
import { TOAST_MESSAGE } from '../constants/toast.js';
import { ToastUtils } from '../../components/index.js';

// 프로필 이미지 설정 (미리보기, 삭제 버튼 처리)
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
        errors.forEach(error => ToastUtils.error(error));
        return false;
    }
    
    if (validFiles.length === 0) {
        ToastUtils.error(TOAST_MESSAGE.IMAGE_INVALID);
        return false;
    }
    
    return true;
}

