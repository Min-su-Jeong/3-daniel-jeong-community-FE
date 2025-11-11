import { PageLayout, Button, ToastUtils, createFormHandler, getFormValues } from '../../components/index.js';
import { validatePassword, setupFormValidation, getElementValue, initializeElements, navigateTo, debounce, getUserFromStorage } from '../../utils/common/index.js';
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
let isCurrentPasswordValid = false;

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
    
    // 현재 비밀번호 검증
    if (elements.currentPassword) {
        const currentPasswordHelper = elements.currentPassword.nextElementSibling;
        
        const verifyCurrentPasswordDebounced = debounce(async (password) => {
            if (!password || password.trim() === '') {
                if (currentPasswordHelper) {
                    currentPasswordHelper.textContent = '';
                    currentPasswordHelper.className = 'helper-text';
                }
                isCurrentPasswordValid = false;
                return;
            }
            
            const user = getUserFromStorage();
            if (!user?.email) {
                return;
            }
            
            if (isVerifyingPassword) return;
            isVerifyingPassword = true;
            
            try {
                const result = await checkCurrentPassword(user.email, password);
                if (result.match) {
                    if (currentPasswordHelper) {
                        currentPasswordHelper.textContent = '현재 비밀번호가 일치합니다';
                        currentPasswordHelper.className = 'helper-text success';
                    }
                    isCurrentPasswordValid = true;
                } else {
                    if (currentPasswordHelper) {
                        currentPasswordHelper.textContent = '현재 비밀번호가 일치하지 않습니다';
                        currentPasswordHelper.className = 'helper-text error';
                    }
                    isCurrentPasswordValid = false;
                }
            } catch (error) {
                if (currentPasswordHelper) {
                    currentPasswordHelper.textContent = '현재 비밀번호가 일치하지 않습니다';
                    currentPasswordHelper.className = 'helper-text error';
                }
                isCurrentPasswordValid = false;
            } finally {
                isVerifyingPassword = false;
            }
        }, 500);
        
        elements.currentPassword.addEventListener('blur', () => {
            const password = getElementValue(elements.currentPassword, '').trim();
            verifyCurrentPasswordDebounced(password);
        });
    }
    
    if (!elements.newPassword || !elements.confirmPassword) return;
    
    const updateConfirmHelper = () => {
        const helperText = elements.confirmPassword.nextElementSibling;
        if (!helperText) return;
        
        if (!elements.confirmPassword.value) {
            helperText.textContent = '';
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

function setupFormSubmission() {
    if (!elements.passwordEditForm) return;
    
    createFormHandler({
        form: elements.passwordEditForm,
        loadingText: '수정 중...',
        successMessage: TOAST_MESSAGE.PASSWORD_RESET_SUCCESS,
        submitButtonSelector: elements.buttonGroup?.querySelector('.btn-primary'),
        validate: () => {
            const formValues = getFormValues(elements.passwordEditForm, ['currentPassword', 'newPassword', 'confirmPassword']);
            const { currentPassword, newPassword, confirmPassword } = formValues;
        
            if (!currentPassword?.trim()) {
            ToastUtils.error(VALIDATION_MESSAGE.CURRENT_PASSWORD_REQUIRED);
                return false;
        }
        
        if (!isCurrentPasswordValid) {
            ToastUtils.error(VALIDATION_MESSAGE.CURRENT_PASSWORD_MISMATCH);
            elements.currentPassword.focus();
                return false;
        }
        
            if (!validatePassword(newPassword || '').isValid) {
            ToastUtils.error(VALIDATION_MESSAGE.NEW_PASSWORD_INVALID);
                return false;
        }
        
        if (newPassword !== confirmPassword) {
            ToastUtils.error(VALIDATION_MESSAGE.NEW_PASSWORD_MISMATCH);
                return false;
        }
        
            return true;
        },
        onSubmit: async (formData) => {
            const user = getUserFromStorage();
        if (!user?.id) {
                throw new Error(TOAST_MESSAGE.USER_LOAD_FAILED);
        }
        
            const newPassword = formData.newPassword?.trim() || '';
            const confirmPassword = formData.confirmPassword?.trim() || '';
            
            await updatePassword(user.id, newPassword, confirmPassword);
            return { success: true };
        },
        onSuccess: () => {
            navigateTo('/');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    
    // 버튼 생성
    if (elements.buttonGroup) {
        Button.clearGroup(elements.buttonGroup);
        Button.create(elements.buttonGroup, {
            text: '수정하기',
            type: 'submit',
            variant: 'primary',
            size: 'medium'
        });
    }
    
    setupFormFields();
    setupFormSubmission();
});