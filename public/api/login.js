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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials), 
            credentials: 'include',
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