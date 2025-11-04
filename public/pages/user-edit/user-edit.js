import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, setElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { Modal } from '../../components/modal/modal.js';
import { validateImageFiles, createImagePreviews } from '../../utils/common/image.js';
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../../utils/constants.js';
import { updateUser } from '../../api/users.js';
import { uploadImage } from '../../api/images.js';

let elements = {};

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
 * 사용자 정보 가져오기 (localStorage와 sessionStorage 둘 다 확인)
 */
function getUserFromStorage() {
    try {
        let userStr = localStorage.getItem('user');
        if (!userStr) {
            userStr = sessionStorage.getItem('user');
        }
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        return null;
    }
}

/**
 * 사용자 정보 저장
 */
function saveUserToStorage(userData) {
    const wasInLocalStorage = !!localStorage.getItem('user');
    const wasInSessionStorage = !!sessionStorage.getItem('user');
    
    if (wasInLocalStorage) {
        localStorage.setItem('user', JSON.stringify(userData));
    } else if (wasInSessionStorage) {
        sessionStorage.setItem('user', JSON.stringify(userData));
    } else {
        localStorage.setItem('user', JSON.stringify(userData));
    }
}

/**
 * 프로필 이미지 렌더링
 */
function renderProfileImage(container, imageKey, altText = '프로필 이미지') {
    if (!container || !imageKey) return;
    
    const profileImageUrl = `${API_SERVER_URI}/files/${imageKey}`;
    const img = document.createElement('img');
    img.src = profileImageUrl;
    img.alt = altText;
    
    container.innerHTML = '';
    container.appendChild(img);
}

function createUserEditButtons() {
    if (!elements.buttonGroup) return;
    
    elements.buttonGroup.innerHTML = '';
    
    // 수정하기 버튼
    const editButton = new Button({
        text: '수정하기',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    editButton.appendTo(elements.buttonGroup);
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
        if (files.length === 0) return;
        
        const { validFiles, errors } = validateImageFiles(
            files, 
            IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
            IMAGE_CONSTANTS.SUPPORTED_TYPES, 
            1
        );
        
        if (errors.length > 0) {
            errors.forEach(error => ToastUtils.error(error));
            return;
        }
        
        if (validFiles.length === 0) return;
        
        try {
            const { previews, errors: previewErrors } = await createImagePreviews(validFiles);
            
            if (previewErrors.length > 0) {
                previewErrors.forEach(({ error }) => ToastUtils.error(error.message));
                return;
            }
            
            if (previews.length > 0) {
                const { url } = previews[0];
                const img = document.createElement('img');
                img.src = url;
                img.alt = '프로필 이미지';
                
                elements.profileImage.innerHTML = '';
                elements.profileImage.appendChild(img);
            }
        } catch (error) {
            ToastUtils.error('이미지 처리 중 오류가 발생했습니다.');
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
}

function setupWithdrawal() {
    if (!elements.withdrawalLink) return;

    elements.withdrawalLink.addEventListener('click', (event) => {
        event.preventDefault();
        
        // 첫 번째 확인 모달
        const firstModal = new Modal({
            title: '회원 탈퇴',
            content: '회원 탈퇴를 진행하시겠습니까?<br>탈퇴된 계정은 복구할 수 없습니다.',
            confirmText: '탈퇴',
            confirmType: 'danger',
            onConfirm: () => {
                // 두 번째 최종 확인 모달
                const finalModal = new Modal({
                    title: '회원 탈퇴 확인',
                    content: '정말로 회원 탈퇴를 진행하시겠습니까?<br><strong>계정과 관련된 모든 정보가 영구적으로 삭제됩니다.</strong>',
                    confirmText: '탈퇴',
                    confirmType: 'danger',
                    cancelText: '취소',
                    onConfirm: () => {
                        // TODO: 회원 탈퇴 API 호출
                        ToastUtils.success('회원 탈퇴가 완료되었습니다.');
                        navigateTo('/post-list');
                    }
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
    const user = getUserFromStorage();
    
    if (!user) {
        ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
        navigateTo('/login');
        return;
    }
    
    if (elements.nickname) {
        setElementValue(elements.nickname, user.nickname || '');
    }
    
    if (user.profileImageKey) {
        renderProfileImage(elements.profileImage, user.profileImageKey, user.nickname || '프로필 이미지');
    }
    
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
        emailInput.value = user.email || '';
    }
}

/**
 * 프로필 이미지 업로드
 */
async function uploadProfileImage(userId, file) {
    const uploadResponse = await uploadImage('PROFILE', userId, file);
    if (!uploadResponse?.data?.objectKey) {
        throw new Error('프로필 이미지 업로드에 실패했습니다.');
    }
    return uploadResponse.data.objectKey;
}

/**
 * 폼 제출 처리
 */
function setupFormSubmission() {
    if (!elements.userEditForm) return;
    
    elements.userEditForm.onsubmit = async function(event) {
        event.preventDefault();

        const user = getUserFromStorage();
        if (!user) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            return;
        }

        const nickname = getElementValue(elements.nickname, '');
        const profileImageFile = elements.profileImageInput?.files[0];
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            let profileImageKey = user.profileImageKey || null;
            
            if (profileImageFile) {
                try {
                    profileImageKey = await uploadProfileImage(user.id, profileImageFile);
                } catch (uploadError) {
                    ToastUtils.error(uploadError.message || '프로필 이미지 업로드에 실패했습니다.');
                    throw uploadError;
                }
            }
            
            const updateResponse = await updateUser(user.id, {
                nickname: nickname,
                profileImageKey: profileImageKey
            });
            
            if (updateResponse?.data) {
                saveUserToStorage(updateResponse.data);
                
                if (updateResponse.data.profileImageKey) {
                    const profileImageUrl = `${API_SERVER_URI}/files/${updateResponse.data.profileImageKey}`;
                    localStorage.setItem('profileImageUrl', profileImageUrl);
                } else {
                    localStorage.removeItem('profileImageUrl');
                }
            }
            
            ToastUtils.success('회원정보가 수정되었습니다!');
            window.dispatchEvent(new CustomEvent('userUpdated'));
            
            setTimeout(() => {
                history.back();
            }, 2000);
            
        } catch (error) {
            const errorMessage = error.message || '회원정보 수정에 실패했습니다.';
            ToastUtils.error(errorMessage);
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
    
    // 사용자 정보 로드
    await loadUserData();
});