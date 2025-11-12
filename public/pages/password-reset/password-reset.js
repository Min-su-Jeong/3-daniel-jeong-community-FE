import { PageLayout, Button, ToastUtils } from '../../components/index.js';
import { validateEmail, validatePassword, setupFormValidation, getElementValue, initializeElements, navigateTo } from '../../utils/common/index.js';
import { sendPasswordResetCode, verifyPasswordResetCode, resetPasswordById, checkEmail } from '../../api/index.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

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
    
    Button.clearGroup(container);
    Button.create(container, {
        text,
        type: buttonType,
        variant: 'primary',
        size: 'medium'
    });
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
        ToastUtils.error(TOAST_MESSAGE.EMAIL_INVALID_FORMAT);
        return;
    }
    if (isSendingCode) return;
    
    try {
        const emailCheckResponse = await checkEmail(email);
        if (emailCheckResponse?.data?.available) {
            ToastUtils.error(TOAST_MESSAGE.EMAIL_NOT_FOUND);
            return;
        }
        
        const emailSubmitButton = elements.emailButtonGroup?.querySelector('.btn-primary');
        const restore = disableControls([elements.email, emailSubmitButton]);
        const loadingToast = ToastUtils.info(TOAST_MESSAGE.VERIFICATION_CODE_SENDING, '인증번호 발송 중', { duration: 0 });
        isSendingCode = true;
        
        try {
            const response = await sendPasswordResetCode(email);
            userId = response.data;
            loadingToast.hide();
            ToastUtils.success(TOAST_MESSAGE.VERIFICATION_CODE_SENT, '인증번호 발송 완료');
            showStep(2);
            createButton('verificationButtonGroup', '인증번호 확인');
            elements.verificationCode.value = '';
            isVerified = false;
            updateVerificationStatus(false);
            setupVerificationCodeInput();
            setTimeout(() => setupVerificationButton(), 100);
        } catch (error) {
            loadingToast.hide();
            ToastUtils.error(error.message || TOAST_MESSAGE.VERIFICATION_CODE_SEND_FAILED);
        } finally {
            restore();
            isSendingCode = false;
        }
    } catch (error) {
        ToastUtils.error(error.message || TOAST_MESSAGE.GENERIC_ERROR);
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
            ToastUtils.error(TOAST_MESSAGE.VERIFICATION_CODE_REQUIRED);
            return;
        }
        
        if (code.length !== 6 || !/^\d+$/.test(code)) {
            ToastUtils.error(TOAST_MESSAGE.VERIFICATION_CODE_INVALID);
            return;
        }
        
        if (!userId) {
            ToastUtils.error(TOAST_MESSAGE.USER_LOAD_FAILED);
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
            ToastUtils.success(TOAST_MESSAGE.VERIFICATION_CODE_VERIFIED);
            showStep(3);
            createButton('resetButtonGroup', '비밀번호 재설정');
            setupPasswordValidation();
        } catch (error) {
            ToastUtils.error(error.message || TOAST_MESSAGE.VERIFICATION_CODE_MISMATCH);
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
        ToastUtils.error(TOAST_MESSAGE.VERIFICATION_REQUIRED);
        showStep(2);
        return;
    }
    
    const newPassword = getElementValue(elements.newPassword, '').trim();
    const confirmPassword = getElementValue(elements.confirmPassword, '').trim();
    
    if (!validatePassword(newPassword).isValid) {
        ToastUtils.error(VALIDATION_MESSAGE.NEW_PASSWORD_INVALID);
        return;
    }
    
    if (newPassword !== confirmPassword) {
        ToastUtils.error(TOAST_MESSAGE.PASSWORD_MISMATCH);
        return;
    }
    
    if (!userId) {
        ToastUtils.error(TOAST_MESSAGE.RETRY_REQUIRED);
        showStep(1);
        return;
    }
    
    const resetButton = elements.resetButtonGroup?.querySelector('.btn-primary');
    const restore = disableControls([elements.newPassword, elements.confirmPassword, resetButton]);
    isResettingPassword = true;

    try {
        const response = await resetPasswordById(userId, newPassword, confirmPassword);
        ToastUtils.success(TOAST_MESSAGE.PASSWORD_RESET_SUCCESS);
        setTimeout(() => { navigateTo('/login'); }, 1200);
    } catch (error) {
        ToastUtils.error(error.message || TOAST_MESSAGE.PASSWORD_RESET_FAILED);
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
