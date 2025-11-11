import { PageLayout, Button, ToastUtils, Modal, createFormHandler } from '../../components/index.js';
import { 
    validateNickname, 
    setupFormValidation, 
    getElementValue, 
    setElementValue, 
    initializeElements, 
    navigateTo, 
    validateImageFiles, 
    createImagePreviews, 
    renderProfileImage as renderProfileImageUtil,
    createProfilePlaceholder,
    getUserFromStorage, 
    saveUserToStorage, 
    dispatchUserUpdatedEvent, 
    removeUserFromStorage,
    getSubmitButton
} from '../../utils/common/index.js';
import { IMAGE_CONSTANTS } from '../../utils/constants/api.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { updateUser, deleteUser, uploadImage, logout } from '../../api/index.js';

const elements = initializeElements({
        buttonGroup: 'buttonGroup',
        userEditForm: 'userEditForm',
        nickname: 'nickname',
        profileImage: 'profileImage',
        profileImageInput: 'profileImageInput',
        removeImageBtn: 'removeImageBtn',
        withdrawalLink: 'withdrawalLink'
});

let originalNickname = '';
let originalProfileImageKey = null;
let user = null;
let editButton = null;

// 프로필 이미지 렌더링 (유틸리티 함수 래퍼)
function renderProfileImage(container, imageKey) {
    if (!container) return;
    renderProfileImageUtil(container, imageKey);
}

function createUserEditButtons() {
    if (!elements.buttonGroup) return;
    
    Button.clearGroup(elements.buttonGroup);
    editButton = Button.create(elements.buttonGroup, {
        text: '수정하기',
        type: 'submit',
        variant: 'primary',
        size: 'medium',
        disabled: true
    });
}

/**
 * 닉네임 필드 헬퍼 텍스트 초기화 (기본 텍스트로 복원)
 */
function resetHelperText() {
    const helperText = elements.nickname?.nextElementSibling;
    if (!helperText?.classList.contains('helper-text')) return;
    
    elements.nickname.classList.remove('success', 'error', 'warning');
    helperText.classList.remove('success', 'error', 'warning');
    helperText.textContent = helperText.dataset.defaultText || '';
}

/**
 * 제출 버튼 활성화 상태 업데이트 (닉네임/이미지 변경 여부 확인)
 */
function updateSubmitButtonState() {
    if (!editButton) return;
    
    const currentNickname = getElementValue(elements.nickname, '').trim();
    const nicknameChanged = currentNickname !== originalNickname;
    const imageChanged = !!elements.profileImageInput?.files[0];
    const hasOriginalImage = !!originalProfileImageKey;
    const hasCurrentImage = !!elements.profileImage.querySelector('img');
    const imageRemoved = hasOriginalImage && !hasCurrentImage && !imageChanged;
    
    if (!nicknameChanged) {
        resetHelperText();
    }
    
    const nicknameValid = nicknameChanged ? validateNickname(currentNickname).isValid : true;
    const canSubmit = (nicknameChanged && nicknameValid) || imageChanged || imageRemoved;
    
    editButton.setDisabled(!canSubmit);
}

/**
 * 원본 프로필 이미지 복원 (변경 취소 시)
 */
function restoreOriginalImage() {
    while (elements.profileImage.firstChild) {
        elements.profileImage.removeChild(elements.profileImage.firstChild);
    }
    
    if (originalProfileImageKey) {
        renderProfileImage(elements.profileImage, originalProfileImageKey);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'block';
        }
    } else {
        createProfilePlaceholder(elements.profileImage);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'none';
        }
    }
    elements.profileImageInput.value = '';
    updateSubmitButtonState();
}

/**
 * 프로필 이미지 제거 (placeholder 표시)
 */
function removeProfileImage() {
    createProfilePlaceholder(elements.profileImage);
    if (elements.removeImageBtn) {
        elements.removeImageBtn.style.display = 'none';
    }
    elements.profileImageInput.value = '';
    updateSubmitButtonState();
}

/**
 * 프로필 이미지 변경 처리 (파일 선택, 검증, 미리보기)
 */
