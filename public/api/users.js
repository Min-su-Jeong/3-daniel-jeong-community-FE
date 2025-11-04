import { request, METHOD } from '../utils/common/request.js';

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
 * - 의도: 이메일 사용 가능 여부 확인
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
 * - 의도: 닉네임 사용 가능 여부 확인
 */
export async function checkNickname(nickname) {
    return await request({
        method: METHOD.POST,
        url: '/users/check-nickname',
        body: { nickname }
    });
}

