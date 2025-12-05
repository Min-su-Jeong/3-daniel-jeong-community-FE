import { login } from '../../utils/api/auth.js';
import { restoreUser } from '../../utils/api/users.js';
import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { getElementValue, initializeElements, setupPlaceholders, showButtonLoading, hideButtonLoading } from '../../utils/common/element.js';
import { removeUserFromStorage, dispatchUserUpdatedEvent, saveUserToStorage } from '../../utils/common/user.js';

let elements = {};


// 페이지 요소 초기화
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
    
    Button.create(elements.buttonGroup, {
        text: '로그인',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    Button.create(elements.buttonGroup, {
        text: '비회원으로 둘러보기',
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
    if (elements.password) {
        elements.password.addEventListener('keypress', (e) => {
            if (e.key === ' ') {
                e.preventDefault();
            }
        });
    }
}

// 플레이스홀더 설정 (이메일/비밀번호)
function setupPlaceholdersForLogin() {
    setupPlaceholders([
        { element: elements.email, placeholder: PLACEHOLDER.EMAIL },
        { element: elements.password, placeholder: PLACEHOLDER.PASSWORD }
    ]);
}

// 로그인 후 리다이렉트 (세션 저장소에서 리다이렉트 경로 확인 후 이동)
function redirectAfterLogin() {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigateTo(redirectPath);
    } else {
        navigateTo('/post-list');
    }
}

// 로그인 완료 처리 (사용자 저장, 토스트 메시지 표시, 이벤트 발생, 리다이렉트)
function completeLogin(user, rememberMe, message = TOAST_MESSAGE.LOGIN_SUCCESS) {
    saveUserToStorage(user, rememberMe);
    Toast.success(message);
    dispatchUserUpdatedEvent();
    redirectAfterLogin();
}

// 계정 복구 처리 (API 호출 후 로그인 완료 처리)
async function restoreUserAccount(user, rememberMe) {
    try {
        await restoreUser(user.id);
        completeLogin(user, rememberMe, TOAST_MESSAGE.LOGIN_RESTORED);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.ACCOUNT_RESTORE_FAILED);
    }
}

// 계정 복구 모달 표시 (모달 표시 후 계정 복구 처리)
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

// 계정 삭제 대기 상태 확인 (삭제된 시간이 있는지 확인)
function isUserAccountPendingDeletion(user) {
    return user.deletedAt != null && user.deletedAt !== '';
}


// 로그인 폼 제출 처리 (이메일/비밀번호 입력 확인 후 로그인 처리)
async function handleLogin(event) {
    event.preventDefault();

    const email = getElementValue(elements.email, '');
    const password = getElementValue(elements.password, '');
    const rememberMe = getElementValue(elements.rememberMe, false);
    
    const submitButton = elements.buttonGroup?.querySelector('.btn-primary');
    const originalText = submitButton?.textContent || '로그인';
    showButtonLoading(submitButton, '로그인 중...');
    
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
        hideButtonLoading(submitButton, originalText);
    }
}

// 페이지 초기화 (DOMContentLoaded 이벤트 발생 시 페이지 초기화)
document.addEventListener('DOMContentLoaded', function() {
    PageLayout.init();
    initializePageElements();
    setupPlaceholdersForLogin();
    createLoginButtons();
    setupFormFields();
    
    if (elements.loginForm) {
        elements.loginForm.onsubmit = handleLogin;
    }
});
