import { request } from '../utils/common/request.js';
import { METHOD } from '../utils/constants.js';

/**
 * 회원 단건 조회
 * - 의도: id로 활성 사용자 조회, 없으면 404
 */
export async function getUserById(id) {
    return await request({
        method: METHOD.GET,
        url: `/users/${id}`
    });
}

/**
 * 회원 정보 부분 수정
 * - 의도: 닉네임/프로필 선택 수정, 닉네임 중복 시 409
 */
export async function updateUser(id, userData) {
    return await request({
        method: METHOD.PATCH,
        url: `/users/${id}`,
        body: {
            nickname: userData.nickname,
            profileImageKey: userData.profileImageKey || null
        }
    });
}

/**
 * 이메일 중복 체크
 * - 반환: true=사용 가능, false=중복
 */
export async function checkEmail(email) {
    return await request({
        method: METHOD.POST,
        url: '/users/check-email',
        body: { email }
    });
}

/**
 * 닉네임 중복 체크
 * - 반환: true=사용 가능, false=중복
 */
export async function checkNickname(nickname) {
    return await request({
        method: METHOD.POST,
        url: '/users/check-nickname',
        body: { nickname }
    });
}

/**
 * 비밀번호 변경
 * - 의도: 현재 비밀번호 검증 후 새 비밀번호로 변경
 */
export async function updatePassword(id, newPassword, confirmPassword) {
    return await request({
        method: METHOD.PATCH,
        url: `/users/${id}/password`,
        body: {
            newPassword,
            confirmPassword
        }
    });
}

/**
 * 회원 탈퇴(소프트 삭제)
 * - 의도: deletedAt 설정으로 비활성화
 */
export async function deleteUser(id) {
    return await request({
        method: METHOD.DELETE,
        url: `/users/${id}`
    });
}

/**
 * 회원 복구
 * - 의도: deletedAt을 null로 설정하여 계정 복구
 */
export async function restoreUser(id) {
    return await request({
        method: METHOD.PATCH,
        url: `/users/${id}/restore`
    });
}
