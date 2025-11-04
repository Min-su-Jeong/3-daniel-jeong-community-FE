/**
 * 공통 유효성 검사 유틸리티
 */

export function validateEmail(email) {
    if (email.length === 0) return { isValid: true, message: '' };
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{1,}$/;

    const isValid = emailRegex.test(email);
    
    return {
        isValid,
        message: isValid ? '' : '올바른 이메일 형식이 아닙니다'
    };
}

export function validatePassword(password) {
    if (password.length === 0) return { isValid: true, message: '' };
    
    if (password.length < 8) return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다' };
    if (password.includes(' ')) return { isValid: false, message: '비밀번호에 공백을 사용할 수 없습니다' };
    if (/(.)\1{2,}/.test(password)) return { isValid: false, message: '같은 문자를 3개 이상 연속으로 사용할 수 없습니다' };
    
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
        const missing = [];
        if (!hasLetter) missing.push('영문');
        if (!hasNumber) missing.push('숫자');
        if (!hasSpecial) missing.push('특수문자');
        return { isValid: false, message: `${missing.join(', ')}가 필요합니다` };
    }
    
    return { isValid: true, message: '' };
}

export function validateNickname(nickname) {
    if (nickname.length === 0) return { isValid: false, message: '닉네임을 입력해주세요' };
    
    if (nickname.length < 2) return { isValid: false, message: '닉네임은 2자 이상이어야 합니다' };
    if (nickname.length > 10) return { isValid: false, message: '닉네임은 10자 이하여야 합니다' };
    if (nickname.includes(' ')) return { isValid: false, message: '띄어쓰기는 사용할 수 없습니다' };
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) return { isValid: false, message: '한글, 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다' };
    if (/_{2,}/.test(nickname)) return { isValid: false, message: '연속된 언더스코어는 사용할 수 없습니다' };
    if (/^[0-9]+$/.test(nickname)) return { isValid: false, message: '숫자만으로는 닉네임을 만들 수 없습니다' };
    if (nickname.startsWith('_') || nickname.endsWith('_')) return { isValid: false, message: '언더스코어로 시작하거나 끝날 수 없습니다' };
    
    return { isValid: true, message: '' };
}

export function validateTitle(title) {
    if (title.length === 0) return { isValid: true, message: '' };
    if (title.length > 26) return { isValid: false, message: '제목은 26자 이하여야 합니다' };

    return { isValid: true, message: '' };
}


export function updateFieldValidation(input, helperText, isValid, errorMessage, successMessage) {
    input.classList.remove('success', 'error', 'warning');
    helperText.classList.remove('success', 'error', 'warning');

    if (input.value.trim() === '') {
        input.style.borderColor = '';
        input.style.background = '';
        helperText.style.color = '';
        helperText.textContent = helperText.dataset.defaultText || '';
    } else if (isValid) {
        input.classList.add('success');
        helperText.classList.add('success');
        helperText.textContent = successMessage;
    } else {
        input.classList.add('error');
        helperText.classList.add('error');
        helperText.textContent = errorMessage;
    }
}

// 폼 설정 함수
export function setupFormValidation(formId, fields) {
    const form = document.getElementById(formId);
    const submitButton = form?.querySelector('.btn-primary');
    
    if (!form || !submitButton) return;
    
    // 초기 상태
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';
    
    // 각 필드 설정
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const helperText = input?.nextElementSibling;
        if (!input || !helperText) return;
        
        const { successMessage = '유효한 값입니다', defaultText = '', preventSpaces = false, preventEmojis = false, allowedChars = null } = field.options || {};
        
        if (defaultText) helperText.dataset.defaultText = defaultText;
        
        // 입력 제한
        if (preventSpaces) input.addEventListener('keypress', (e) => e.key === ' ' && e.preventDefault());
        if (preventEmojis) {
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
            input.addEventListener('keypress', (e) => emojiRegex.test(e.key) && e.preventDefault());
        }
        if (allowedChars) input.addEventListener('keypress', (e) => !allowedChars.test(e.key) && e.preventDefault());
        
        // 붙여넣기 처리
        input.addEventListener('paste', (e) => {
            if (preventSpaces || preventEmojis || allowedChars) {
                e.preventDefault();
                let pastedText = (e.clipboardData || window.clipboardData).getData('text');
                if (preventSpaces) pastedText = pastedText.replace(/\s/g, '');
                if (preventEmojis) {
                    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
                    pastedText = pastedText.replace(emojiRegex, '');
                }
                if (allowedChars) pastedText = pastedText.replace(new RegExp(`[^${allowedChars.source}]`, 'g'), '');
                
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const currentValue = input.value;
                const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
                input.value = newValue;
                input.setSelectionRange(start + pastedText.length, start + pastedText.length);
                input.dispatchEvent(new Event('input'));
            }
        });
        
        // 실시간 검증
        input.addEventListener('input', () => {
            const validation = field.validation(input.value);
            updateFieldValidation(input, helperText, validation.isValid, validation.message, successMessage);
        });
        
        input.addEventListener('blur', () => {
            if (input.value.trim() === '') {
                updateFieldValidation(input, helperText, true, '', '');
            }
        });
    });
    
    // 폼 유효성 체크
    function checkFormValidity() {
        let allValid = fields.every(field => {
            const input = document.getElementById(field.id);
            if (!input) return false;
            const validation = field.validation(input.value);
            return validation.isValid && input.value.trim() !== '';
        });
        
        // 비밀번호 확인 처리
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (passwordInput && confirmPasswordInput && passwordInput.value !== confirmPasswordInput.value) {
            allValid = false;
        }
        
        submitButton.disabled = !allValid;
        submitButton.style.opacity = allValid ? '1' : '0.6';
    }
    
    // 모든 필드에 실시간 체크
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) input.addEventListener('input', checkFormValidity);
    });
}