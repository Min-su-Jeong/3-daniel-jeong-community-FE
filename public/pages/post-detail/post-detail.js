import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { initializeElements, getElementValue, setElementValue, navigateTo, getUrlParam } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { getPostById, deletePost as deletePostApi } from '../../api/posts.js';
import { addPostLike, removePostLike } from '../../api/post-like.js';
import { createComment, updateComment, deleteComment as deleteCommentApi } from '../../api/comments.js';
import { API_SERVER_URI } from '../../utils/constants.js';

let isLiked = false;
let isLikePending = false;
let editingCommentId = null;
let comments = [];
let currentPostId = null;
let currentUserId = null;
let elements = {};
let likeCountValue = 0;
let commentCountValue = 0;

/**
 * 현재 사용자 정보 가져오기
 * @returns {Object|null} - 사용자 정보 객체 또는 null
 */
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

/**
 * 댓글 수 업데이트
 * @param {number} delta - 변경할 댓글 수 (증가/감소)
 */
const updateCommentCount = (delta) => {
    commentCountValue = Math.max(0, commentCountValue + delta);
    elements.commentCount.textContent = formatNumber(commentCountValue);
};

/**
 * 공통 버튼 생성
 * @param {Array} configs - 버튼 설정 배열
 * @param {HTMLElement} container - 버튼을 추가할 컨테이너
 * @param {string} cssClass - 추가할 CSS 클래스
 */
const createButtons = (configs, container, cssClass = '') => {
    if (!container) return;
    configs.forEach(config => {
        new Button({ ...config, size: 'small' }).appendTo(container);
    });
    if (cssClass) {
        container.querySelectorAll('.btn').forEach(btn => btn.classList.add(cssClass));
    }
};

/**
 * DOM 요소 초기화
 */
const initElements = () => {
    elements = initializeElements({
        postTitle: 'postTitle',
        authorName: 'authorName',
        postDate: 'postDate',
        postImage: 'postImage',
        postContent: 'postContent',
        likeBtn: 'likeBtn',
        likeCount: 'likeCount',
        viewCount: 'viewCount',
        commentCount: 'commentCount',
        postActions: 'postActions',
        commentSubmitBtnContainer: 'commentSubmitBtn',
        commentsList: 'commentsList',
        commentInput: 'commentInput'
    });
};

/**
 * 게시글 이미지 렌더링
 * @param {Array<string>} imageKeys - 이미지 objectKey 배열
 */
const renderPostImages = (imageKeys) => {
    if (!elements.postImage || !imageKeys?.length) {
        if (elements.postImage) {
            elements.postImage.innerHTML = '';
            elements.postImage.style.display = 'none';
        }
        return;
    }

    elements.postImage.style.display = 'block';
    
    if (imageKeys.length === 1) {
        const img = document.createElement('img');
        img.src = `${API_SERVER_URI}/files/${imageKeys[0]}`;
        img.className = 'post-image-item';
        img.onerror = () => img.remove();
        elements.postImage.innerHTML = '';
        elements.postImage.appendChild(img);
    } else {
        const gallery = document.createElement('div');
        gallery.className = 'post-image-gallery';
        imageKeys.forEach((key, i) => {
            const container = document.createElement('div');
            container.className = 'post-image-item-container';
            const img = document.createElement('img');
            img.src = `${API_SERVER_URI}/files/${key}`;
            img.className = 'post-image-item';
            img.onerror = () => container.remove();
            container.appendChild(img);
            gallery.appendChild(container);
        });
        elements.postImage.innerHTML = '';
        elements.postImage.appendChild(gallery);
    }
};

/**
 * 게시글 데이터 표시
 * @param {Object} post - 게시글 데이터 객체
 */
const displayPostData = (post) => {
    elements.postTitle.textContent = post.title || '';
    elements.authorName.textContent = post.author?.nickname || post.author?.name || '작성자';
    elements.postDate.textContent = formatDate(new Date(post.createdAt));
    elements.postContent.textContent = post.content || '';
    
    renderPostImages(post.imageObjectKeys || []);
    
    const stats = post.stats || {};
    likeCountValue = stats.likeCount || 0;
    commentCountValue = stats.commentCount || 0;
    elements.likeCount.textContent = formatNumber(likeCountValue);
    elements.viewCount.textContent = formatNumber(stats.viewCount || 0);
    elements.commentCount.textContent = formatNumber(commentCountValue);
    
    if (typeof post.isLiked === 'boolean') {
        isLiked = post.isLiked;
        elements.likeBtn.classList.toggle('liked', isLiked);
        elements.likeBtn.setAttribute('aria-pressed', String(isLiked));
    }
};

/**
 * 댓글 데이터 처리 및 렌더링
 * @param {Array} commentsData - 댓글 데이터 배열
 */
const processComments = (commentsData) => {
    comments = commentsData.map(c => {
        const authorId = c.author?.id || c.author?.userId || null;
        return {
            id: c.id || c.commentId,
            author: c.author?.nickname || c.author?.name || '작성자',
            authorId,
            date: c.createdAt ? formatDate(new Date(c.createdAt)) : '',
            content: c.content || '',
            isEditable: currentUserId && authorId === currentUserId
        };
    });
    renderComments();
};

