import { login } from '../../api/auth.js';
import { restoreUser } from '../../api/users.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { validateEmail, validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';

// DOM 요소들 초기화
let elements = {};

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

// 로그인 페이지 버튼 생성
function createLoginButtons() {
    if (!elements.buttonGroup) return;
    
    elements.buttonGroup.innerHTML = '';
    
    // 로그인 버튼
    const loginButton = new Button({
        text: '로그인',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    // 회원가입 버튼
    const signupButton = new Button({
        text: '회원가입',
        type: 'button',
        variant: 'secondary',
        size: 'medium',
        onClick: () => {
            navigateTo('/signup');
        }
    });
    
    loginButton.appendTo(elements.buttonGroup);
    signupButton.appendTo(elements.buttonGroup);
    
    // 비회원으로 로그인 버튼
    const guestLoginButton = new Button({
        text: '비회원으로 로그인',
        type: 'button',
        variant: 'secondary',
        size: 'medium',
        onClick: () => {
            handleGuestLogin();
        }
    });
    
    guestLoginButton.appendTo(elements.buttonGroup);
    
    // 로그인/회원가입 버튼을 가로로 배치
    const authButtons = elements.buttonGroup.querySelectorAll('.btn:nth-child(-n+2)');
    if (authButtons.length === 2) {
        const buttonRow = document.createElement('div');
        authButtons.forEach(btn => {
            buttonRow.appendChild(btn);
        });
        elements.buttonGroup.insertBefore(buttonRow, elements.buttonGroup.firstChild);
    }
}

// 비회원으로 로그인 처리
function handleGuestLogin() {
    // 모든 저장소에서 사용자 정보 삭제
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // 헤더 업데이트를 위해 이벤트 발생
    window.dispatchEvent(new CustomEvent('userUpdated'));
    
    ToastUtils.success('비회원으로 로그인되었습니다.');
    
    // 게시글 목록 페이지로 이동
    navigateTo('/');
}

// 폼 유효성 검사 설정
function setupFormFields() {
    setupFormValidation('loginForm', [
        {
            id: 'email',
            validation: validateEmail,
            options: {
                successMessage: '유효한 이메일 주소입니다',
                defaultText: '이메일 주소를 입력해주세요'
            }
        },
        {
            id: 'password',
            validation: validatePassword,
            options: {
                successMessage: '유효한 비밀번호입니다',
                defaultText: '비밀번호를 입력해주세요',
                preventSpaces: true
            }
        }
    ]);
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
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
                            if (rememberMe) {
                                localStorage.setItem('user', JSON.stringify(user));
                                sessionStorage.removeItem('user');
                            } else {
                                sessionStorage.setItem('user', JSON.stringify(user));
                                localStorage.removeItem('user');
                            }
                            
                            ToastUtils.success('로그인되었습니다! 계정이 복구되었습니다.');
                            window.dispatchEvent(new CustomEvent('userUpdated'));
                            
                            const redirectPath = sessionStorage.getItem('redirectAfterLogin');
                            if (redirectPath) {
                                sessionStorage.removeItem('redirectAfterLogin');
                                navigateTo(redirectPath);
                            } else {
                                navigateTo('/');
                            }
                        } catch (error) {
                            ToastUtils.error(error.message || '계정 복구에 실패했습니다.');
                        }
                    };
                    
                    // 탈퇴 대기 중인 계정 복구 여부 확인 모달
                    const restoreModal = new Modal({
                        title: '계정 복구 안내',
                        subtitle: '현재 삭제 대기 상태인 계정입니다.',
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
                            ToastUtils.info('계정 복구를 취소했습니다.');
                        }
                    });
                    restoreModal.show();
                } else {
                    // 정상 로그인 처리
                    if (rememberMe) {
                        localStorage.setItem('user', JSON.stringify(user));
                        sessionStorage.removeItem('user');
                    } else {
                        sessionStorage.setItem('user', JSON.stringify(user));
                        localStorage.removeItem('user');
                    }
                    
                    ToastUtils.success('로그인되었습니다!');
                    window.dispatchEvent(new CustomEvent('userUpdated'));
                    
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
            const errorMessage = error.message || '로그인에 실패했습니다.';
            ToastUtils.error(errorMessage);
        } finally {
            // 로딩 상태 해제
            PageLayout.hideLoading(submitButton, '로그인');
        }
    };
});