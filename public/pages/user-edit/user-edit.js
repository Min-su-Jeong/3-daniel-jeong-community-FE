import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, setElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { Modal } from '../../components/modal/modal.js';
import { validateImageFiles, createImagePreviews } from '../../utils/common/image.js';
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../../utils/constants.js';
import { updateUser, deleteUser } from '../../api/users.js';
import { uploadImage } from '../../api/images.js';
import { logout } from '../../api/auth.js';

let elements = {};
let originalNickname = '';
let originalProfileImageKey = null;
let user = null;
let editButton = null;

function initializePageElements() {
    const elementIds = {
        buttonGroup: 'buttonGroup',
        userEditForm: 'userEditForm',
        nickname: 'nickname',
        profileImage: 'profileImage',
        changeImageBtn: 'changeImageBtn',
        profileImageInput: 'profileImageInput',
        withdrawalLink: 'withdrawalLink'
    };
    
    elements = initializeElements(elementIds);
}

/**
 * 사용자 정보 가져오기
 */
function getUserFromStorage() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

/**
 * 사용자 정보 저장
 */
function saveUserToStorage(userData) {
    const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(userData));
}

/**
 * 프로필 이미지 렌더링
 */
function renderProfileImage(container, imageKey) {
    if (!container || !imageKey) return;
    
    const img = document.createElement('img');
    img.src = `${API_SERVER_URI}/files/${imageKey}`;
    img.alt = '프로필 이미지';
    
    container.innerHTML = '';
    container.appendChild(img);
}

function createUserEditButtons() {
    if (!elements.buttonGroup) return;
    
    elements.buttonGroup.innerHTML = '';
    
    editButton = new Button({
        text: '수정하기',
        type: 'submit',
        variant: 'primary',
        size: 'medium',
        disabled: true
    });
    
    editButton.appendTo(elements.buttonGroup);
}

/**
 * helper-text 초기화
 */
function resetHelperText() {
    const helperText = elements.nickname?.nextElementSibling;
    if (!helperText?.classList.contains('helper-text')) return;
    
    elements.nickname.classList.remove('success', 'error', 'warning');
    helperText.classList.remove('success', 'error', 'warning');
    helperText.textContent = helperText.dataset.defaultText || '';
}

/**
 * 수정하기 버튼 활성화/비활성화 처리
 */
function updateSubmitButtonState() {
    if (!editButton) return;
    
    const currentNickname = getElementValue(elements.nickname, '').trim();
    const nicknameChanged = currentNickname !== originalNickname;
    const imageChanged = !!elements.profileImageInput?.files[0];
    
    // 닉네임이 원래 값으로 되돌아가면 helper-text 초기화
    if (!nicknameChanged) {
        resetHelperText();
    }
    
    // 닉네임 유효성 검사: 변경되지 않았으면 기본적으로 유효함
    const nicknameValid = nicknameChanged ? validateNickname(currentNickname).isValid : true;
    
    // 유효한 변경이 있으면 활성화
    const canSubmit = (nicknameChanged && nicknameValid) || imageChanged;
    editButton.setDisabled(!canSubmit);
}

/**
 * 원본 이미지로 복원
 */
function restoreOriginalImage() {
    if (originalProfileImageKey) {
        renderProfileImage(elements.profileImage, originalProfileImageKey);
    }
    elements.profileImageInput.value = '';
    updateSubmitButtonState();
}

/**
 * 프로필 이미지 변경 처리
 */
function setupProfileImageChange() {
    if (!elements.changeImageBtn || !elements.profileImageInput || !elements.profileImage) return;
    
    elements.changeImageBtn.addEventListener('click', () => {
        elements.profileImageInput.click();
    });
    
    elements.profileImageInput.addEventListener('change', async () => {
        const files = Array.from(elements.profileImageInput.files);
        
        if (files.length === 0) {
            restoreOriginalImage();
            return;
        }
        
        const { validFiles, errors } = validateImageFiles(
            files, 
            IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
            IMAGE_CONSTANTS.SUPPORTED_TYPES, 
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
                const img = document.createElement('img');
                img.src = previews[0].url;
                img.alt = '프로필 이미지';
                elements.profileImage.innerHTML = '';
                elements.profileImage.appendChild(img);
                updateSubmitButtonState();
            }
        } catch {
            ToastUtils.error('이미지 처리 중 오류가 발생했습니다.');
            restoreOriginalImage();
        }
    });
}

