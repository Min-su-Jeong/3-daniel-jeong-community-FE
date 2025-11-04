import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, setElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { Modal } from '../../components/modal/modal.js';
import { validateImageFiles, createImagePreviews } from '../../utils/common/image.js';
import { IMAGE_CONSTANTS, API_SERVER_URI } from '../../utils/constants.js';
import { getUserById, updateUser } from '../../api/users.js';
import { uploadImage } from '../../api/images.js';

// DOM 요소들 초기화
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

// 회원정보수정 페이지 버튼 생성
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

// 프로필 이미지 변경 처리
function setupProfileImageChange() {
    if (!elements.changeImageBtn || !elements.profileImageInput || !elements.profileImage) return;
    
    elements.changeImageBtn.addEventListener('click', () => {
        elements.profileImageInput.click();
    });
    
    elements.profileImageInput.addEventListener('change', async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        // 이미지 파일 유효성 검사
        const { validFiles, errors } = validateImageFiles(files, IMAGE_CONSTANTS.MAX_IMAGE_SIZE, IMAGE_CONSTANTS.SUPPORTED_TYPES, 1);
        
        // 에러가 있으면 표시
        if (errors.length > 0) {
            errors.forEach(error => ToastUtils.error(error));
            return;
        }
        
        if (validFiles.length === 0) return;
        
        try {
            // 이미지 미리보기 생성
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

// 폼 유효성 검사 설정
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
    
    // TODO: API 연결 시 닉네임 중복 검사 추가
}

// 회원 탈퇴 처리
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

// 사용자 정보 로드
async function loadUserData() {
    try {
        // localStorage에서 사용자 정보 가져오기
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            navigateTo('/login');
            return;
        }
        
        const user = JSON.parse(userStr);
        
        // 닉네임 설정
        if (elements.nickname) {
            setElementValue(elements.nickname, user.nickname || '');
        }
        
        // 프로필 이미지 표시
        if (elements.profileImage && user.profileImageKey) {
            const profileImageUrl = `${API_SERVER_URI}/files/${user.profileImageKey}`;
            const img = document.createElement('img');
            img.src = profileImageUrl;
            img.alt = user.nickname || '프로필 이미지';
            
            elements.profileImage.innerHTML = '';
            elements.profileImage.appendChild(img);
        }
        
        // 이메일 표시 (읽기 전용)
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.value = user.email || '';
        }
        
    } catch (error) {
        ToastUtils.error('사용자 정보를 불러오는데 실패했습니다.');
    }
}

// 폼 제출 처리
function setupFormSubmission() {
    if (!elements.userEditForm) return;
    
    elements.userEditForm.onsubmit = async function(event) {
        event.preventDefault();

        const nickname = getElementValue(elements.nickname, '');
        const profileImageFile = elements.profileImageInput.files[0];
        
        // localStorage에서 사용자 정보 가져오기
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            return;
        }
        
        const user = JSON.parse(userStr);
        const userId = user.id;
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            let profileImageKey = user.profileImageKey || null;
            
            // 프로필 이미지가 변경되었으면 업로드
            if (profileImageFile) {
                try {
                    const uploadResponse = await uploadImage('PROFILE', userId, profileImageFile);
                    if (uploadResponse?.data?.objectKey) {
                        profileImageKey = uploadResponse.data.objectKey;
                    }
                } catch (uploadError) {
                    ToastUtils.error('프로필 이미지 업로드에 실패했습니다.');
                    throw uploadError;
                }
            }
            
            // 사용자 정보 업데이트
            const updateResponse = await updateUser(userId, {
                nickname: nickname,
                profileImageKey: profileImageKey
            });
            
            
            // localStorage 업데이트
            if (updateResponse?.data) {
                localStorage.setItem('user', JSON.stringify(updateResponse.data));
                if (updateResponse.data.profileImageKey) {
                    const profileImageUrl = `${API_SERVER_URI}/files/${updateResponse.data.profileImageKey}`;
                    localStorage.setItem('profileImageUrl', profileImageUrl);
                } else {
                    localStorage.removeItem('profileImageUrl');
                }
            }
            
            ToastUtils.success('회원정보가 수정되었습니다!');
            
            // 헤더 업데이트를 위해 이벤트 발생
            window.dispatchEvent(new CustomEvent('userUpdated'));
            
            // 2초 후 이전 페이지로 이동
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

// DOMContentLoaded 이벤트 리스너
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