import { request, METHOD } from '../utils/common/request.js';

/**
 * 로그인 (인증 생성)
 * - 의도: 이메일/비밀번호 검증 후 JWT 토큰 발급 및 쿠키 설정
 */
export async function login(credentials) {
    return await request({
        method: METHOD.POST,
        url: '/auth',
        body: {
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe || false
        }
    });
}

/**
 * 회원가입
 * - 의도: 유효성 검증 후 사용자 생성
 * - 요청: multipart/form-data (userData: JSON, profileImage: 파일, 선택사항)
 */
export async function signup(userData, profileImage = null) {
    const formData = new FormData();
    
    formData.append('userData', new Blob([JSON.stringify({
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword || userData.password,
        nickname: userData.nickname,
        profileImageKey: null
    })], { type: 'application/json' }));
    
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }
    
    return await request({
        method: METHOD.POST,
        url: '/users',
        body: formData,
        isFormData: true
    });
}

/**
 * 토큰 갱신 (인증 상태 확인)
 * - 의도: 쿠키의 refresh token으로 새 access token 발급
 */
export async function refresh() {
    return await request({
        method: METHOD.POST,
        url: '/auth/refresh'
    });
}

/**
 * 로그아웃 (인증 삭제)
 * - 의도: 쿠키를 즉시 만료시키고 DB의 refresh token도 무효화
 */
export async function logout() {
    return await request({
        method: METHOD.DELETE,
        url: '/auth'
    });
}
