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
        const urlWithParams = params ? `${API_SERVER_URI}${url}?${params}` : `${API_SERVER_URI}${url}`;
        const response = await fetch(urlWithParams, options);
        
        // JSON 파싱
        let data = {};
        try {
            const text = await response.text();
            data = text ? JSON.parse(text) : {};
        } catch {
            // JSON 파싱 실패 시 빈 객체
        }

        // 에러 처리
        if (!response.ok || !data.success) {
            const errorMessage = Array.isArray(data.data) 
                ? data.data.join(', ') 
                : data.data || data.message || `HTTP error! status: ${response.status}`;
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        return data;
    } catch (error) {
        // 네트워크 에러 등 status 없는 경우 처리
        if (!error.status) error.status = 0;
        throw error;
    }
}
