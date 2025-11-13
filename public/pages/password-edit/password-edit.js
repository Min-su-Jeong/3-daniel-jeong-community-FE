import { PageLayout, Button, Toast, createFormHandler } from '../../components/index.js';
import { validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements } from '../../utils/common/element.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { debounce } from '../../utils/common/debounce-helper.js';
import { getUserFromStorage } from '../../utils/common/user.js';
import { updatePassword, checkCurrentPassword } from '../../api/index.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

const elements = initializeElements({
    buttonGroup: 'buttonGroup',
    passwordEditForm: 'passwordEditForm',
    currentPassword: 'currentPassword',
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword'
});

let isVerifyingPassword = false;

// 현재 비밀번호 검증 (API 호출)
async function verifyCurrentPassword(password) {
    if (!password?.trim()) return false;
    
    const user = getUserFromStorage();
    if (!user?.email) return false;
    
    if (isVerifyingPassword) return false;
    isVerifyingPassword = true;
    
    try {
        const result = await checkCurrentPassword(user.email, password.trim());
        return result.match;
    } catch (error) {
        return false;
    } finally {
        isVerifyingPassword = false;
    }
}

// Helper 텍스트 업데이트
function updateHelperText(helper, text, className) {
    if (!helper) return;
    helper.textContent = text;
    helper.className = `helper-text ${className}`;
}

// 현재 비밀번호 UI 업데이트
function updateCurrentPasswordUI(isValid) {
    const helper = elements.currentPassword?.nextElementSibling;
    const message = isValid ? '현재 비밀번호가 일치합니다' : '현재 비밀번호가 일치하지 않습니다';
    const className = isValid ? 'success' : 'error';
    updateHelperText(helper, message, className);
}

// 현재 비밀번호 실시간 검증 설정
function setupCurrentPasswordValidation() {
    if (!elements.currentPassword) return;
    
    const verifyDebounced = debounce(async (password) => {
        const helper = elements.currentPassword.nextElementSibling;
        
        if (!password?.trim()) {
            updateHelperText(helper, '', '');
            return;
        }
        
        const isValid = await verifyCurrentPassword(password);
        updateCurrentPasswordUI(isValid);
    }, 500);
    
    elements.currentPassword.addEventListener('blur', () => {
        const password = getElementValue(elements.currentPassword, '');
        verifyDebounced(password);
    });
}

// 새 비밀번호 확인 UI 업데이트
function updateConfirmPasswordUI() {
    const helper = elements.confirmPassword?.nextElementSibling;
    if (!helper) return;
    
    const confirmValue = elements.confirmPassword.value;
    if (!confirmValue) {
        updateHelperText(helper, '', '');
        return;
    }
    
    const isMatch = elements.newPassword.value === confirmValue;
    const message = isMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다';
    const className = isMatch ? 'success' : 'error';
    updateHelperText(helper, message, className);
}

// 폼 필드 설정
function setupFormFields() {
    setupFormValidation('passwordEditForm', [
        {
            id: 'newPassword',
            validation: validatePassword,
            options: {
                successMessage: VALIDATION_MESSAGE.PASSWORD_VALID,
                defaultText: '',
                minLength: 8,
                maxLength: 50
            }
        }
    ]);
    
    setupCurrentPasswordValidation();
    
    if (elements.newPassword && elements.confirmPassword) {
        elements.newPassword.addEventListener('input', updateConfirmPasswordUI);
        elements.confirmPassword.addEventListener('input', updateConfirmPasswordUI);
    }
}

// 폼 데이터 검증
async function validateFormData() {
    const currentPassword = getElementValue(elements.currentPassword, '').trim();
    const newPassword = getElementValue(elements.newPassword, '').trim();
    const confirmPassword = getElementValue(elements.confirmPassword, '').trim();
    
    const validations = [
        { 
            condition: !currentPassword, 
            error: VALIDATION_MESSAGE.CURRENT_PASSWORD_REQUIRED 
        },
        { 
            condition: !newPassword, 
            error: VALIDATION_MESSAGE.NEW_PASSWORD_REQUIRED 
        },
        { 
            condition: !confirmPassword, 
            error: VALIDATION_MESSAGE.NEW_PASSWORD_CONFIRM_REQUIRED 
        }
    ];
    
    for (const { condition, error } of validations) {
        if (condition) {
            Toast.error(error);
            return false;
        }
    }
    
    const isCurrentValid = await verifyCurrentPassword(currentPassword);
    if (!isCurrentValid) {
        Toast.error(VALIDATION_MESSAGE.CURRENT_PASSWORD_MISMATCH);
        elements.currentPassword?.focus();
        return false;
    }
    
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        Toast.error(VALIDATION_MESSAGE.NEW_PASSWORD_INVALID);
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        Toast.error(VALIDATION_MESSAGE.NEW_PASSWORD_MISMATCH);
        return false;
    }
    
    if (currentPassword === newPassword) {
        Toast.error(VALIDATION_MESSAGE.NEW_PASSWORD_SAME_AS_CURRENT);
        return false;
    }
    
    return true;
}

// 비밀번호 변경 처리
async function handlePasswordUpdate() {
    const user = getUserFromStorage();
    if (!user?.id) {
        throw new Error(TOAST_MESSAGE.USER_LOAD_FAILED);
    }
    
    const newPassword = getElementValue(elements.newPassword, '').trim();
    const confirmPassword = getElementValue(elements.confirmPassword, '').trim();
    
    await updatePassword(user.id, newPassword, confirmPassword);
    return { success: true };
}

// 폼 제출 설정
function setupFormSubmission() {
    if (!elements.passwordEditForm) return;
    
    createFormHandler({
        form: elements.passwordEditForm,
        loadingText: '수정 중...',
        successMessage: TOAST_MESSAGE.PASSWORD_RESET_SUCCESS,
        submitButtonSelector: elements.buttonGroup?.querySelector('.btn-primary'),
        validate: async () => await validateFormData(),
        onSubmit: handlePasswordUpdate,
        onSuccess: () => navigateTo('/')
    });
}

// 버튼 생성
function createPasswordEditButton() {
    if (!elements.buttonGroup) return;
    
    Button.clearGroup(elements.buttonGroup);
    Button.create(elements.buttonGroup, {
        text: '수정하기',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
}

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    createPasswordEditButton();
    setupFormFields();
    setupFormSubmission();
});
