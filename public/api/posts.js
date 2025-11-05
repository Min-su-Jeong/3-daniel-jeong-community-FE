import { request, METHOD } from '../utils/common/request.js';

/**
 * 게시글 목록 조회 (cursor 기반)
 * - 의도: 커서 기반 페이지네이션을 통한 게시글 목록 조회
 */
export async function getPosts(cursor = null, size = 10) {
    const params = cursor ? `cursor=${cursor}&size=${size}` : `size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/posts`,
        params: params
    });
}

/**
 * 게시글 상세 조회
 * - 의도: 게시글 ID로 상세 정보 조회
 */
export async function getPostById(postId) {
    return await request({
        method: METHOD.GET,
        url: `/posts/${postId}`
    });
}

/**
 * 게시글 작성
 * - 의도: 새 게시글 생성
 * - 요청: JSON body (userId, title, content, imageObjectKeys 배열)
 */
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

/**
 * 게시글 수정
 * - 의도: 게시글 내용 수정
 * - 요청: JSON body (title, content, imageObjectKeys 배열)
 */
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

/**
 * 게시글 삭제
 * - 의도: 게시글 삭제
 */
export async function deletePost(postId) {
    return await request({
        method: METHOD.DELETE,
        url: `/posts/${postId}`
    });
}

