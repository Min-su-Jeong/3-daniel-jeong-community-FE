export const API_SERVER_URI = 'http://localhost:8080';

// HTTP 메서드 상수
export const METHOD = Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    PATCH: 'PATCH',
    DELETE: 'DELETE',
});

// 이미지 관련 상수
export const IMAGE_CONSTANTS = Object.freeze({
    MAX_IMAGES: 10,
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPT: 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
});