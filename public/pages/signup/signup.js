// API 함수들 import
import { signup } from '../../api/signupRequest.js';

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
    // 말풍선 애니메이션 초기화
    if (window.BubbleAnimation) {
        window.bubbleAnimation = new window.BubbleAnimation('body');
    }
    
    // 프로필 이미지 클릭하면 파일 선택
    document.getElementById('profileImage').onclick = function() {
        document.getElementById('profileInput').click();
    };

    // 파일 선택하면 미리보기
    document.getElementById('profileInput').onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('profileImage').innerHTML = 
                    '<img src="' + e.target.result + '" alt="프로필 이미지">';
            };
            reader.readAsDataURL(file);
        }
    };

    // 폼 제출 처리
    document.getElementById('signupForm').onsubmit = async function(event) {
        event.preventDefault(); // 기본 제출 막기

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const nickname = document.getElementById('nickname').value;
        const profileImage = document.getElementById('profileInput').files[0];
        
        // 로딩 상태 표시
        const submitButton = document.querySelector('.btn-primary');
        submitButton.disabled = true;
        submitButton.textContent = '처리중...';

        try {
            // API 호출로 회원가입 처리 (서버에 데이터 전송)
            console.log('회원가입 시도:', { email, password, nickname, profileImage });
            const response = await signup({ email, password, nickname, profileImage });
            
            console.log('회원가입 성공:', response);
            alert('회원가입이 완료되었습니다!');
            window.location.href = '/login';
            
        } catch (error) {
            // 에러 처리
            console.error('회원가입 실패:', error);
            alert('회원가입에 실패했습니다: ' + error.message);
        } finally {
            // 로딩 상태 해제
            submitButton.disabled = false;
            submitButton.textContent = '회원가입';
        }
    };
    
    // 실시간 유효성 검사 함수들
    function updateFieldValidation(input, helperText, isValid, errorMessage, successMessage) {
        // 기존 클래스 제거
        input.classList.remove('success', 'error', 'warning');
        helperText.classList.remove('success', 'error', 'warning');
        
        if (input.value.trim() === '') {
            // 빈 값일 때는 기본 상태
            input.style.borderColor = '';
            input.style.background = '';
            helperText.style.color = '';
            helperText.textContent = helperText.dataset.defaultText || '';
        } else if (isValid) {
            // 유효한 값
            input.classList.add('success');
            helperText.classList.add('success');
            helperText.textContent = successMessage;
        } else {
            // 유효하지 않은 값
            input.classList.add('error');
            helperText.classList.add('error');
            helperText.textContent = errorMessage;
        }
    }

    // 이메일 실시간 검증
    const emailInput = document.getElementById('email');
    const emailHelperText = emailInput.nextElementSibling;
    emailHelperText.dataset.defaultText = '이메일 주소를 정확히 입력해주세요';

    emailInput.addEventListener('input', function() {
        const email = this.value;
        const validation = validateEmail(email);
        updateFieldValidation(
            this, 
            emailHelperText, 
            validation.isValid, 
            validation.message, 
            '유효한 이메일 주소입니다'
        );
    });

    emailInput.addEventListener('blur', function() {
        const email = this.value;
        if (email.trim() === '') {
            updateFieldValidation(this, emailHelperText, true, '', '');
        }
    });

    // 비밀번호 실시간 검증
    const passwordInput = document.getElementById('password');
    const passwordHelperText = passwordInput.nextElementSibling;
    passwordHelperText.dataset.defaultText = '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요';

    // 비밀번호 입력 시 공백 방지
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === ' ') {
            e.preventDefault();
            return;
        }
    });

    // 비밀번호 붙여넣기 시 공백 제거
    passwordInput.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = (e.clipboardData || window.clipboardData).getData('text');
        
        // 공백 제거
        pastedText = pastedText.replace(/\s/g, '');
        
        // 현재 커서 위치에 텍스트 삽입
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const currentValue = this.value;
        const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
        
        this.value = newValue;
        this.setSelectionRange(start + pastedText.length, start + pastedText.length);
        
        // 입력 이벤트 트리거
        this.dispatchEvent(new Event('input'));
    });

    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const validation = validatePassword(password);
        
        updateFieldValidation(
            this, 
            passwordHelperText, 
            validation.isValid, 
            validation.message, 
            '유효한 비밀번호입니다'
        );
    });

    // 비밀번호 확인 실시간 검증
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const confirmPasswordHelperText = confirmPasswordInput.nextElementSibling;
    confirmPasswordHelperText.dataset.defaultText = '비밀번호를 다시 한번 입력해주세요';

    confirmPasswordInput.addEventListener('input', function() {
        const password = passwordInput.value;
        const confirmPassword = this.value;
        
        if (confirmPassword.trim() === '') {
            updateFieldValidation(this, confirmPasswordHelperText, true, '', '');
        } else if (password === confirmPassword) {
            updateFieldValidation(
                this, 
                confirmPasswordHelperText, 
                true, 
                '', 
                '비밀번호가 일치합니다'
            );
        } else {
            updateFieldValidation(
                this, 
                confirmPasswordHelperText, 
                false, 
                '비밀번호가 일치하지 않습니다', 
                ''
            );
        }
    });

    // 비밀번호가 변경될 때 비밀번호 확인도 다시 검증
    passwordInput.addEventListener('input', function() {
        const confirmPassword = confirmPasswordInput.value;
        if (confirmPassword.trim() !== '') {
            confirmPasswordInput.dispatchEvent(new Event('input'));
        }
    });

    // 닉네임 실시간 검증
    const nicknameInput = document.getElementById('nickname');
    const nicknameHelperText = nicknameInput.nextElementSibling;
    nicknameHelperText.dataset.defaultText = '2-10자 사이로 입력해주세요';

    nicknameInput.addEventListener('keypress', function(e) {
        // 공백 입력 방지
        if (e.key === ' ') {
            e.preventDefault();
            return;
        }
        
        // 이모지 입력 방지
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        if (emojiRegex.test(e.key)) {
            e.preventDefault();
            return;
        }
        
        // 허용되지 않는 특수문자 입력 방지 (언더스코어만 허용)
        const allowedChars = /[가-힣a-zA-Z0-9_]/;
        if (!allowedChars.test(e.key)) {
            e.preventDefault();
            return;
        }
    });

    nicknameInput.addEventListener('paste', function(e) {
        e.preventDefault();
        let pastedText = (e.clipboardData || window.clipboardData).getData('text');
        
        // 띄어쓰기 제거
        pastedText = pastedText.replace(/\s/g, '');
        
        // 이모지 제거
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        pastedText = pastedText.replace(emojiRegex, '');
        
        // 허용되지 않는 특수문자 제거 (언더스코어만 유지)
        pastedText = pastedText.replace(/[^가-힣a-zA-Z0-9_]/g, '');
        
        // 현재 커서 위치에 텍스트 삽입
        const start = this.selectionStart;
        const end = this.selectionEnd;
        const currentValue = this.value;
        const newValue = currentValue.substring(0, start) + pastedText + currentValue.substring(end);
        
        this.value = newValue;
        this.setSelectionRange(start + pastedText.length, start + pastedText.length);
        
        // 입력 이벤트 트리거
        this.dispatchEvent(new Event('input'));
    });

    nicknameInput.addEventListener('input', function() {
        const nickname = this.value;
        const validation = validateNickname(nickname);
        
        updateFieldValidation(
            this, 
            nicknameHelperText, 
            validation.isValid, 
            validation.message, 
            '유효한 닉네임입니다'
        );
        
        // 모든 필드 검증 후 회원가입 버튼 활성화/비활성화
        checkFormValidity();
    });

    // 회원가입 버튼 활성화/비활성화 체크 함수
    function checkFormValidity() {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const submitButton = document.querySelector('.btn-primary');
        
        // 모든 필드가 채워져 있고 유효한지 확인
        const isEmailValid = email && validateEmail(email).isValid;
        const isPasswordValid = password && validatePassword(password).isValid;
        const isConfirmPasswordValid = confirmPassword && password === confirmPassword;
        const isNicknameValid = nickname && validateNickname(nickname).isValid;
        
        if (isEmailValid && isPasswordValid && isConfirmPasswordValid && isNicknameValid) {
            submitButton.disabled = false;
            submitButton.style.opacity = '1';
        } else {
            submitButton.disabled = true;
            submitButton.style.opacity = '0.6';
        }
    }

    // 모든 입력 필드에 대해 실시간 버튼 상태 체크
    document.getElementById('email').addEventListener('input', checkFormValidity);
    document.getElementById('password').addEventListener('input', checkFormValidity);
    document.getElementById('confirmPassword').addEventListener('input', checkFormValidity);
    
    // 페이지 로드 시 회원가입 버튼 비활성화
    const submitButton = document.querySelector('.btn-primary');
    submitButton.disabled = true;
    submitButton.style.opacity = '0.6';
});

