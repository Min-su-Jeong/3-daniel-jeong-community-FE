import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 게시글 목록 조회 API (커서 기반 페이지네이션)
export async function getPosts(cursor = null, size = 10) {
    const params = cursor ? `cursor=${cursor}&size=${size}` : `size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/api/posts`,
        params: params
    });
}

// 게시글 상세 조회 API
export async function getPostById(postId) {
    return await request({
        method: METHOD.GET,
        url: `/api/posts/${postId}`
    });
}

// 게시글 작성 API
export async function createPost(postData) {
    return await request({
        method: METHOD.POST,
        url: '/api/posts',
        body: {
            userId: postData.userId,
            title: postData.title,
            content: postData.content,
            imageObjectKeys: postData.imageObjectKeys || []
        }
    });
}

// 게시글 수정 API
export async function updatePost(postId, postData) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/posts/${postId}`,
        body: {
            title: postData.title,
            content: postData.content,
            imageObjectKeys: postData.imageObjectKeys || []
        }
    });
}

// 게시글 삭제 API
export async function deletePost(postId) {
    return await request({
        method: METHOD.DELETE,
        url: `/api/posts/${postId}`
    });
}

