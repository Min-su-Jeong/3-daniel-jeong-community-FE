import { request } from '../utils/common/request.js';
import { METHOD } from '../utils/constants/api.js';

// 게시글 목록 조회 API (커서 기반 페이지네이션)
export async function getPosts(cursor = null, size = 10) {
    const params = cursor ? `cursor=${cursor}&size=${size}` : `size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/posts`,
        params: params
    });
}

// 게시글 상세 조회 API
export async function getPostById(postId) {
    return await request({
        method: METHOD.GET,
        url: `/posts/${postId}`
    });
}

// 게시글 작성 API
export async function createPost(postData) {
    return await request({
        method: METHOD.POST,
        url: '/posts',
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
        url: `/posts/${postId}`,
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
        url: `/posts/${postId}`
    });
}

