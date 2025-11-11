import { login, restoreUser } from '../../api/index.js';
import { PageLayout, Button, Modal, ToastUtils } from '../../components/index.js';
import { validateEmail, validatePassword, setupFormValidation, getElementValue, initializeElements, navigateTo, removeUserFromStorage, dispatchUserUpdatedEvent, saveUserToStorage } from '../../utils/common/index.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';

/** 페이지 DOM 요소 캐시 */
let elements = {};
/** 버튼 그룹 컴포넌트 인스턴스 */
let buttonGroup = null;

/**
 * 페이지 DOM 요소 초기화 (ID로 요소 일괄 조회)
 */
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

/**
 * 로그인 페이지 버튼 생성 (로그인/회원가입 가로 배치, 비회원 로그인 하단 배치)
 */
function createLoginButtons() {
    if (!elements.buttonGroup) return;
    
    // 로그인/회원가입 버튼을 가로로 배치
    buttonGroup = Button.createGroup(elements.buttonGroup, [
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

/**
 * 비회원 로그인 처리 (저장소 정리 후 홈으로 이동)
 */
function handleGuestLogin() {
    removeUserFromStorage();
    dispatchUserUpdatedEvent();
    ToastUtils.success(TOAST_MESSAGE.LOGIN_GUEST);
    navigateTo('/');
}

/**
 * 폼 필드 유효성 검사 설정 (이메일/비밀번호 실시간 검증)
 */
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

/**
 * 입력 필드 placeholder 텍스트 설정
 */
function setupPlaceholders() {
    if (elements.email) elements.email.placeholder = PLACEHOLDER.EMAIL;
    if (elements.password) elements.password.placeholder = PLACEHOLDER.PASSWORD;
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    setupPlaceholders();
    
    PageLayout.initializePage();
    initializePageElements();
    createLoginButtons();
    
    // 폼 필드에 공통 유효성 검사 설정
    setupFormFields();
    
    if (!elements.loginForm) return;
    
    elements.loginForm.onsubmit = async function(event) {
        event.preventDefault();

        const email = getElementValue(elements.email, '');
        const password = getElementValue(elements.password, '');
        const rememberMe = getElementValue(elements.rememberMe, false);
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '로그인 중...');
        
        try {
            // API 호출로 로그인 처리
            const response = await login({ email, password, rememberMe });
            
            // 사용자 정보 저장
            if (response?.data?.user) {
                const user = response.data.user;
                
                // 탈퇴 대기 중인 계정인지 확인 
                const hasDeletedAt = user.deletedAt !== null && user.deletedAt !== undefined && user.deletedAt !== '';
                
                if (hasDeletedAt) {
                    // 계정 복구 처리 함수
                    const handleRestore = async () => {
                        try {
                            await restoreUser(user.id);
                            
                            // 복구 후 정상 로그인 처리
                            saveUserToStorage(user, rememberMe);
                            ToastUtils.success(TOAST_MESSAGE.LOGIN_RESTORED);
                            dispatchUserUpdatedEvent();
                            
                            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                            if (redirectPath) {
                                sessionStorage.removeItem('redirectAfterLogin');
                                navigateTo(redirectPath);
                            } else {
                                navigateTo('/');
                            }
                        } catch (error) {
                            ToastUtils.error(error.message || TOAST_MESSAGE.ACCOUNT_RESTORE_FAILED);
                        }
                    };
                    
                    // 탈퇴 대기 중인 계정 복구 여부 확인 모달
                    const restoreModal = new Modal({
                        title: MODAL_MESSAGE.TITLE_ACCOUNT_RESTORE,
                        subtitle: MODAL_MESSAGE.SUBTITLE_ACCOUNT_RESTORE,
                        content: `이 계정은 탈퇴 신청으로 인해 <strong>삭제 대기 상태</strong>입니다.<br><br>
                                    복구하시면 계정이 정상적으로 활성화됩니다.<br>
                                    복구하지 않으시면 30일 경과 후 모든 데이터가 영구적으로 삭제됩니다.<br><br>
                                    <strong>계정을 복구하시겠습니까?</strong>`,
                        confirmText: '계정 복구',
                        confirmType: 'primary',
                        showCancel: true,
                        cancelText: '취소',
                        onConfirm: handleRestore,
                        onCancel: () => {
                            // 복구하지 않고 로그인 취소
                            ToastUtils.info(TOAST_MESSAGE.ACCOUNT_RESTORE_CANCELLED);
                        }
                    });
                    restoreModal.show();
                } else {
                    // 정상 로그인 처리
                    saveUserToStorage(user, rememberMe);
                    ToastUtils.success(TOAST_MESSAGE.LOGIN_SUCCESS);
                    dispatchUserUpdatedEvent();
                    
                    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                    if (redirectPath) {
                        sessionStorage.removeItem('redirectAfterLogin');
                        navigateTo(redirectPath);
                    } else {
                        navigateTo('/');
                    }
                }
            }
            
        } catch (error) {
            const errorMessage = error.message || TOAST_MESSAGE.LOGIN_FAILED;
            ToastUtils.error(errorMessage);
        } finally {
            // 로딩 상태 해제
            PageLayout.hideLoading(submitButton, '로그인');
        }
    };
});