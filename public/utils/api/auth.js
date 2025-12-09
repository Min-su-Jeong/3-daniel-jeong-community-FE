import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 로그인 API (JWT 토큰 발급 및 쿠키 설정)
export async function login(credentials) {
    return await request({
        method: METHOD.POST,
        url: `/api/auth`,
        body: {
            email: credentials.email,
            password: credentials.password,
            rememberMe: credentials.rememberMe || false
        }
    });
}

// 회원가입 API (백엔드에서 이미지 업로드 처리)
export async function signup(userData, profileImage = null) {
    const formData = new FormData();
    
    // 사용자 정보를 JSON Blob으로 추가 (백엔드에서 UserCreateRequestDto로 변환)
    const userDataJson = {
        email: userData.email,
        password: userData.password,
        confirmPassword: userData.confirmPassword || userData.password,
        nickname: userData.nickname
    };
    formData.append('userData', new Blob([JSON.stringify(userDataJson)], { type: 'application/json' }));
    
    // 프로필 이미지가 있으면 추가 (백엔드에서 MultipartFile로 받음)
    if (profileImage) {
        formData.append('profileImage', profileImage);
    }
    
    return await request({
        method: METHOD.POST,
        url: `/api/users`,
        body: formData,
        isFormData: true
    });
}

// Refresh 토큰으로 Access 토큰 갱신 (쿠키의 refresh token 사용)
export async function refresh() {
    return await request({
        method: METHOD.POST,
        url: `/api/auth/refresh`
    });
}

// 로그아웃 API (쿠키 만료 및 DB refresh token 무효화)
export async function logout() {
    return await request({
        method: METHOD.DELETE,
        url: `/api/auth`
    });
}

// 현재 비밀번호 확인 (로그인 API 재사용하여 일치 여부 확인)
export async function checkCurrentPassword(email, password) {
    try {
        await request({
            method: METHOD.POST,
            url: `/api/auth`,
            body: { email, password, rememberMe: false }
        });
        return { match: true };
    } catch (error) {
        return { match: false };
    }
}

// 비밀번호 재설정 인증번호 발송 API
export async function sendPasswordResetCode(email) {
    return await request({
        method: METHOD.POST,
        url: `/api/auth/password-reset`,
        body: { email }
    });
}

// 비밀번호 재설정 인증번호 검증 API
export async function verifyPasswordResetCode(userId, verificationCode) {
    return await request({
        method: METHOD.POST,
        url: `/api/auth/password-reset/${userId}/verify`,
        body: { verificationCode }
    });
}

// 비밀번호 재설정 API (인증번호 검증 완료 후)
export async function resetPasswordById(userId, newPassword, confirmPassword) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/auth/password-reset/${userId}`,
        body: { newPassword, confirmPassword }
    });
}
