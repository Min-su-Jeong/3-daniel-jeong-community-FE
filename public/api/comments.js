import { request, METHOD } from '../utils/common/request.js';

/**
 * 댓글 목록 조회
 */
export async function getComments(postId, page = 0, size = 10) {
    const params = `page=${page}&size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/posts/${postId}/comments`,
        params: params
    });
}

/**
 * 댓글 생성
 */
export async function createComment(postId, userId, content, parentId = null) {
    return await request({
        method: METHOD.POST,
        url: `/posts/${postId}/comments`,
        params: `userId=${userId}`,
        body: {
            postId,
            content,
            parentId
        }
    });
}

/**
 * 댓글 수정
 */
export async function updateComment(postId, commentId, content) {
    return await request({
        method: METHOD.PATCH,
        url: `/posts/${postId}/comments/${commentId}`,
        body: { content }
    });
}

/**
 * 댓글 삭제
 */
export async function deleteComment(postId, commentId) {
    return await request({
        method: METHOD.DELETE,
        url: `/posts/${postId}/comments/${commentId}`
    });
}
