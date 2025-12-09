import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 회원 단건 조회 API (활성 사용자만 조회, 없으면 404)
export async function getUserById(id) {
    return await request({
        method: METHOD.GET,
        url: `/api/users/${id}`
    });
}

// 회원 정보 수정 API (닉네임/프로필 이미지, 닉네임 중복 시 409)
export async function updateUser(id, userData) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/users/${id}`,
        body: {
            nickname: userData.nickname,
            profileImageKey: userData.profileImageKey
        }
    });
}

// 이메일 중복 체크 API
export async function checkEmail(email) {
    return await request({
        method: METHOD.POST,
        url: `/api/users/check-email`,
        body: { email }
    });
}

// 닉네임 중복 체크 API
export async function checkNickname(nickname) {
    return await request({
        method: METHOD.POST,
        url: `/api/users/check-nickname`,
        body: { nickname }
    });
}

// 비밀번호 변경 API (현재 비밀번호 검증 후 변경)
export async function updatePassword(id, newPassword, confirmPassword) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/users/${id}/password`,
        body: {
            newPassword,
            confirmPassword
        }
    });
}

// 회원 탈퇴 API (소프트 삭제, deletedAt 설정)
export async function deleteUser(id) {
    return await request({
        method: METHOD.DELETE,
        url: `/api/users/${id}`
    });
}

// 회원 복구 API (deletedAt을 null로 설정하여 계정 활성화)
export async function restoreUser(id) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/users/${id}/restore`
    });
}
