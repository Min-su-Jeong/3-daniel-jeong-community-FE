import { request, METHOD } from '../utils/common/request.js';

// 게시글 좋아요 추가
export async function addPostLike(postId, userId) {
    return await request({
        method: METHOD.POST,
        url: `/posts/${postId}/likes`,
        body: { userId }
    });
}

// 게시글 좋아요 제거
export async function removePostLike(postId, userId) {
    return await request({
        method: METHOD.DELETE,
        url: `/posts/${postId}/likes`,
        body: { userId }
    });
}
