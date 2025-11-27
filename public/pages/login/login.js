import { login } from '../../utils/api/auth.js';
import { restoreUser } from '../../utils/api/users.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { Toast } from '../../components/toast/toast.js';
import { validateEmail, validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, setupPlaceholders } from '../../utils/common/element.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { removeUserFromStorage, dispatchUserUpdatedEvent, saveUserToStorage } from '../../utils/common/user.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

let elements = {};

// 페이지 DOM 요소 초기화 (ID로 요소 일괄 조회)
function initializePageElements() {
    const elementIds = {
        buttonGroup: 'buttonGroup',
        loginForm: 'loginForm',
        email: 'email',
        password: 'password',
        rememberMe: 'rememberMe'
    };
    
    elements = initializeElements(elementIds);
}

// 로그인 페이지 버튼 생성 (로그인/회원가입 가로 배치, 비회원 로그인 하단 배치)
function createLoginButtons() {
    if (!elements.buttonGroup) return;
    
    // 로그인/회원가입 버튼을 가로로 배치
    Button.createGroup(elements.buttonGroup, [
        {
            text: '로그인',
            type: 'submit',
            variant: 'primary',
            size: 'medium'
        },
        {
            text: '회원가입',
            type: 'button',
            variant: 'secondary',
            size: 'medium',
            onClick: () => navigateTo('/signup')
        }
    ], { wrapInRow: false });
    
    // 비회원으로 로그인 버튼은 아래 행에 추가
    Button.create(elements.buttonGroup, {
        text: '비회원으로 로그인',
        type: 'button',
        variant: 'secondary',
        size: 'medium',
        onClick: handleGuestLogin
    });
}

// 비회원 로그인 처리 (저장소 정리 후 홈으로 이동)
function handleGuestLogin() {
    removeUserFromStorage();
    dispatchUserUpdatedEvent();
    Toast.success(TOAST_MESSAGE.LOGIN_GUEST);
    navigateTo('/post-list');
}

// 폼 필드 유효성 검사 설정 (이메일/비밀번호 실시간 검증)
function setupFormFields() {
    setupFormValidation('loginForm', [
        {
            id: 'email',
            validation: validateEmail,
            options: {
                successMessage: VALIDATION_MESSAGE.EMAIL_VALID,
                defaultText: HELPER_TEXT.EMAIL
            }
        },
        {
            id: 'password',
            validation: validatePassword,
            options: {
                successMessage: VALIDATION_MESSAGE.PASSWORD_VALID,
                defaultText: HELPER_TEXT.PASSWORD,
                preventSpaces: true
            }
        }
    ]);
}

// 입력 필드 placeholder 텍스트 설정
function setupPlaceholdersForLogin() {
    setupPlaceholders([
        { element: elements.email, placeholder: PLACEHOLDER.EMAIL },
        { element: elements.password, placeholder: PLACEHOLDER.PASSWORD }
    ]);
}

// 로그인 후 리다이렉트 처리
// 로그인이 필요한 페이지에서 로그인 페이지로 이동했을 때, 로그인 후 원래 페이지로 돌아가기
function redirectAfterLogin() {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigateTo(redirectPath);
    } else {
        navigateTo('/post-list');
    }
}

// 정상 로그인 처리 (사용자 저장, 이벤트 발생, 리다이렉트)
function completeLogin(user, rememberMe, message = TOAST_MESSAGE.LOGIN_SUCCESS) {
    saveUserToStorage(user, rememberMe);
    Toast.success(message);
    dispatchUserUpdatedEvent();
    redirectAfterLogin();
}

// 계정 복구 처리
async function restoreUserAccount(user, rememberMe) {
    try {
        await restoreUser(user.id);
        completeLogin(user, rememberMe, TOAST_MESSAGE.LOGIN_RESTORED);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.ACCOUNT_RESTORE_FAILED);
    }
}

// 탈퇴 대기 계정 복구 모달 표시
function showAccountRestoreModal(user, rememberMe) {
    const restoreModal = new Modal({
        title: MODAL_MESSAGE.TITLE_ACCOUNT_RESTORE,
        subtitle: MODAL_MESSAGE.SUBTITLE_ACCOUNT_RESTORE,
        content: MODAL_MESSAGE.CONTENT_ACCOUNT_RESTORE,
        confirmText: '계정 복구',
        confirmType: 'primary',
        showCancel: true,
        cancelText: '취소',
        onConfirm: () => restoreUserAccount(user, rememberMe),
        onCancel: () => Toast.info(TOAST_MESSAGE.ACCOUNT_RESTORE_CANCELLED)
    });
    restoreModal.show();
}

// 탈퇴 대기 중인 계정인지 확인
function isUserAccountPendingDeletion(user) {
    return user.deletedAt != null && user.deletedAt !== '';
}

// 로그인 폼 제출 처리
async function handleLogin(event) {
    event.preventDefault();

    const email = getElementValue(elements.email, '');
    const password = getElementValue(elements.password, '');
    const rememberMe = getElementValue(elements.rememberMe, false);
    
    const submitButton = elements.buttonGroup.querySelector('.btn-primary');
    PageLayout.showLoading(submitButton, '로그인 중...');
    
    try {
        const response = await login({ email, password, rememberMe });
        
        if (!response?.data?.user) return;
        
        const user = response.data.user;
        
        if (isUserAccountPendingDeletion(user)) {
            showAccountRestoreModal(user, rememberMe);
        } else {
            completeLogin(user, rememberMe);
        }
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.LOGIN_FAILED);
    } finally {
        PageLayout.hideLoading(submitButton, '로그인');
    }
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    setupPlaceholdersForLogin();
    
    PageLayout.initializePage();
    initializePageElements();
    createLoginButtons();
    setupFormFields();
    
    if (elements.loginForm) {
        elements.loginForm.onsubmit = handleLogin;
    }
});