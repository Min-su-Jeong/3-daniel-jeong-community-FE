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

// 현재 로그인한 사용자 정보 가져오기
const getCurrentUser = () => {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
};

// 좋아요 UI 업데이트
const updateLikeUI = (liked) => {
    isLiked = liked;
    elements.likeBtn.classList.toggle('liked', liked);
    elements.likeBtn.setAttribute('aria-pressed', String(liked));
};

// 좋아요 개수 업데이트
const updateLikeCount = (count) => {
    likeCountValue = count;
    elements.likeCount.textContent = formatNumber(count);
};

// 댓글 개수 업데이트
const updateCommentCount = (delta) => {
    commentCountValue = Math.max(0, commentCountValue + delta);
    elements.commentCount.textContent = formatNumber(commentCountValue);
};

// 버튼 생성 및 컨테이너에 추가
const createButtons = (configs, container, cssClass = '') => {
    if (!container) return;
    configs.forEach(config => {
        new Button({ ...config, size: 'small' }).appendTo(container);
    });
    if (cssClass) {
        container.querySelectorAll('.btn').forEach(btn => btn.classList.add(cssClass));
    }
};

// DOM 요소 초기화
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

// 게시글 이미지 렌더링
const renderPostImages = (imageKeys) => {
    if (!elements.postImage || !imageKeys?.length) {
        if (elements.postImage) {
            elements.postImage.innerHTML = '';
            elements.postImage.style.display = 'none';
        }
        return;
    }

    elements.postImage.style.display = 'block';
    elements.postImage.innerHTML = '';
    
    const container = imageKeys.length === 1 ? elements.postImage : document.createElement('div');
    if (imageKeys.length > 1) {
        container.className = 'post-image-gallery';
    }
    
    imageKeys.forEach(key => {
        const item = imageKeys.length === 1 ? document.createElement('img') : document.createElement('div');
        if (imageKeys.length === 1) {
            item.src = `${API_SERVER_URI}/files/${key}`;
            item.className = 'post-image-item';
            item.onerror = () => item.remove();
        } else {
            item.className = 'post-image-item-container';
            const img = document.createElement('img');
            img.src = `${API_SERVER_URI}/files/${key}`;
            img.className = 'post-image-item';
            img.onerror = () => item.remove();
            item.appendChild(img);
        }
        container.appendChild(item);
    });
    
    if (imageKeys.length > 1) {
        elements.postImage.appendChild(container);
    }
};

// 게시글 데이터 표시
const displayPostData = (post) => {
    elements.postTitle.textContent = post.title || '';
    elements.authorName.textContent = post.author?.nickname || post.author?.name || '작성자';
    elements.postDate.textContent = formatDate(new Date(post.createdAt));
    elements.postContent.textContent = post.content || '';
    
    renderPostImages(post.imageObjectKeys || []);
    
    const stats = post.stats || {};
    updateLikeCount(stats.likeCount || 0);
    commentCountValue = stats.commentCount || 0;
    elements.viewCount.textContent = formatNumber(stats.viewCount || 0);
    elements.commentCount.textContent = formatNumber(commentCountValue);
    
    updateLikeUI(typeof post.isLiked === 'boolean' ? post.isLiked : false);
};

// 댓글 데이터 처리 및 렌더링
const processComments = (commentsData) => {
    comments = commentsData.map(c => ({
        id: c.id || c.commentId,
        author: c.author?.nickname || c.author?.name || '작성자',
        authorId: c.author?.id || c.author?.userId || null,
        date: c.createdAt ? formatDate(new Date(c.createdAt)) : '',
        content: c.content || '',
        isEditable: currentUserId && (c.author?.id || c.author?.userId) === currentUserId
    }));
    renderComments();
};

// 게시글 수정/삭제 버튼 생성 (작성자만 표시)
const createActionButtons = (postAuthorId) => {
    if (currentUserId !== postAuthorId) return;
    createButtons(
        [
            { text: '수정', variant: 'primary', onClick: () => navigateTo(`/post-edit?id=${currentPostId}`) },
            { text: '삭제', variant: 'danger', onClick: handleDeletePost }
        ],
        elements.postActions,
        'btn-post-action'
    );
};

