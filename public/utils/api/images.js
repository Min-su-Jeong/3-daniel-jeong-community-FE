import { request } from '../utils/common/request.js';
import { METHOD } from '../utils/constants/api.js';

// 이미지 업로드 API (multipart/form-data, 서버에서 검증 후 저장)
export async function uploadImage(imageType, resourceId, file) {
    const formData = new FormData();
    formData.append('imageType', imageType);
    formData.append('resourceId', resourceId.toString());
    formData.append('file', file);

    return await request({
        method: METHOD.POST,
        url: '/api/images/upload',
            body: formData,
        isFormData: true
    });
}
