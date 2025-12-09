/**
 * 입력값 유효성 검사 유틸리티
 * 이메일, 비밀번호, 닉네임 등 폼 입력값 검증 로직 통합
 */
import { debounce, findHelperText } from './element.js';

/**
 * 이모지 정규식 (상수)
 * 이모지 입력을 차단하기 위한 정규식 패턴
 */
const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

/**
 * 이메일 형식 검증
 * RFC 5322 기준을 간소화한 이메일 형식 검증
 * @param {string} email - 검증할 이메일 주소
 * @returns {Object} {isValid: boolean, message: string} - 검증 결과
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

/**
 * 비밀번호 강도 검증
 * 8자 이상, 영문/숫자/특수문자 포함, 공백/연속문자 제한
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} {isValid: boolean, message: string} - 검증 결과
 */
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

/**
 * 닉네임 형식 검증
 * 2-10자, 한글/영문/숫자/언더스코어만 허용, 숫자만으로는 불가
 * @param {string} nickname - 검증할 닉네임
 * @returns {Object} {isValid: boolean, message: string} - 검증 결과
 */
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

/**
 * 입력 필드 검증 상태 UI 업데이트
 * 성공/에러 상태에 따라 input과 helper-text에 적절한 클래스와 메시지 적용
 * @param {HTMLElement} input - 입력 필드 요소
 * @param {HTMLElement} helperText - helper text 요소
 * @param {boolean} isValid - 검증 통과 여부
 * @param {string} errorMessage - 에러 메시지
 * @param {string} successMessage - 성공 메시지
 */
export function updateFieldValidation(input, helperText, isValid, errorMessage, successMessage) {
    const classes = ['success', 'error', 'warning'];
    input.classList.remove(...classes);
    helperText.classList.remove(...classes);

    const isEmpty = !input.value.trim();
    if (isEmpty) {
        helperText.textContent = helperText.dataset.defaultText || '';
        return;
    }

    const state = isValid ? 'success' : 'error';
    const message = isValid ? successMessage : errorMessage;
    input.classList.add(state);
    helperText.classList.add(state);
    helperText.textContent = message;
}

/**
 * 폼 전체 유효성 검사 설정
 * 실시간 검증, 제출 버튼 활성화 제어, 입력 제한 등을 설정
 * @param {string} formId - 폼 요소의 ID
 * @param {Array} fields - [{id, validation, options}, ...] 형태의 필드 설정 배열
 */
export function setupFormValidation(formId, fields) {
    const form = document.getElementById(formId);
    const submitButton = form?.querySelector('.btn-primary');
    if (!form || !submitButton) return;
    
    // 입력 필드 캐싱 (성능 최적화: 반복 DOM 쿼리 방지)
    const fieldMap = new Map();
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        const helperText = findHelperText(input);
        if (!helperText) return;
        fieldMap.set(field.id, { input, helperText, field });
    });
    
    // 초기 상태: 제출 버튼 비활성화
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';
    
    // 각 필드에 대한 입력 제한 및 실시간 검증 설정
    fieldMap.forEach(({ input, helperText, field }) => {
        const { successMessage = '유효한 값입니다', defaultText = '', preventSpaces = false, preventEmojis = false, allowedChars = null } = field.options || {};
        
        if (defaultText) helperText.dataset.defaultText = defaultText;
        
        // 입력 제한: 공백, 이모지, 허용되지 않은 문자 차단
        if (preventSpaces) {
            input.addEventListener('keypress', (e) => e.key === ' ' && e.preventDefault());
        }
        if (preventEmojis) {
            input.addEventListener('keypress', (e) => EMOJI_REGEX.test(e.key) && e.preventDefault());
        }
        if (allowedChars) {
            input.addEventListener('keypress', (e) => !allowedChars.test(e.key) && e.preventDefault());
        }
        
        // 붙여넣기 처리: 클립보드에서 붙여넣을 때도 입력 제한 적용
        if (preventSpaces || preventEmojis || allowedChars) {
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                let pastedText = (e.clipboardData || window.clipboardData).getData('text');
                
                if (preventSpaces) pastedText = pastedText.replace(/\s/g, '');
                if (preventEmojis) pastedText = pastedText.replace(EMOJI_REGEX, '');
                if (allowedChars) pastedText = pastedText.replace(new RegExp(`[^${allowedChars.source}]`, 'g'), '');
                
                const { selectionStart, value } = input;
                const newValue = value.substring(0, selectionStart) + pastedText + value.substring(input.selectionEnd);
                input.value = newValue;
                input.setSelectionRange(selectionStart + pastedText.length, selectionStart + pastedText.length);
                input.dispatchEvent(new Event('input'));
            });
        }
        
        // 실시간 검증: 입력 시 즉시 검증 수행
        input.addEventListener('input', () => {
            const validation = field.validation(input.value);
            updateFieldValidation(input, helperText, validation.isValid, validation.message, successMessage);
        });
        
        // 포커스 아웃 시: 빈 값이면 초기 상태로 복원
        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                updateFieldValidation(input, helperText, true, '', '');
            }
        });
    });
    
    // 폼 유효성 체크 (캐시된 요소 사용)
    // 폼 전체 유효성 체크: 모든 필드가 유효한지 확인하고 제출 버튼 활성화/비활성화
    function checkFormValidity() {
        let allValid = true;
        
        for (const { input, field } of fieldMap.values()) {
            const validation = field.validation(input.value);
            if (!validation.isValid || !input.value.trim()) {
                allValid = false;
                break;
            }
        }
        
        // 비밀번호 확인 처리: 비밀번호와 비밀번호 확인이 일치하는지 확인
        const passwordField = fieldMap.get('password');
        const confirmPasswordField = fieldMap.get('confirmPassword');
        if (passwordField && confirmPasswordField) {
            if (passwordField.input.value !== confirmPasswordField.input.value) {
                allValid = false;
            }
        }
        
        // 제출 버튼 상태 업데이트
        submitButton.disabled = !allValid;
        submitButton.style.opacity = allValid ? '1' : '0.6';
    }
    
    // 모든 필드에 실시간 유효성 체크 이벤트 리스너 등록
    fieldMap.forEach(({ input }) => {
        input.addEventListener('input', checkFormValidity);
    });
}

