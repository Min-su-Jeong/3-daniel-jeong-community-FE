import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { Modal } from '../../components/modal/modal.js';
import { validateImageFiles, createImagePreviews } from '../../utils/common/image.js';
import { IMAGE_CONSTANTS } from '../../utils/constants.js';

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
            console.error('프로필 이미지 처리 실패:', error);
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

// 폼 제출 처리
function setupFormSubmission() {
    if (!elements.userEditForm) return;
    
    elements.userEditForm.onsubmit = async function(event) {
        event.preventDefault();

        const nickname = getElementValue(elements.nickname, '');
        const profileImage = elements.profileImageInput.files[0];
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            // TODO: 회원정보 수정 API 호출
            console.log('회원정보 수정 시도:', { nickname, profileImage });
            
            // 임시 성공 처리
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('회원정보 수정 성공');
            ToastUtils.success('회원정보가 수정되었습니다!');
            
            // 2초 후 이전 페이지로 이동
            setTimeout(() => {
                history.back();
            }, 2000);
            
        } catch (error) {
            ToastUtils.error('회원정보 수정에 실패했습니다.');
        } finally {
            PageLayout.hideLoading(submitButton, '수정하기');
        }
    };
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    initializePageElements();
    createUserEditButtons();
    setupProfileImageChange();
    setupFormFields();
    setupWithdrawal();
    setupFormSubmission();
});