// 게시글 삭제 처리
const handleDeletePost = async () => {
    if (!await Modal.confirmDelete({ title: '게시글 삭제', subtitle: '게시글을 삭제하시겠습니까? <br>삭제한 내용은 복구할 수 없습니다.' })) return;

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

// 좋아요 토글 처리
const toggleLike = async () => {
    if (isLikePending) return;

    if (!currentUserId) {
        const confirmed = await Modal.confirm({
            title: '로그인 필요',
            subtitle: '회원만 좋아요 기능을 이용할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?'
        });
        if (confirmed) navigateTo('/login');
        return;
    }

    const prevLiked = isLiked;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? likeCountValue + 1 : Math.max(0, likeCountValue - 1);

    updateLikeUI(nextLiked);
    updateLikeCount(nextCount);
    elements.likeBtn.style.transform = 'scale(1.1)';
    setTimeout(() => { elements.likeBtn.style.transform = 'scale(1)'; }, 200);

    try {
        isLikePending = true;
        const res = nextLiked
            ? await addPostLike(currentPostId, currentUserId)
            : await removePostLike(currentPostId, currentUserId);
        
        const data = res.data;
        if (data?.likeCount !== undefined) updateLikeCount(data.likeCount);
        if (typeof data?.isLiked === 'boolean') updateLikeUI(data.isLiked);
    } catch (error) {
        updateLikeUI(prevLiked);
        updateLikeCount(likeCountValue);
        ToastUtils.error(error.message || '좋아요 처리에 실패했습니다.');
    } finally {
        isLikePending = false;
    }
};

// 댓글 목록 렌더링
const renderComments = () => {
    if (!elements.commentsList) return;
    elements.commentsList.innerHTML = '';
    comments.forEach(comment => elements.commentsList.appendChild(createCommentElement(comment)));
};

// 댓글 요소 생성
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

// 댓글 입력 처리 (버튼 활성화/비활성화)
const handleCommentInput = () => {
    elements.commentSubmitBtn?.setDisabled?.(!getElementValue(elements.commentInput).trim().length);
};

// 댓글 등록 처리
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

// 댓글 수정 모드로 전환
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

    createButtons(
        [
            { text: '저장', variant: 'primary', onClick: () => saveCommentEdit(commentId) },
            { text: '취소', variant: 'secondary', onClick: () => { editingCommentId = null; renderComments(); } }
        ],
        contentEl.querySelector(`#editActions-${commentId}`),
        'btn-comment-action'
    );

    const textarea = contentEl.querySelector('.comment-edit-input');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};

// 댓글 수정 저장
const saveCommentEdit = async (commentId) => {
    const element = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!element) return;

    const newContent = element.querySelector('.comment-edit-input').value.trim();
    if (!newContent) {
        Modal.alert({ title: '입력 오류', subtitle: '댓글 내용을 입력해주세요.' });
        return;
    }

    try {
        const res = await updateComment(currentPostId, commentId, newContent);
        const comment = comments.find(c => c.id === commentId);
        if (comment && res.data) {
            comment.content = res.data.content || newContent;
        }

        editingCommentId = null;
        renderComments();
        ToastUtils.success('댓글이 수정되었습니다.');
    } catch (error) {
        ToastUtils.error(error.message || '댓글 수정에 실패했습니다.');
    }
};

// 댓글 삭제 처리
const deleteComment = async (commentId) => {
    if (!comments.find(c => c.id === commentId)) return;
    if (!await Modal.confirmDelete({ title: '댓글 삭제', subtitle: '댓글을 삭제하시겠습니까?' })) return;

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

// 게시글 데이터 초기화 및 로드
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

// 페이지 초기화
const initPage = async () => {
    PageLayout.initializePage();
    initElements();
    await initPostData();
    
    // 이벤트 리스너 등록
    elements.likeBtn.addEventListener('click', toggleLike);
    elements.commentInput.addEventListener('input', handleCommentInput);
    
    // 댓글 등록 버튼 생성
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
