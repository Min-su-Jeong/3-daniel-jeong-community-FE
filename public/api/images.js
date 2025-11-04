import { request, METHOD } from '../utils/common/request.js';

/**
 * 이미지 업로드 (Multipart)
 * - 의도: 서버가 파일을 직접 받아 정책 검증 후 저장 및 응답
 */
export async function uploadImage(imageType, resourceId, file) {
    const formData = new FormData();
    formData.append('imageType', imageType);
    formData.append('resourceId', resourceId.toString());
    formData.append('file', file);

    return await request({
        method: METHOD.POST,
        url: '/images/upload',
            body: formData,
        isFormData: true
    });
}
