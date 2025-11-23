import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';
import { S3_CONFIG } from '../constants/image.js';


// Presigned URL 요청
export async function getPresignedUrl(imageType, resourceId, filename, contentType) {
    return await request({
        method: METHOD.POST,
        url: '/api/images/presigned-url',
        body: {
            imageType,
            resourceId,
            filename,
            contentType
        }
    });
}

// S3에 직접 업로드
export async function uploadToS3(presignedUrl, file) {
    return await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type
        }
    });
}

// 이미지 업로드 (S3 Presigned URL 방식)
export async function uploadImage(imageType, resourceId, file) {
    // 1. Presigned URL 요청
    const { data: presignedData } = await getPresignedUrl(
        imageType,
        resourceId,
        file.name,
        file.type
    );
    
    // 2. S3에 직접 업로드
    const uploadResponse = await uploadToS3(presignedData.presignedUrl, file);
    
    if (!uploadResponse.ok) {
        throw new Error(`S3 업로드 실패: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    // 3. Public URL 생성하여 반환
    const publicUrl = S3_CONFIG.getPublicUrl(presignedData.objectKey);
    
    return {
        objectKey: presignedData.objectKey,
        url: publicUrl
    };
}
