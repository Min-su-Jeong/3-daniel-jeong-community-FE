import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 중고거래 상품 댓글 목록 조회 API (페이지네이션)
export async function getProductComments(productId, page = 0, size = 10) {
    const params = `page=${page}&size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/api/products/${productId}/comments`,
        params: params
    });
}

// 중고거래 상품 댓글 생성 API
export async function createProductComment(productId, userId, content, parentId = null) {
    return await request({
        method: METHOD.POST,
        url: `/api/products/${productId}/comments`,
        params: `userId=${userId}`,
        body: {
            content,
            parentId
        }
    });
}

// 중고거래 상품 댓글 수정 API
export async function updateProductComment(productId, commentId, content) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/products/${productId}/comments/${commentId}`,
        body: { content }
    });
}

// 중고거래 상품 댓글 삭제 API
export async function deleteProductComment(productId, commentId) {
    return await request({
        method: METHOD.DELETE,
        url: `/api/products/${productId}/comments/${commentId}`
    });
}
