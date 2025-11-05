import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { checkCurrentPassword } from '../../api/auth.js';
import { updatePassword } from '../../api/users.js';

const elements = initializeElements({
    buttonGroup: 'buttonGroup',
    passwordEditForm: 'passwordEditForm',
    currentPassword: 'currentPassword',
    newPassword: 'newPassword',
    confirmPassword: 'confirmPassword'
});

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
    
    if (!elements.currentPassword) return;
    const currentHelperText = elements.currentPassword.nextElementSibling;
    if (!currentHelperText) return;
    
    elements.currentPassword.addEventListener('blur', async () => {
        const password = elements.currentPassword.value.trim();
        if (!password) {
            elements.currentPassword.classList.remove('error', 'success');
            currentHelperText.classList.remove('error', 'success');
            currentHelperText.textContent = '';
            return;
        }
        
        const user = getUser();
        if (!user?.email) return;
        
        const result = await checkCurrentPassword(user.email, password);
        if (result.match === undefined) return;
        
        const isMatch = result.match;
        elements.currentPassword.classList.toggle('success', isMatch);
        elements.currentPassword.classList.toggle('error', !isMatch);
        currentHelperText.classList.toggle('success', isMatch);
        currentHelperText.classList.toggle('error', !isMatch);
        currentHelperText.textContent = isMatch 
            ? '현재 비밀번호가 일치합니다' 
            : '현재 비밀번호가 일치하지 않습니다';
    });
}

function setupFormSubmission() {
    if (!elements.passwordEditForm) return;
    
    elements.passwordEditForm.onsubmit = async function(event) {
        event.preventDefault();
        const currentPassword = getElementValue(elements.currentPassword, '');
        const newPassword = getElementValue(elements.newPassword, '');
        const confirmPassword = getElementValue(elements.confirmPassword, '');
        
        if (!currentPassword) {
            ToastUtils.error('현재 비밀번호를 입력해주세요.');
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
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            await updatePassword(user.id, currentPassword, newPassword);
            ToastUtils.success('비밀번호가 수정되었습니다!');
            navigateTo('/');
        } catch (error) {
            ToastUtils.error(error.message || '비밀번호 수정에 실패했습니다.');
        } finally {
            PageLayout.hideLoading(submitButton, '수정하기');
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