/**
 * 게시글 액션 버튼 생성 (작성자만 표시)
 * @param {number} postAuthorId - 게시글 작성자 ID
 */
const createActionButtons = (postAuthorId) => {
    if (!currentUserId || !postAuthorId || currentUserId !== postAuthorId) return;
    createButtons(
        [
            { text: '수정', variant: 'primary', onClick: () => currentPostId && navigateTo(`/post-edit?id=${currentPostId}`) },
            { text: '삭제', variant: 'danger', onClick: handleDeletePost }
        ],
        elements.postActions,
        'btn-post-action'
    );
};

/**
 * 게시글 삭제 처리
 */
const handleDeletePost = async () => {
    const confirmed = await Modal.confirmDelete({
        title: '게시글 삭제',
        subtitle: '게시글을 삭제하시겠습니까? 삭제한 내용은 복구할 수 없습니다.'
    });
    if (!confirmed) return;

    try {
        const res = await deletePostApi(currentPostId);
        if (res.success) {
            ToastUtils.success('게시글이 삭제되었습니다.');
            setTimeout(() => navigateTo('/post-list'), 1000);
        }
    } catch (error) {
        ToastUtils.error(error.message || '게시글 삭제에 실패했습니다.');
    }
};

/**
 * 좋아요 토글 (낙관적 업데이트 + 롤백)
 */
const toggleLike = async () => {
    if (isLikePending) return;

    if (!currentUserId) {
        const confirmed = await Modal.confirm({
            title: '로그인 필요',
            subtitle: '회원만 좋아요를 할 수 있습니다. 로그인 페이지로 이동하시겠습니까?'
        });
        if (confirmed) navigateTo('/login');
        return;
    }

    const prevLiked = isLiked;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? likeCountValue + 1 : Math.max(0, likeCountValue - 1);

    isLiked = nextLiked;
    elements.likeBtn.classList.toggle('liked', isLiked);
    elements.likeCount.textContent = formatNumber(nextCount);
    likeCountValue = nextCount;
    elements.likeBtn.style.transform = 'scale(1.1)';
    setTimeout(() => { elements.likeBtn.style.transform = 'scale(1)'; }, 200);

    try {
        isLikePending = true;
        const res = nextLiked
            ? await addPostLike(currentPostId, currentUserId)
            : await removePostLike(currentPostId, currentUserId);
        
        const data = res.data;
        if (data?.likeCount !== undefined) {
            likeCountValue = data.likeCount;
            elements.likeCount.textContent = formatNumber(likeCountValue);
        }
        if (typeof data?.isLiked === 'boolean') {
            isLiked = data.isLiked;
            elements.likeBtn.classList.toggle('liked', isLiked);
        }
    } catch (error) {
        isLiked = prevLiked;
        elements.likeBtn.classList.toggle('liked', isLiked);
        elements.likeCount.textContent = formatNumber(likeCountValue);
        ToastUtils.error(error.message || '좋아요 처리에 실패했습니다.');
    } finally {
        isLikePending = false;
    }
};

/**
 * 댓글 목록 렌더링
 */
const renderComments = () => {
    if (!elements.commentsList) return;
    elements.commentsList.innerHTML = '';
    comments.forEach(comment => {
        elements.commentsList.appendChild(createCommentElement(comment));
    });
};

/**
 * 댓글 요소 생성
 * @param {Object} comment - 댓글 데이터 객체
 * @returns {HTMLElement} - 댓글 DOM 요소
 */
const createCommentElement = (comment) => {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.dataset.commentId = comment.id;
    
    div.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="author-avatar">👤</div>
                <span class="author-name">${comment.author}</span>
            </div>
            <div class="comment-meta">
                <span class="comment-date">${comment.date}</span>
                ${comment.isEditable ? `<div class="comment-actions" id="commentActions-${comment.id}"></div>` : ''}
            </div>
        </div>
        <div class="comment-content">${comment.content}</div>
    `;
    
    if (comment.isEditable) {
        const container = div.querySelector(`#commentActions-${comment.id}`);
        createButtons(
            [
                { text: '수정', variant: 'primary', onClick: () => editComment(comment.id) },
                { text: '삭제', variant: 'danger', onClick: () => deleteComment(comment.id) }
            ],
            container,
            'btn-comment-action'
        );
    }
    
    return div;
};

/**
 * 댓글 입력 처리
 */
const handleCommentInput = () => {
    const hasText = getElementValue(elements.commentInput).trim().length > 0;
    elements.commentSubmitBtn?.setDisabled?.(!hasText);
};

/**
 * 댓글 등록
 */
