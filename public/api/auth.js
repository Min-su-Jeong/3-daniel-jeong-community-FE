import { request } from '../utils/common/request.js';
import { METHOD } from '../utils/constants.js';

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

/**
 * 현재 비밀번호 확인
 * - 의도: 비밀번호 수정 전 현재 비밀번호 일치 여부 확인 (로그인 API 활용)
 */
export async function checkCurrentPassword(email, password) {
    try {
        await request({
            method: METHOD.POST,
            url: '/auth',
            body: { email, password, rememberMe: false }
        });
        return { match: true };
    } catch (error) {
        return { match: false };
    }
}

/**
 * 비밀번호 찾기 - 인증번호 발송
 * - 의도: 이메일로 인증번호 생성 및 발송
 */
export async function sendPasswordResetCode(email) {
    return await request({
        method: METHOD.POST,
        url: '/auth/password-reset',
        body: { email }
    });
}

/**
 * 비밀번호 찾기 - 인증번호 검증
 * - 의도: 이메일로 발송된 인증번호 검증
 */
export async function verifyPasswordResetCode(userId, verificationCode) {
    return await request({
        method: METHOD.POST,
        url: `/auth/password-reset/${userId}/verify`,
        body: { verificationCode }
    });
}

/**
 * 비밀번호 찾기 - 비밀번호 재설정
 * - 의도: 인증번호 검증 완료 후 비밀번호 재설정
 */
export async function resetPasswordById(userId, newPassword, confirmPassword) {
    return await request({
        method: METHOD.PATCH,
        url: `/auth/password-reset/${userId}`,
        body: { newPassword, confirmPassword }
    });
}
