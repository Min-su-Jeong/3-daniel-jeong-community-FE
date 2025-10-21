import { login } from '../../api/loginRequest.js';

// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
    // 말풍선 애니메이션 초기화
    if (window.BubbleAnimation) {
        window.bubbleAnimation = new window.BubbleAnimation('body');
    }
    
    // 폼 제출 처리
    document.getElementById('loginForm').onsubmit = async function(event) {
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
        
        // 로딩 상태 표시
        const submitButton = document.querySelector('.btn-primary');
        submitButton.disabled = true;
        submitButton.textContent = '로그인 중...';
        
        try {
            // API 호출로 로그인 처리 (서버에 데이터 전송)
            console.log('로그인 시도:', { email, password, rememberMe });
            const response = await login({ email, password, rememberMe });
            
            console.log('로그인 성공:', response);
            alert('로그인되었습니다!');
            window.location.href = '/';
            
        } catch (error) {
            console.error('로그인 실패:', error);
            alert('로그인에 실패했습니다: ' + error.message);
        } finally {
            // 로딩 상태 해제
            submitButton.disabled = false;
            submitButton.textContent = '로그인';
        }
    };
});