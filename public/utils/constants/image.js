/* 이미지 관련 상수 */
export const IMAGE_CONSTANTS = Object.freeze({
    MAX_IMAGES: 10,
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPT: 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
});

/* AWS S3 관련 상수 */
export const S3_CONFIG = Object.freeze({
    BUCKET_NAME: 'community-images-857597738766',
    REGION: 'ap-northeast-2',
    getPublicUrl: (objectKey) => {
        return `https://${S3_CONFIG.BUCKET_NAME}.s3.${S3_CONFIG.REGION}.amazonaws.com/${objectKey}`;
    }
});