function setupProfileImageChange() {
    if (!elements.profileImageInput || !elements.profileImage) return;
    
    const handleImageChange = async (files) => {
        if (files.length === 0) {
            restoreOriginalImage();
            return;
        }
        
        const { validFiles, errors } = validateImageFiles(
            files, 
            IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
            1
        );
        
        if (errors.length > 0) {
            errors.forEach(error => ToastUtils.error(error));
            restoreOriginalImage();
            return;
        }
        
        try {
            const { previews, errors: previewErrors } = await createImagePreviews(validFiles);
            
            if (previewErrors.length > 0) {
                previewErrors.forEach(({ error }) => ToastUtils.error(error.message));
                restoreOriginalImage();
                return;
            }
            
            if (previews.length > 0) {
                while (elements.profileImage.firstChild) {
                    elements.profileImage.removeChild(elements.profileImage.firstChild);
                }
                
                const img = document.createElement('img');
                img.src = previews[0].url;
                img.alt = '프로필 이미지';
                elements.profileImage.appendChild(img);
                
                if (elements.removeImageBtn) {
                    elements.removeImageBtn.style.display = 'block';
                }
                
                updateSubmitButtonState();
            }
        } catch {
            ToastUtils.error(TOAST_MESSAGE.IMAGE_PROCESS_FAILED);
            restoreOriginalImage();
        }
    };

    elements.profileImageInput.accept = IMAGE_CONSTANTS.ACCEPT;
    elements.profileImage.addEventListener('click', () => {
        elements.profileImageInput.click();
    });

    if (elements.removeImageBtn) {
        elements.removeImageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeProfileImage();
        });
    }

    elements.profileImageInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        await handleImageChange(files);
    });
}

/**
 * 폼 필드 유효성 검사 설정 (닉네임 실시간 검증)
 */
function setupFormFields() {
    setupFormValidation('userEditForm', [
        {
            id: 'nickname',
            validation: validateNickname,
            options: {
                successMessage: VALIDATION_MESSAGE.NICKNAME_AVAILABLE,
                defaultText: '',
                minLength: 2,
                maxLength: 10
            }
        }
    ]);
    
    elements.nickname?.addEventListener('input', updateSubmitButtonState);
}

// 회원 탈퇴 처리 (API 호출, 로그아웃, 저장소 정리, 홈으로 이동)
async function removeUser(userId) {
    try {
        await deleteUser(userId);
        await logout();
        
        removeUserFromStorage();
        dispatchUserUpdatedEvent();
        
        ToastUtils.success(TOAST_MESSAGE.USER_DELETE_SUCCESS);
        setTimeout(() => navigateTo('/'), 1200);
    } catch (error) {
        ToastUtils.error(error.message || TOAST_MESSAGE.USER_DELETE_FAILED);
    }
}

/**
 * 회원 탈퇴 링크 이벤트 설정 (확인 모달 2단계)
 */
function setupWithdrawal() {
    if (!elements.withdrawalLink) return;

    elements.withdrawalLink.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (!user) {
            ToastUtils.error(TOAST_MESSAGE.USER_LOAD_FAILED);
            return;
        }
        
        const firstModal = new Modal({
            title: MODAL_MESSAGE.TITLE_DELETE,
            subtitle: MODAL_MESSAGE.SUBTITLE_USER_DELETE,
            content: `<strong>⚠️ 회원 탈퇴 시 다음 사항을 확인해주세요:</strong><hr><br>
                    • 탈퇴 신청 후 <strong>30일간 유예 기간</strong>이 제공됩니다.<br>
                    • 30일 이내 재로그인 시 <strong>계정 복구</strong>가 가능합니다.<br>
                    • 30일 경과 후에는 <strong>영구적으로 삭제</strong>되어 복구할 수 없습니다.`,
            confirmText: '탈퇴 신청',
            confirmType: 'danger',
            showCancel: true,
            cancelText: '취소',
            onConfirm: () => {
                const finalModal = new Modal({
                    title: MODAL_MESSAGE.TITLE_DELETE,
                    subtitle: MODAL_MESSAGE.SUBTITLE_USER_DELETE,
                    content: `<strong>⚠️ 최종 확인이 필요합니다</strong><hr><br>
                            • 탈퇴 신청 후 <strong>30일 이내 재로그인</strong>하면 계정을 복구할 수 있습니다.<br>
                            • 30일 경과 후에는 모든 데이터가 <strong>영구적으로 삭제</strong>됩니다.`,
                    confirmText: '탈퇴 신청',
                    confirmType: 'danger',
                    cancelText: '취소',
                    onConfirm: () => removeUser(user.id)
                });
                finalModal.show();
            }
        });
        firstModal.show();
    });
}

