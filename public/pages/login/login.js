import { login } from '../../api/login.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateEmail, validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';

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
            console.log('로그인 시도:', { email, password, rememberMe });
            const response = await login({ email, password, rememberMe });
            
            console.log('로그인 성공:', response);
            PageLayout.showSuccess('로그인되었습니다!');
            navigateTo('/');
            
        } catch (error) {
            PageLayout.handleError(error, '로그인에 실패했습니다.');
        } finally {
            // 로딩 상태 해제
            PageLayout.hideLoading(submitButton, '로그인');
        }
    };
});