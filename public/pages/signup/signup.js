// API 함수들 import
import { signup } from '../../api/signup.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateEmail, validatePassword, validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, setElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';

// 회원가입 버튼 컴포넌트 생성
function createSignupButtons() {
    const elements = initializeElements({
        buttonGroup: 'buttonGroup'
    });
    if (!elements.buttonGroup) return;
    
    // 기존 버튼 제거
    elements.buttonGroup.innerHTML = '';
    
    // 회원가입 버튼
    const signupButton = new Button({
        text: '회원가입',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    // 로그인 버튼
    const loginButton = new Button({
        text: '로그인하러 가기',
        type: 'button',
        variant: 'secondary',
        size: 'medium',
        onClick: () => {
            navigateTo('/login');
        }
    });
    
    // 버튼들을 컨테이너에 추가
    signupButton.appendTo(elements.buttonGroup);
    loginButton.appendTo(elements.buttonGroup);
}

// 회원가입 폼 필드 유효성 검사 설정
function setupSignupFormFields() {
    setupFormValidation('signupForm', [
        {
            id: 'email',
            validation: validateEmail,
            options: {
                successMessage: '유효한 이메일 주소입니다',
                defaultText: '이메일 주소를 정확히 입력해주세요'
            }
        },
        {
            id: 'password',
            validation: validatePassword,
            options: {
                successMessage: '유효한 비밀번호입니다',
                defaultText: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요',
                preventSpaces: true
            }
        },
        {
            id: 'confirmPassword',
            validation: (value) => {
                const password = getElementValue(document.getElementById('password'), '');
                const isValid = value === password && value.length > 0;
                return {
                    isValid,
                    message: isValid ? '' : '비밀번호가 일치하지 않습니다'
                };
            },
            options: {
                successMessage: '비밀번호가 일치합니다',
                defaultText: '비밀번호를 다시 한번 입력해주세요',
                preventSpaces: true
            }
        },
        {
            id: 'nickname',
            validation: validateNickname,
            options: {
                successMessage: '유효한 닉네임입니다',
                defaultText: '2-10자 사이로 입력해주세요',
                preventSpaces: true,
                preventEmojis: true,
                allowedChars: /[가-힣a-zA-Z0-9_]/
            }
        }
    ]);
    
    // 비밀번호 변경 시 비밀번호 확인 유효성 검사
    const passwordElements = initializeElements({
        password: 'password',
        confirmPassword: 'confirmPassword'
    });
    if (passwordElements.password && passwordElements.confirmPassword) {
        passwordElements.password.addEventListener('input', () => {
            if (passwordElements.confirmPassword.value.trim() !== '') {
                passwordElements.confirmPassword.dispatchEvent(new Event('input'));
            }
        });
    }
}


// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
    // 공통 페이지 초기화
    PageLayout.initializePage();
    
    // 회원가입 버튼 컴포넌트 생성
    createSignupButtons();
    
    // 회원가입 폼 필드 유효성 검사 설정
    setupSignupFormFields();
    
    // DOM 요소 초기화
    const elements = initializeElements({
        profileImage: 'profileImage',
        profileInput: 'profileInput',
        signupForm: 'signupForm'
    });
    
    // 프로필 이미지 선택 이벤트 설정
    
    if (elements.profileImage && elements.profileInput) {
        elements.profileImage.onclick = function() {
            elements.profileInput.click();
        };

        // 프로필 이미지 선택 시 미리보기
        elements.profileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    elements.profileImage.innerHTML = 
                        '<img src="' + e.target.result + '" alt="프로필 이미지">';
                };
                reader.readAsDataURL(file);
            }
        };
    }

    // 회원가입 폼 제출 처리
    if (!elements.signupForm) return;
    
    elements.signupForm.onsubmit = async function(event) {
        event.preventDefault(); // 기본 제출 방지

        const formElements = initializeElements({
            email: 'email',
            password: 'password',
            confirmPassword: 'confirmPassword',
            nickname: 'nickname'
        });
        
        const email = getElementValue(formElements.email, '');
        const password = getElementValue(formElements.password, '');
        const confirmPassword = getElementValue(formElements.confirmPassword, '');
        const nickname = getElementValue(formElements.nickname, '');
        const profileImage = elements.profileInput?.files[0];
        
        // 로딩 상태 표시 (회원가입 버튼)
        const submitButton = elements.buttonGroup?.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '처리중...');

        try {
            // API 호출로 회원가입 처리
            console.log('회원가입 시도:', { email, password, nickname, profileImage });
            const response = await signup({ email, password, nickname, profileImage });
            
            console.log('회원가입 성공:', response);
            PageLayout.showSuccess('회원가입이 완료되었습니다!');
            navigateTo('/login');
            
        } catch (error) {
            // 에러 처리 (회원가입 실패 시 처리)
            PageLayout.handleError(error, '회원가입에 실패했습니다.');
        } finally {
            // 로딩 상태 해제 (회원가입 버튼)
            PageLayout.hideLoading(submitButton, '회원가입');
        }
    };
});