async function loadUserData() {
    user = getUserFromStorage();
    
    if (!user) {
        ToastUtils.error(TOAST_MESSAGE.USER_LOAD_FAILED);
        navigateTo('/login');
        return;
    }
    
    originalNickname = user.nickname || '';
    originalProfileImageKey = user.profileImageKey || null;
    
    setElementValue(elements.nickname, originalNickname);
    
    while (elements.profileImage.firstChild) {
        elements.profileImage.removeChild(elements.profileImage.firstChild);
    }
    
    if (originalProfileImageKey) {
        renderProfileImage(elements.profileImage, originalProfileImageKey);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'block';
        }
    } else {
        createProfilePlaceholder(elements.profileImage);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'none';
        }
    }
    
    elements.profileImageInput.value = '';
    
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
        emailInput.value = user.email || '';
    }
    
    updateSubmitButtonState();
}

async function uploadProfileImage(userId, file) {
    const response = await uploadImage('PROFILE', userId, file);
    if (!response?.data?.objectKey) {
        throw new Error(TOAST_MESSAGE.PROFILE_IMAGE_UPLOAD_FAILED);
    }
    return response.data.objectKey;
}

function updateProfileImageDisplay(imageKey) {
    while (elements.profileImage.firstChild) {
        elements.profileImage.removeChild(elements.profileImage.firstChild);
    }
    
    if (imageKey) {
        renderProfileImage(elements.profileImage, imageKey);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'block';
        }
    } else {
        createProfilePlaceholder(elements.profileImage);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'none';
        }
    }
}

function setupFormSubmission() {
    if (!elements.userEditForm) return;
    
    createFormHandler({
        form: elements.userEditForm,
        loadingText: '수정 중...',
        successMessage: TOAST_MESSAGE.USER_UPDATE_SUCCESS,
        submitButtonSelector: getSubmitButton(elements.buttonGroup),
        validate: () => {
        if (!user) {
            ToastUtils.error(TOAST_MESSAGE.USER_LOAD_FAILED);
                return false;
        }
            return true;
        },
        onSubmit: async () => {
        const nickname = getElementValue(elements.nickname, '').trim();
        const profileImageFile = elements.profileImageInput?.files[0];
        
            const hasOriginalImage = !!originalProfileImageKey;
            const hasCurrentImage = !!elements.profileImage.querySelector('img');
            const isImageRemoved = hasOriginalImage && !hasCurrentImage && !profileImageFile;
        
            let profileImageKey = user.profileImageKey || null;
            
            if (isImageRemoved) {
                profileImageKey = '';
            } else if (profileImageFile) {
                profileImageKey = await uploadProfileImage(user.id, profileImageFile);
            }
            
            const updatePayload = {
                nickname: nickname
            };
            
            if (isImageRemoved || profileImageFile || profileImageKey !== user.profileImageKey) {
                updatePayload.profileImageKey = profileImageKey;
            }
            
            const response = await updateUser(user.id, updatePayload);
            
            if (response?.data) {
                user = response.data;
                saveUserToStorage(user, localStorage.getItem('user') !== null);
                
                originalNickname = nickname;
                originalProfileImageKey = user.profileImageKey || null;
                
                updateProfileImageDisplay(user.profileImageKey || null);
                elements.profileImageInput.value = '';
                updateSubmitButtonState();
                dispatchUserUpdatedEvent();
                
                return { success: true };
            }
            
            throw new Error(TOAST_MESSAGE.USER_UPDATE_FAILED);
        },
        onSuccess: () => {
            setTimeout(() => navigateTo('/'), 1200);
            }
    });
}

// Placeholder 및 Helper Text 설정
function setupPlaceholdersAndHelperTexts() {
    if (elements.nickname) elements.nickname.placeholder = PLACEHOLDER.NICKNAME;
}

document.addEventListener('DOMContentLoaded', async function() {
    setupPlaceholdersAndHelperTexts();
    PageLayout.initializePage();
    createUserEditButtons();
    setupProfileImageChange();
    setupFormFields();
    setupWithdrawal();
    setupFormSubmission();
    
    window.handleBackNavigation = () => navigateTo('/');
    
    await loadUserData();
});