// 유효성 검사 함수들
function validateEmail(email) {
    if (email.length === 0) {
        return { isValid: true, message: '' };
    }
    
    // 한글, 특수문자, 공백 등을 제외한 영문/숫자만 허용하는 엄격한 이메일 정규식
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const isValid = emailRegex.test(email);
    
    return {
        isValid: isValid,
        message: isValid ? '' : '올바른 이메일 형식이 아닙니다'
    };
}

// 상세한 비밀번호 검증 함수
function validatePassword(password) {
    if (password.length === 0) {
        return { isValid: true, message: '' };
    }
    
    // 1. 길이 제한: 8자 이상
    if (password.length < 8) {
        return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다' };
    }
    
    // 2. 공백 체크
    if (password.includes(' ')) {
        return { isValid: false, message: '비밀번호에 공백을 사용할 수 없습니다' };
    }
    
    // 3. 연속된 같은 문자 3개 이상 금지 - 우선순위 3위
    if (/(.)\1{2,}/.test(password)) {
        return { isValid: false, message: '같은 문자를 3개 이상 연속으로 사용할 수 없습니다' };
    }
    
    // 4. 연속된 숫자 3개 이상 금지 (예: 123, 456) - 우선순위 4위
    if (/\d{3,}/.test(password) && /(?:012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/.test(password)) {
        return { isValid: false, message: '연속된 숫자는 사용할 수 없습니다' };
    }
    
    // 5. 문자 조합 체크 (영문, 숫자, 특수문자 모두 포함)
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
        const missing = [];
        if (!hasLetter) missing.push('영문');
        if (!hasNumber) missing.push('숫자');
        if (!hasSpecial) missing.push('특수문자');
        
        if (missing.length === 1) {
            return { isValid: false, message: `${missing[0]}가 필요합니다` };
        } else if (missing.length === 2) {
            return { isValid: false, message: `${missing[0]}과 ${missing[1]}가 필요합니다` };
        } else {
            return { isValid: false, message: `${missing[0]}, ${missing[1]}, ${missing[2]}가 필요합니다` };
        }
    }
    
    // 6. 키보드 패턴 금지 (qwerty, asdf 등)
    const keyboardPatterns = [
        'qwerty', 'asdf', 'zxcv', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
        '123456', 'abcdef', 'password', 'admin', 'user', 'test'
    ];
    
    const lowerPassword = password.toLowerCase();
    for (const pattern of keyboardPatterns) {
        if (lowerPassword.includes(pattern)) {
            return { isValid: false, message: '흔한 키보드 패턴은 사용할 수 없습니다' };
        }
    }
    
    // 7. 이메일 포함 체크
    const email = document.getElementById('email').value.toLowerCase();
    const emailUsername = email.split('@')[0];
    if (emailUsername && emailUsername.length >= 3 && lowerPassword.includes(emailUsername)) {
        return { isValid: false, message: '이메일 주소가 포함된 비밀번호는 사용할 수 없습니다' };
    }
    
    // 8. 닉네임 포함 체크
    const nickname = document.getElementById('nickname').value.toLowerCase();
    if (nickname && nickname.length >= 2 && lowerPassword.includes(nickname)) {
        return { isValid: false, message: '닉네임이 포함된 비밀번호는 사용할 수 없습니다' };
    }
    
    return { isValid: true, message: '' };
}

