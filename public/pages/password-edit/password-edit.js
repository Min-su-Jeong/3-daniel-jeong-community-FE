import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validatePassword, setupFormValidation } from '../../utils/common/validation.js';
import { getElementValue, initializeElements } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';

// DOM 요소들 초기화
let elements = {};

function initializePageElements() {
    const elementIds = {
        buttonGroup: 'buttonGroup',
        passwordEditForm: 'passwordEditForm',
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
        confirmPassword: 'confirmPassword'
    };
    
    elements = initializeElements(elementIds);
}

// 비밀번호수정 페이지 버튼 생성
function createPasswordEditButtons() {
    if (!elements.buttonGroup) return;
    
    elements.buttonGroup.innerHTML = '';
    
    const editButton = new Button({
        text: '수정하기',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    editButton.appendTo(elements.buttonGroup);
}

// 비밀번호 일치 확인
function checkPasswordMatch(password, confirmPassword) {
    if (!confirmPassword) return { match: false, text: '' };
    
    if (password === confirmPassword) {
        return { match: true, text: '비밀번호가 일치합니다' };
    } else {
        return { match: false, text: '비밀번호가 일치하지 않습니다' };
    }
}

// 비밀번호 확인 실시간 검사
function setupPasswordConfirmValidation() {
    if (!elements.newPassword || !elements.confirmPassword) return;
    
    const checkMatch = () => {
        const password = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;
        const matchInfo = checkPasswordMatch(password, confirmPassword);
        
        const helperText = elements.confirmPassword.nextElementSibling;
        if (helperText) {
            if (confirmPassword.length > 0) {
                helperText.textContent = matchInfo.text;
                helperText.className = `helper-text ${matchInfo.match ? 'success' : 'error'}`;
            } else {
                helperText.textContent = '';
                helperText.className = 'helper-text';
            }
        }
    };
    
    elements.newPassword.addEventListener('input', checkMatch);
    elements.confirmPassword.addEventListener('input', checkMatch);
}

// 폼 유효성 검사 설정
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
    
    // TODO: API 연결 시 현재 비밀번호 검증 추가
}

// 폼 제출 처리
function setupFormSubmission() {
    if (!elements.passwordEditForm) return;
    
    elements.passwordEditForm.onsubmit = async function(event) {
        event.preventDefault();

        const currentPassword = getElementValue(elements.currentPassword, '');
        const newPassword = getElementValue(elements.newPassword, '');
        const confirmPassword = getElementValue(elements.confirmPassword, '');
        
        // 비밀번호 일치 확인
        if (newPassword !== confirmPassword) {
            ToastUtils.error('새 비밀번호가 일치하지 않습니다.');
            return;
        }
        
        const submitButton = elements.buttonGroup.querySelector('.btn-primary');
        PageLayout.showLoading(submitButton, '수정 중...');
        
        try {
            // TODO: 비밀번호 수정 API 호출
            
            // 임시 성공 처리
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            ToastUtils.success('비밀번호가 수정되었습니다!');
            
            // 2초 후 이전 페이지로 이동
            setTimeout(() => {
                history.back();
            }, 2000);
            
        } catch (error) {
            ToastUtils.error('비밀번호 수정에 실패했습니다.');
        } finally {
            PageLayout.hideLoading(submitButton, '수정하기');
        }
    };
}

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    initializePageElements();
    createPasswordEditButtons();
    setupFormFields();
    setupPasswordConfirmValidation();
    setupFormSubmission();
});