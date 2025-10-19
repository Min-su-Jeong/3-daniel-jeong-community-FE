// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
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
    document.getElementById('signupForm').onsubmit = function(event) {
        event.preventDefault(); // 기본 제출 막기

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const nickname = document.getElementById('nickname').value;

        // 간단한 유효성 검사
        if (!isValidEmail(email)) {
            alert('이메일 주소를 정확히 입력해주세요.');
            return;
        }
        if (!isValidPassword(password)) {
            alert('영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.');
            return;
        }
        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!isValidNickname(nickname)) {
            alert('닉네임은 2-10자 사이로 입력해주세요.');
            return;
        }
        
        // 성공 메시지
        alert('회원가입이 완료되었습니다!');
        window.location.href = '/login';
    };
    
    // 실시간 유효성 검사
    document.getElementById('email').onblur = function() {
        const email = this.value;
        const helperText = this.nextElementSibling;
        if (email && !isValidEmail(email)) {
            this.style.borderColor = 'red';
            helperText.style.color = 'red';
            helperText.textContent = '이메일 주소를 정확히 입력해주세요.';
        } else {
            this.style.borderColor = '#f0f0f0';
            helperText.style.color = '#666';
            helperText.textContent = '이메일 주소를 정확히 입력해주세요';
        }
    };

    document.getElementById('password').oninput = function() {
        const password = this.value;
        const helperText = this.nextElementSibling;
        if (password && !isValidPassword(password)) {
            this.style.borderColor = 'red';
            helperText.style.color = 'red';
            helperText.textContent = '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요.';
        } else {
            this.style.borderColor = '#f0f0f0';
            helperText.style.color = '#666';
            helperText.textContent = '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요';
        }
    };

    document.getElementById('confirmPassword').onblur = function() {
        const password = document.getElementById('password').value;
        const confirmPassword = this.value;
        const helperText = this.nextElementSibling;
        if (confirmPassword && password !== confirmPassword) {
            this.style.borderColor = 'red';
            helperText.style.color = 'red';
            helperText.textContent = '비밀번호가 일치하지 않습니다.';
        } else {
            this.style.borderColor = '#f0f0f0';
            helperText.style.color = '#666';
            helperText.textContent = '비밀번호를 다시 한번 입력해주세요';
        }
    };

    document.getElementById('nickname').onblur = function() {
        const nickname = this.value;
        const helperText = this.nextElementSibling;
        if (nickname && !isValidNickname(nickname)) {
            this.style.borderColor = 'red';
            helperText.style.color = 'red';
            helperText.textContent = '2-10자 사이로 입력해주세요.';
        } else {
            this.style.borderColor = '#f0f0f0';
            helperText.style.color = '#666';
            helperText.textContent = '2-10자 사이로 입력해주세요';
        }
    };
});

// 유효성 검사 함수들
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPassword(password) {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passwordRegex.test(password);
}

function isValidNickname(nickname) {
    return nickname.length >= 2 && nickname.length <= 10;
}