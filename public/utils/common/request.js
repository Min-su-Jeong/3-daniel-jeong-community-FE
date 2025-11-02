import { API_SERVER_URI } from '../constants.js';

// HTTP 메서드 상수
export const METHOD = Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
});

/**
 * 공통 API 요청 처리 함수
 * - 의도: 반복되는 fetch 호출 및 에러 처리 공통화
 * - 반환: ApiResponse 형식의 응답 데이터
 */
export async function request({
    method = METHOD.POST,
    url = '/',
    params = '',
    body = undefined,
    isFormData = false,
}) {
    const options = { method, credentials: 'include' };

    // FormData 여부에 따라 헤더 및 body 설정
    if (isFormData) {
        options.body = body;
    } else {
        options.headers = { 'Content-Type': 'application/json' };
        if (body) {
            options.body = JSON.stringify(body);
        }
    }

    try {
        // URL에 params 추가 (있을 경우)
        const urlWithParams = params ? `${API_SERVER_URI}${url}?${params}` : `${API_SERVER_URI}${url}`;
        const response = await fetch(urlWithParams, options);
        const data = await response.json();

        // ApiResponse 형식 에러 처리
        if (!response.ok || !data.success) {
            // data.data가 실제 에러 메시지 (문자열 또는 배열)
            // data.message는 "Conflict", "Bad Request" 등의 에러 메시지
            let errorMessage;
            if (data.data) {
                if (Array.isArray(data.data)) {
                    errorMessage = data.data.join(', ');
                } else {
                    errorMessage = data.data;
                }
            } else {
                errorMessage = data.message || `HTTP error! status: ${response.status}`;
            }
            throw new Error(errorMessage);
        }

        return data;
    } catch (error) {
        console.error('API 요청 실패:', error);
        throw error;
    }
}
