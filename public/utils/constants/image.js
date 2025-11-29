/* 이미지 관련 상수 */
export const IMAGE_CONSTANTS = Object.freeze({
    MAX_IMAGES: 10,
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    ACCEPT: 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
});

/* AWS S3 관련 상수 - public-url 캐시 */
const publicUrlCache = new Map();

export const S3_CONFIG = Object.freeze({
    // 배경 비디오 objectKey
    BACKGROUND_VIDEO_KEY: 'assets/videos/background.mp4',
    
    // 배경 비디오 URL 가져오기
    getBackgroundVideoUrl: async () => {
        return await S3_CONFIG.getPublicUrl(S3_CONFIG.BACKGROUND_VIDEO_KEY);
    },
    
    getPublicUrl: async (objectKey) => {
        if (!objectKey) return null;
        
        // 캐시 조회
        if (publicUrlCache.has(objectKey)) {
            return publicUrlCache.get(objectKey);
        }

        const fetchPromise = (async () => {
            try {
                const response = await fetch(`/api/images/public-url?objectKey=${encodeURIComponent(objectKey)}`);
                const result = await response.json();
                return result.data?.url || null;
            } catch (error) {
                console.error('이미지 URL 조회 실패:', error);
                return null;
            }
        })();

        // 진행 중인 요청 캐시
        publicUrlCache.set(objectKey, fetchPromise);
        return fetchPromise;
    }
});
