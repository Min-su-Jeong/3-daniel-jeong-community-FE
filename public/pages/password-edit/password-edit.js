import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { updatePassword } from '../../api/users.js';
import { checkCurrentPassword } from '../../api/auth.js';
import { debounce } from '../../utils/common/debounce-helper.js';

const elements = initializeElements({
    buttonGroup: 'buttonGroup',
    passwordEditForm: 'passwordEditForm',
    currentPassword: 'currentPassword',
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword'
});

let isSubmitting = false;
let isVerifyingPassword = false;
let isCurrentPasswordValid = false;

function getUser() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

function setupFormFields() {
    setupFormValidation('passwordEditForm', [
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
            
            const user = getUser();
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
    
    elements.passwordEditForm.onsubmit = async function(event) {
        event.preventDefault();
        if (isSubmitting) return;

        const currentPassword = getElementValue(elements.currentPassword, '').trim();
        const newPassword = getElementValue(elements.newPassword, '').trim();
        const confirmPassword = getElementValue(elements.confirmPassword, '').trim();
        
        if (!currentPassword) {
            ToastUtils.error('현재 비밀번호를 입력해주세요.');
            return;
        }
        
        if (!isCurrentPasswordValid) {
            ToastUtils.error('현재 비밀번호가 일치하지 않습니다.');
            elements.currentPassword.focus();
            return;
        }
        
        if (!validatePassword(newPassword).isValid) {
            ToastUtils.error('올바른 비밀번호를 입력해주세요.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            ToastUtils.error('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        const user = getUser();
        if (!user?.id) {
            ToastUtils.error('사용자 정보를 불러올 수 없습니다.');
            return;
        }
        
        const submitButton = elements.buttonGroup?.querySelector('.btn-primary');
        const inputsToDisable = [elements.currentPassword, elements.newPassword, elements.confirmPassword];
        inputsToDisable.forEach((el) => el && (el.disabled = true));
        isSubmitting = true;
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            await updatePassword(user.id, newPassword, confirmPassword);
            ToastUtils.success('비밀번호가 수정이 완료되었습니다.');
            navigateTo('/');
        } catch (error) {
            ToastUtils.error(error.message || '비밀번호 수정에 실패했습니다.');
        } finally {
            PageLayout.hideLoading(submitButton, '수정하기');
            inputsToDisable.forEach((el) => el && (el.disabled = false));
            isSubmitting = false;
        }
    };
}

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    if (elements.buttonGroup) {
        elements.buttonGroup.innerHTML = '';
        new Button({ text: '수정하기', type: 'submit', variant: 'primary', size: 'medium' })
            .appendTo(elements.buttonGroup);
    }
    setupFormFields();
    setupFormSubmission();
});