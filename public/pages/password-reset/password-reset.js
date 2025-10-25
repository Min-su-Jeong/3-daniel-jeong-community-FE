import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateEmail, validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';

// DOM 요소 초기화
const elements = initializeElements({
    emailButtonGroup: 'emailButtonGroup',
    verificationButtonGroup: 'verificationButtonGroup', 
    passwordButtonGroup: 'passwordButtonGroup',
    emailForm: 'emailForm',
    verificationForm: 'verificationForm',
    passwordForm: 'passwordForm',
    email: 'email',
    verificationCode: 'verificationCode',
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword',
    pageTitle: 'pageTitle',
    passwordSubtitle: 'passwordSubtitle'
});

const TEMP_CODE = '1234';

// 버튼 생성 및 단계별 설정
function createButton(containerId, text) {
    const container = elements[containerId];
    if (!container) return;
    
    container.innerHTML = '';
    new Button({ text, type: 'submit', variant: 'primary', size: 'medium' }).appendTo(container);
}

// 단계별 UI 전환
function showStep(step) {
    // 모든 폼 숨기기
    [elements.emailForm, elements.verificationForm, elements.passwordForm].forEach(form => {
        form.style.display = 'none';
    });
    elements.passwordSubtitle.style.display = 'none';
    
    const stepConfig = {
        1: { form: elements.emailForm, title: '비밀번호 찾기' },
        2: { form: elements.verificationForm, title: '인증번호 확인' },
        3: { form: elements.passwordForm, title: '비밀번호 재설정', showSubtitle: true }
    };
    
    const config = stepConfig[step];
    if (config) {
        config.form.style.display = 'block';
        elements.pageTitle.textContent = config.title;
        if (config.showSubtitle) {
            elements.passwordSubtitle.style.display = 'block';
        }
    }
}

// 비밀번호 실시간 유효성 검사 설정
function setupPasswordValidation() {
    setupFormValidation('passwordForm', [
        {
            id: 'newPassword',
            validation: validatePassword,
            options: {
                successMessage: '사용 가능한 비밀번호입니다',
                defaultText: '비밀번호를 입력해주세요'
            }
        },
        {
            id: 'confirmPassword',
            validation: (value) => {
                const newPassword = getElementValue(elements.newPassword, '');
                if (!value) return { isValid: false, message: '비밀번호 확인을 입력해주세요' };
                if (value !== newPassword) return { isValid: false, message: '비밀번호가 일치하지 않습니다' };
                return { isValid: true, message: '비밀번호가 일치합니다' };
            },
            options: {
                successMessage: '비밀번호가 일치합니다',
                defaultText: '비밀번호 확인을 입력해주세요'
            }
        }
    ]);
}

// 폼 제출 처리
function setupSubmissions() {
    // 1단계: 이메일 검증 및 인증번호 발송
    elements.emailForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = getElementValue(elements.email, '');
        
        if (!validateEmail(email)) {
            ToastUtils.error('올바른 이메일 주소를 입력해주세요.');
            return;
        }
        
        ToastUtils.success('인증번호를 이메일로 발송했습니다.');
        showStep(2);
        createButton('verificationButtonGroup', '인증번호 확인');
    };
    
    // 2단계: 인증번호 확인
    elements.verificationForm.onsubmit = async (e) => {
        e.preventDefault();
        const code = getElementValue(elements.verificationCode, '');
        
        if (code === TEMP_CODE) {
            ToastUtils.success('인증번호가 확인되었습니다.');
            showStep(3);
            createButton('passwordButtonGroup', '비밀번호 재설정');
            setTimeout(() => setupPasswordValidation(), 100);
        } else {
            ToastUtils.error('인증번호가 올바르지 않습니다.');
        }
    };
    
    // 3단계: 비밀번호 재설정
    elements.passwordForm.onsubmit = async (e) => {
        e.preventDefault();
        const newPassword = getElementValue(elements.newPassword, '');
        const confirmPassword = getElementValue(elements.confirmPassword, '');
        
        if (!validatePassword(newPassword).isValid) {
            ToastUtils.error('올바른 비밀번호를 입력해주세요.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            ToastUtils.error('비밀번호가 일치하지 않습니다.');
            return;
        }
        
        ToastUtils.success('비밀번호가 성공적으로 변경되었습니다.');
        setTimeout(() => navigateTo('/login'), 2000);
    };
}

// 페이지 초기화
function init() {
    PageLayout.initializePage();
    createButton('emailButtonGroup', '비밀번호 찾기');
    setupSubmissions();
    showStep(1);
}

document.addEventListener('DOMContentLoaded', init);
