import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 게시글 좋아요 추가 API
export async function addPostLike(postId, userId) {
    return await request({
        method: METHOD.POST,
        url: `/api/posts/${postId}/likes`,
        body: { userId }
    });
}

// 게시글 좋아요 제거 API
export async function removePostLike(postId, userId) {
    return await request({
        method: METHOD.DELETE,
        url: `/api/posts/${postId}/likes`,
        body: { userId }
    });
}
