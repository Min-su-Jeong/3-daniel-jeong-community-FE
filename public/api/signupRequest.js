import { API_SERVER_URI } from '../utils/constants.js';

/**
 * 회원가입 API 요청
 * @param {Object} userData - 회원가입 데이터
 * @param {string} userData.email - 이메일
 * @param {string} userData.password - 비밀번호
 * @param {string} userData.nickname - 닉네임
 * @param {File} userData.profileImage - 프로필 이미지 (선택)
 */
export async function signup(userData) {
    try {
        // 1. JSON 객체 생성
        const requestData = {
            email: userData.email,
            password: userData.password,
            confirmPassword: userData.password, // 비밀번호 확인
            nickname: userData.nickname,
            profileImageUrl: userData.profileImageUrl || null // 프로필 이미지 URL (선택사항)
        };

        // 2. 서버에 POST 요청으로 회원가입 데이터 전송
        const response = await fetch(`${API_SERVER_URI}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // JSON 형태로 데이터 전송
            },
            body: JSON.stringify(requestData), // 객체를 JSON 문자열로 변환
            credentials: 'include', // 쿠키 포함하여 요청
        });

        // 3. 서버 응답을 JSON으로 파싱
        const data = await response.json();

        // 4. 응답 상태 확인
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        // 5. 성공 시 데이터 반환
        return data;
    } catch (error) {
        console.error('회원가입 API 요청 실패:', error);
        throw error;
    }
}