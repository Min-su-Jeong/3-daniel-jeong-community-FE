import { API_SERVER_URI } from '../utils/constants.js';

/**
 * 로그인 API 요청
 * @param {Object} credentials - 로그인 정보
 * @param {string} credentials.email - 이메일
 * @param {string} credentials.password - 비밀번호
 * @param {boolean} credentials.rememberMe - 로그인 상태 유지 여부
 */
export async function login(credentials) {
    try {
        // 1. 서버에 POST 요청으로 로그인 정보 전송
        const response = await fetch(`${API_SERVER_URI}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // JSON 형태로 데이터 전송
            },
            body: JSON.stringify(credentials), // 객체를 JSON 문자열로 변환
            credentials: 'include', // 쿠키 포함하여 요청 (세션 유지)
        });

        // 2. 서버 응답을 JSON으로 파싱
        const data = await response.json();

        // 3. 응답 상태 확인
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        // 4. 성공 시 데이터 반환
        return data;
    } catch (error) {
        console.error('로그인 API 요청 실패:', error);
        throw error;
    }
}