function setupFormFields() {
    setupFormValidation('userEditForm', [
        {
            id: 'nickname',
            validation: validateNickname,
            options: {
                successMessage: '사용 가능한 닉네임입니다',
                defaultText: '',
                minLength: 2,
                maxLength: 10
            }
        }
    ]);
    
    elements.nickname?.addEventListener('input', updateSubmitButtonState);
}

/**
 * 회원 탈퇴 처리
 */
async function removeUser(userId) {
    try {
        await deleteUser(userId);
        await logout();
        
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        
        window.dispatchEvent(new CustomEvent('userUpdated'));
        ToastUtils.success('회원 탈퇴가 완료되었습니다.');
        navigateTo('/');
    } catch (error) {
        ToastUtils.error(error.message || '회원 탈퇴에 실패했습니다.');
    }
}

function setupWithdrawal() {
    if (!elements.withdrawalLink) return;

    elements.withdrawalLink.addEventListener('click', (event) => {
        event.preventDefault();
        
        if (!user) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            return;
        }
        
        const firstModal = new Modal({
            title: '회원 탈퇴',
            content: '회원 탈퇴를 진행하시겠습니까?<br>탈퇴된 계정은 복구할 수 없습니다.',
            confirmText: '탈퇴',
            confirmType: 'danger',
            onConfirm: () => {
                const finalModal = new Modal({
                    title: '회원 탈퇴 확인',
                    content: '정말로 회원 탈퇴를 진행하시겠습니까?<br><strong>계정과 관련된 모든 정보가 영구적으로 삭제됩니다.</strong>',
                    confirmText: '탈퇴',
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

/**
 * 사용자 정보 로드
 */
async function loadUserData() {
    user = getUserFromStorage();
    
    if (!user) {
        ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
        navigateTo('/login');
        return;
    }
    
    originalNickname = user.nickname || '';
    originalProfileImageKey = user.profileImageKey || null;
    
    setElementValue(elements.nickname, originalNickname);
    
    if (originalProfileImageKey) {
        renderProfileImage(elements.profileImage, originalProfileImageKey);
    }
    
    elements.profileImageInput.value = '';
    
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
        emailInput.value = user.email || '';
    }
    
    updateSubmitButtonState();
}

/**
 * 프로필 이미지 업로드
 */
async function uploadProfileImage(userId, file) {
    const response = await uploadImage('PROFILE', userId, file);
    if (!response?.data?.objectKey) {
        throw new Error('프로필 이미지 업로드에 실패했습니다.');
    }
    return response.data.objectKey;
}

/**
 * 폼 제출 처리
 */
function setupFormSubmission() {
    if (!elements.userEditForm) return;
    
    elements.userEditForm.onsubmit = async function(event) {
        event.preventDefault();

        if (!user) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            return;
        }

        const nickname = getElementValue(elements.nickname, '').trim();
        const profileImageFile = elements.profileImageInput?.files[0];
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            let profileImageKey = user.profileImageKey || null;
            
            if (profileImageFile) {
                profileImageKey = await uploadProfileImage(user.id, profileImageFile);
            }
            
            const response = await updateUser(user.id, {
                nickname: nickname,
                profileImageKey: profileImageKey
            });
            
            if (response?.data) {
                user = response.data;
                saveUserToStorage(user);
                
                originalNickname = nickname;
                originalProfileImageKey = profileImageKey;
                
                if (profileImageKey) {
                    renderProfileImage(elements.profileImage, profileImageKey);
                }
                
                elements.profileImageInput.value = '';
                updateSubmitButtonState();
                window.dispatchEvent(new CustomEvent('userUpdated'));
            ToastUtils.success('회원정보가 수정되었습니다!');
            }
        } catch (error) {
            ToastUtils.error(error.message || '회원정보 수정에 실패했습니다.');
        } finally {
            PageLayout.hideLoading(submitButton, '수정하기');
        }
    };
}

document.addEventListener('DOMContentLoaded', async function() {
    PageLayout.initializePage();
    initializePageElements();
    createUserEditButtons();
    setupProfileImageChange();
    setupFormFields();
    setupWithdrawal();
    setupFormSubmission();
    
    // 뒤로가기 버튼 클릭 시 게시글 목록 페이지로 이동
    window.handleBackNavigation = () => navigateTo('/');
    
    // 사용자 정보 로드
    await loadUserData();
});