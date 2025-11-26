/* 이미지 관련 상수 */
export const IMAGE_CONSTANTS = Object.freeze({
    MAX_IMAGES: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPT: 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
});

/* AWS S3 관련 상수 - 백엔드 API에서 URL 조회 */
export const S3_CONFIG = Object.freeze({
    getPublicUrl: async (objectKey) => {
        if (!objectKey) return null;
        try {
            const response = await fetch(`/api/images/public-url?objectKey=${encodeURIComponent(objectKey)}`);
            const result = await response.json();
            return result.data?.url || null;
        } catch (error) {
            console.error('이미지 URL 조회 실패:', error);
            return null;
        }
    }
});
