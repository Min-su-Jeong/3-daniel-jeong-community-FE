import { API_SERVER_URI } from '../utils/constants.js';

/**
 * 이미지 업로드 (Multipart)
 * - 의도: 서버가 파일을 직접 받아 정책 검증 후 저장 및 응답
 */
export async function uploadImage(imageType, resourceId, file) {
    const formData = new FormData();
    formData.append('imageType', imageType);
    formData.append('resourceId', resourceId.toString());
    formData.append('file', file);

    try {
        const response = await fetch(`${API_SERVER_URI}/images/upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
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
        throw error;
    }
}
