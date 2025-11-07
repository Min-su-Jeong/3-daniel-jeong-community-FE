import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateEmail, validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { sendPasswordResetCode, verifyPasswordResetCode, resetPasswordById } from '../../api/auth.js';
import { checkEmail } from '../../api/users.js';

const elements = initializeElements({
    emailButtonGroup: 'emailButtonGroup',
    verificationButtonGroup: 'verificationButtonGroup',
    resetButtonGroup: 'resetButtonGroup',
    emailForm: 'emailForm',
    verificationForm: 'verificationForm',
    passwordForm: 'passwordForm',
    email: 'email',
    verificationCode: 'verificationCode',
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword',
    pageTitle: 'pageTitle',
    passwordSubtitle: 'passwordSubtitle',
    verificationStatus: 'verificationStatus'
});

let userId = null;
let verificationCode = '';
let isVerified = false;
let isSendingCode = false;
let isVerifyingCode = false;
let isResettingPassword = false;

function disableControls(controls = []) {
    const prev = controls.map((el) => el?.disabled);
    controls.forEach((el) => el && (el.disabled = true));
    return () => controls.forEach((el, i) => el && (el.disabled = !!prev[i]));
}

function createButton(containerId, text, buttonType = 'submit') {
    const container = elements[containerId];
    if (!container) return;
    container.innerHTML = '';
    new Button({ text, type: buttonType, variant: 'primary', size: 'medium' }).appendTo(container);
}

function showStep(step) {
    [elements.emailForm, elements.verificationForm, elements.passwordForm].forEach(form => form.style.display = 'none');
    elements.passwordSubtitle.style.display = 'none';
    
    const config = {
        1: { form: elements.emailForm, title: '비밀번호 찾기' },
        2: { form: elements.verificationForm, title: '인증번호 확인' },
        3: { form: elements.passwordForm, title: '비밀번호 재설정', showSubtitle: true }
    }[step];
    
    if (config) {
        config.form.style.display = 'block';
        elements.pageTitle.textContent = config.title;
        if (config.showSubtitle) elements.passwordSubtitle.style.display = 'block';
    }
}

function setupVerificationCodeInput() {
    if (elements.verificationCode) {
        elements.verificationCode.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
        });
    }
}

function setupPasswordValidation() {
    setupFormValidation('passwordForm', [
        {
            id: 'newPassword',
            validation: validatePassword,
            options: {
                successMessage: '사용 가능한 비밀번호입니다',
                defaultText: '',
                minLength: 8,
                maxLength: 50
            }
        }
    ]);
    
    // 비밀번호 확인 실시간 검증
    if (!elements.newPassword || !elements.confirmPassword) return;
    
    const updateConfirmHelper = () => {
        const helperText = elements.confirmPassword.nextElementSibling;
        if (!helperText) return;
        
        if (!elements.confirmPassword.value) {
            helperText.textContent = '비밀번호를 다시 한번 입력해주세요';
            helperText.className = 'helper-text';
            return;
        }
        
        const isMatch = elements.newPassword.value === elements.confirmPassword.value;
        helperText.textContent = isMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다';
        helperText.className = `helper-text ${isMatch ? 'success' : 'error'}`;
    };
    
    elements.newPassword.addEventListener('input', updateConfirmHelper);
    elements.confirmPassword.addEventListener('input', updateConfirmHelper);
}

function updateVerificationStatus(verified) {
    if (!elements.verificationStatus) return;
    
    if (verified) {
        elements.verificationStatus.textContent = '✓ 인증 완료';
        elements.verificationStatus.style.color = '#10b981';
    } else {
        elements.verificationStatus.textContent = '';
    }
}