// 입력값 중복 체크 설정
export function setupDuplicateCheck({ 
    input, 
    helperText, 
    checkFunction, 
    validateFunction, 
    successMessage = '사용 가능합니다',
    errorMessage = '이미 사용 중입니다',
    debounceDelay = 500 
}) {
    if (!input || !helperText || !checkFunction || !validateFunction) return;

    const classes = ['error', 'warning', 'success'];
    const checkAvailability = debounce(async (value) => {
        const validation = validateFunction(value);
        if (!validation.isValid || !value.trim()) return;
        
        try {
            const response = await checkFunction(value);
            const isAvailable = response?.data === true || response?.data?.available === true;
            
            input.classList.remove(...classes);
            helperText.classList.remove(...classes);
            
            const state = isAvailable ? 'success' : 'error';
            const message = isAvailable ? successMessage : errorMessage;
            input.classList.add(state);
            helperText.classList.add(state);
            helperText.textContent = message;
        } catch {
            // 네트워크 오류 무시
        }
    }, debounceDelay);
    
    input.addEventListener('input', () => {
        const value = input.value.trim();
        if (value && validateFunction(value).isValid) {
            checkAvailability(value);
        }
    });
}

// 비밀번호 확인 검증 함수 생성
export function createPasswordMatchValidator(passwordInput) {
    return function validatePasswordMatch(confirmPasswordValue) {
        if (!confirmPasswordValue) {
            return { isValid: true, message: '' };
        }
        
        const password = passwordInput?.value || '';
        const isValid = confirmPasswordValue === password && confirmPasswordValue.length > 0;
        
        return {
            isValid,
            message: isValid ? '' : '비밀번호가 일치하지 않습니다'
        };
    };
}

// 비밀번호 확인 UI 업데이트
export function setupPasswordConfirmationUI(passwordInput, confirmInput, helperText, successMessage = '비밀번호가 일치합니다', errorMessage = '비밀번호가 일치하지 않습니다') {
    if (!passwordInput || !confirmInput || !helperText) return;
    
    const updateUI = () => {
        const confirmValue = confirmInput.value;
        if (!confirmValue) {
            helperText.textContent = '';
            helperText.className = 'helper-text';
            return;
        }
        
        const isMatch = passwordInput.value === confirmValue;
        helperText.textContent = isMatch ? successMessage : errorMessage;
        helperText.className = `helper-text ${isMatch ? 'success' : 'error'}`;
    };
    
    passwordInput.addEventListener('input', updateUI);
    confirmInput.addEventListener('input', updateUI);
}