const submitComment = async () => {
    const content = getElementValue(elements.commentInput).trim();
    if (!content) return;

    if (!currentUserId) {
        const confirmed = await Modal.confirm({
            title: '로그인 필요',
            subtitle: '회원만 댓글을 작성할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?'
        });
        if (confirmed) navigateTo('/login');
        return;
    }

    if (!currentPostId) {
        ToastUtils.error('게시글 ID가 없습니다.');
        return;
    }

    try {
        const res = await createComment(currentPostId, currentUserId, content);
        const data = res.data;
        
        if (data) {
            const user = getCurrentUser();
            comments.push({
                id: data.commentId || data.id,
                author: data.author?.nickname || data.author?.name || user?.nickname || '작성자',
                authorId: currentUserId,
                date: data.createdAt ? formatDate(new Date(data.createdAt)) : formatDate(new Date()),
                content: data.content || content,
                isEditable: true
            });
        }

        setElementValue(elements.commentInput, '');
        elements.commentSubmitBtn?.setDisabled?.(true);
        renderComments();
        updateCommentCount(1);
        ToastUtils.success('댓글이 등록되었습니다.');
    } catch (error) {
        ToastUtils.error(error.message || '댓글 등록에 실패했습니다.');
    }
};

/**
 * 댓글 수정 모드로 전환
 * @param {number} commentId - 댓글 ID
 */
const editComment = (commentId) => {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    editingCommentId = commentId;
    const element = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!element) return;

    const contentEl = element.querySelector('.comment-content');
    contentEl.innerHTML = `
        <div class="comment-edit-form">
            <textarea class="comment-edit-input" placeholder="댓글을 입력하세요...">${comment.content}</textarea>
            <div class="comment-edit-actions" id="editActions-${commentId}"></div>
        </div>
    `;

    const actionsContainer = contentEl.querySelector(`#editActions-${commentId}`);
    createButtons(
        [
            { text: '저장', variant: 'primary', onClick: () => saveCommentEdit(commentId) },
            { text: '취소', variant: 'secondary', onClick: () => { editingCommentId = null; renderComments(); } }
        ],
        actionsContainer,
        'btn-comment-action'
    );

    const textarea = contentEl.querySelector('.comment-edit-input');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};

/**
 * 댓글 수정 저장
 * @param {number} commentId - 댓글 ID
 */
const saveCommentEdit = async (commentId) => {
    const element = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!element) return;

    const textarea = element.querySelector('.comment-edit-input');
    const newContent = textarea.value.trim();

    if (!newContent) {
        Modal.alert({ title: '입력 오류', subtitle: '댓글 내용을 입력해주세요.' });
        return;
    }

    if (!currentPostId) {
        ToastUtils.error('게시글 ID가 없습니다.');
        return;
    }

    try {
        const res = await updateComment(currentPostId, commentId, newContent);
        const data = res.data;
        
        const comment = comments.find(c => c.id === commentId);
        if (comment && data) {
            comment.content = data.content || newContent;
        }

        editingCommentId = null;
        renderComments();
        ToastUtils.success('댓글이 수정되었습니다.');
    } catch (error) {
        ToastUtils.error(error.message || '댓글 수정에 실패했습니다.');
    }
};

/**
 * 댓글 삭제
 * @param {number} commentId - 댓글 ID
 */
const deleteComment = async (commentId) => {
    if (!currentPostId || !comments.find(c => c.id === commentId)) return;

    const confirmed = await Modal.confirmDelete({
        title: '댓글 삭제',
        subtitle: '댓글을 삭제하시겠습니까?'
    });
    if (!confirmed) return;

    try {
        await deleteCommentApi(currentPostId, commentId);
        comments = comments.filter(c => c.id !== commentId);
        renderComments();
        updateCommentCount(-1);
        ToastUtils.success('댓글이 삭제되었습니다.');
    } catch (error) {
        ToastUtils.error(error.message || '댓글 삭제에 실패했습니다.');
    }
};

/**
 * 게시글 데이터 로드 및 표시
 */
const initPostData = async () => {
    const postId = getUrlParam('id');
    if (!postId) {
        ToastUtils.error('게시글 ID가 없습니다.');
        navigateTo('/post-list');
        return;
    }

    currentPostId = postId;
    const user = getCurrentUser();
    currentUserId = user?.id || null;

    try {
        const res = await getPostById(postId);
        const post = res.data;

        if (!post) {
            ToastUtils.error('게시글을 찾을 수 없습니다.');
            navigateTo('/post-list');
            return;
        }

        displayPostData(post);
        processComments(post.comments || []);
        createActionButtons(post.author?.id || post.author?.userId || null);
    } catch (error) {
        ToastUtils.error(error.message || '게시글을 불러올 수 없습니다.');
        navigateTo('/post-list');
    }
};

/**
 * 페이지 초기화
 */
const initPage = async () => {
    PageLayout.initializePage();
    initElements();
    await initPostData();
    
    elements.likeBtn.addEventListener('click', toggleLike);
    elements.commentInput.addEventListener('input', handleCommentInput);
    
    const submitBtn = new Button({
        text: '댓글 등록',
        variant: 'primary',
        size: 'medium',
        disabled: true,
        onClick: submitComment
    });
    submitBtn.appendTo(elements.commentSubmitBtnContainer);
    elements.commentSubmitBtn = submitBtn;
};

document.addEventListener('DOMContentLoaded', initPage);