// 상세한 닉네임 검증 함수
function validateNickname(nickname) {
    if (nickname.length === 0) {
        return { isValid: true, message: '' };
    }
    
    // 1. 길이 제한: 2~10자
    if (nickname.length < 2) {
        return { isValid: false, message: '닉네임은 2자 이상이어야 합니다' };
    }
    
    if (nickname.length > 10) {
        return { isValid: false, message: '닉네임은 10자 이하여야 합니다' };
    }
    
    // 2. 공백 체크
    if (nickname.includes(' ')) {
        return { isValid: false, message: '띄어쓰기는 사용할 수 없습니다' };
    }
    
    // 3. 이모지/이모티콘 체크
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(nickname)) {
        return { isValid: false, message: '이모지는 사용할 수 없습니다' };
    }
    
    // 4. 허용 문자 체크: 한글, 영문, 숫자, 언더스코어(_)만 허용
    if (!/^[가-힣a-zA-Z0-9_]+$/.test(nickname)) {
        return { isValid: false, message: '한글, 영문, 숫자, 언더스코어(_)만 사용할 수 있습니다' };
    }
    
    // 5. 연속된 기호 금지 (__)
    if (/_{2,}/.test(nickname)) {
        return { isValid: false, message: '연속된 언더스코어는 사용할 수 없습니다' };
    }
    
    // 6. 숫자만으로 구성된 닉네임 금지
    if (/^[0-9]+$/.test(nickname)) {
        return { isValid: false, message: '숫자만으로는 닉네임을 만들 수 없습니다' };
    }
    
    // 7. 언더스코어로 시작하거나 끝나는 경우 금지
    if (nickname.startsWith('_') || nickname.endsWith('_')) {
        return { isValid: false, message: '언더스코어로 시작하거나 끝날 수 없습니다' };
    }
    
    // 8. 욕설/비속어 필터링 (기본적인 금칙어)
    const bannedWords = [
        'admin', 'administrator', 'root', 'system', 'null', 'undefined',
        'test', 'user', 'guest', 'anonymous', 'bot', 'spam',
        'fuck', 'shit', 'damn', 'hell', 'bitch', 'ass', 'bastard',
        '씨발', '좆', '개새끼', '지랄', '병신', '미친', '바보', '멍청이'
    ];
    
    const lowerNickname = nickname.toLowerCase();
    for (const word of bannedWords) {
        if (lowerNickname.includes(word.toLowerCase())) {
            return { isValid: false, message: '사용할 수 없는 단어가 포함되어 있습니다' };
        }
    }
    
    return { isValid: true, message: '' };
}