elements.emailForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = getElementValue(elements.email, '').trim();
    
    if (!validateEmail(email)) {
        ToastUtils.error('올바른 이메일 주소를 입력해주세요.');
        return;
    }
    if (isSendingCode) return;
    
    try {
        const emailCheckResponse = await checkEmail(email);
        if (emailCheckResponse?.data?.available) {
            ToastUtils.error('가입되지 않은 이메일입니다.');
            return;
        }
        
        const emailSubmitButton = elements.emailButtonGroup?.querySelector('.btn-primary');
        const restore = disableControls([elements.email, emailSubmitButton]);
        const loadingToast = ToastUtils.info('인증번호 발송 중입니다. 잠시만 기다려 주십시오.', '인증번호 발송 중', { duration: 0 });
        isSendingCode = true;
        
        try {
            const response = await sendPasswordResetCode(email);
            userId = response.data;
            loadingToast.hide();
            ToastUtils.success('인증번호가 발송되었습니다.', '인증번호 발송 완료');
            showStep(2);
            createButton('verificationButtonGroup', '인증번호 확인');
            elements.verificationCode.value = '';
            isVerified = false;
            updateVerificationStatus(false);
            setupVerificationCodeInput();
            setTimeout(() => setupVerificationButton(), 100);
        } catch (error) {
            loadingToast.hide();
            ToastUtils.error(error.message || '인증번호 발송 중 오류가 발생했습니다.');
        } finally {
            restore();
            isSendingCode = false;
        }
    } catch (error) {
        ToastUtils.error(error.message || '처리 중 오류가 발생했습니다.');
    }
};

// 인증번호 검증 버튼 클릭 핸들러
function setupVerificationButton() {
    const verifyButton = elements.verificationButtonGroup?.querySelector('.btn-primary');
    if (!verifyButton) return;
    
    verifyButton.onclick = async (e) => {
        e.preventDefault();
        if (isVerifyingCode || isVerified) return;
        
        const code = getElementValue(elements.verificationCode, '').trim();
        
        if (!code) {
            ToastUtils.error('인증번호를 입력해주세요.');
            return;
        }
        
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            ToastUtils.error('6자리 숫자 인증번호를 입력해주세요.');
            return;
        }
        
        if (!userId) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            showStep(1);
            return;
        }
        
        const restore = disableControls([elements.verificationCode, verifyButton]);
        isVerifyingCode = true;
        
        try {
            await verifyPasswordResetCode(userId, code);
            verificationCode = code;
            isVerified = true;
            updateVerificationStatus(true);
            verifyButton.disabled = true;
            elements.verificationCode.disabled = true;
            ToastUtils.success('인증번호가 확인되었습니다. 새 비밀번호를 입력해주세요.');
            showStep(3);
            createButton('resetButtonGroup', '비밀번호 재설정');
            setupPasswordValidation();
        } catch (error) {
            ToastUtils.error(error.message || '인증번호가 일치하지 않습니다.');
        } finally {
            restore();
            isVerifyingCode = false;
        }
    };
}

elements.verificationForm.onsubmit = async (e) => {
    e.preventDefault();
    // 폼 제출은 인증 버튼 클릭으로 처리
    const verifyButton = elements.verificationButtonGroup?.querySelector('.btn-primary');
    if (verifyButton && !isVerified) {
        verifyButton.click();
    }
};

elements.passwordForm.onsubmit = async (e) => {
    e.preventDefault();
    if (isResettingPassword) return;
    
    if (!isVerified) {
        ToastUtils.error('인증번호를 먼저 확인해주세요.');
        showStep(2);
        return;
    }
    
    const newPassword = getElementValue(elements.newPassword, '').trim();
    const confirmPassword = getElementValue(elements.confirmPassword, '').trim();
    
    if (!validatePassword(newPassword).isValid) {
        ToastUtils.error('올바른 비밀번호를 입력해주세요.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        ToastUtils.error('비밀번호가 일치하지 않습니다.');
        return;
    }
    
    if (!userId) {
        ToastUtils.error('처음부터 다시 시도해주세요.');
        showStep(1);
        return;
    }
    
    const resetButton = elements.resetButtonGroup?.querySelector('.btn-primary');
    const restore = disableControls([elements.newPassword, elements.confirmPassword, resetButton]);
    isResettingPassword = true;

    try {
        const response = await resetPasswordById(userId, newPassword, confirmPassword);
        ToastUtils.success('비밀번호가 성공적으로 변경되었습니다.');
        setTimeout(() => { navigateTo('/login'); }, 1200);
    } catch (error) {
        ToastUtils.error(error.message || '비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
        restore();
        isResettingPassword = false;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    PageLayout.initializePage();
    createButton('emailButtonGroup', '비밀번호 찾기');
    showStep(1);
});
