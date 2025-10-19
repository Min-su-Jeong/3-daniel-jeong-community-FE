// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
    // 폼 제출 처리
    document.getElementById('loginForm').onsubmit = function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        // 유효성 검사
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }
        if (!password) {
            alert('비밀번호를 입력해주세요.');
            return;
        }
        if (!isValidEmail(email)) {
            alert('이메일 주소를 정확히 입력해주세요.');
            return;
        }
        
        // 로그인 처리
        console.log('로그인 시도:', { email, password, rememberMe });
        
        // 성공 메시지
        alert('로그인되었습니다!');
        window.location.href = '/';
    };
    
    // 실시간 유효성 검사
    document.getElementById('email').onblur = function() {
        const email = this.value;
        if (email && !isValidEmail(email)) {
            this.style.borderColor = 'red';
        } else {
            this.style.borderColor = '#f0f0f0';
        }
    };

    document.getElementById('password').oninput = function() {
        const password = this.value;
        if (password && password.length < 6) {
            this.style.borderColor = 'red';
        } else {
            this.style.borderColor = '#f0f0f0';
        }
    };
});


// 유효성 검사 함수들
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}