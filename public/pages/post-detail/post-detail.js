import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { initializeElements, getElementValue, setElementValue, navigateTo, getUrlParam } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { getPostById, deletePost as deletePostApi } from '../../api/posts.js';
import { addPostLike, removePostLike } from '../../api/post-like.js';
import { getComments, createComment, updateComment, deleteComment as deleteCommentApi } from '../../api/comments.js';
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
        const userString = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userString ? JSON.parse(userString) : null;
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

// DOM 요소 생성 헬퍼
const createEl = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

// 버튼 생성 및 컨테이너에 추가
const createButtons = (configs, container, cssClass = '') => {
    if (!container) return;
    configs.forEach(config => {
        new Button({ ...config, size: 'small' }).appendTo(container);
    });
    if (cssClass) {
        container.querySelectorAll('.btn').forEach(button => button.classList.add(cssClass));
    }
};

// 로그인 체크 및 리다이렉트
const checkLoginAndRedirect = async (message) => {
    const confirmed = await Modal.confirm({
        title: '로그인 필요',
        subtitle: message
    });
    if (confirmed) navigateTo('/login');
    return confirmed;
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
    
    imageKeys.forEach(imageKey => {
        const imageItem = imageKeys.length === 1 ? document.createElement('img') : document.createElement('div');
        if (imageKeys.length === 1) {
            imageItem.src = `${API_SERVER_URI}/files/${imageKey}`;
            imageItem.className = 'post-image-item';
            imageItem.onerror = () => imageItem.remove();
        } else {
            imageItem.className = 'post-image-item-container';
            const image = document.createElement('img');
            image.src = `${API_SERVER_URI}/files/${imageKey}`;
            image.className = 'post-image-item';
            image.onerror = () => imageItem.remove();
            imageItem.appendChild(image);
        }
        container.appendChild(imageItem);
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

// 댓글 찾기 헬퍼
const findComment = (commentList, targetId) => {
    for (const comment of commentList) {
        if (comment.id === targetId) return comment;
        if (comment.replies?.length) {
            const foundComment = findComment(comment.replies, targetId);
            if (foundComment) return foundComment;
        }
    }
    return null;
};

// 댓글 삭제 헬퍼
const removeComment = (commentList, targetId) => {
    for (let i = 0; i < commentList.length; i++) {
        if (commentList[i].id === targetId) {
            commentList.splice(i, 1);
            return true;
        }
        if (commentList[i].replies?.length && removeComment(commentList[i].replies, targetId)) {
            return true;
        }
    }
    return false;
};

// 댓글 데이터 변환
const transformComment = (commentData) => {
    const parentId = commentData.parentId || commentData.parent_id;
    const normalizedParentId = (parentId && parentId !== 0) ? parentId : null;
    
    return {
        id: commentData.id || commentData.commentId,
        parentId: normalizedParentId,
        author: commentData.author?.nickname || commentData.author?.name || '작성자',
        authorId: commentData.author?.id || commentData.author?.userId || null,
        date: commentData.createdAt ? formatDate(new Date(commentData.createdAt)) : '',
        content: commentData.content || '',
        isEditable: currentUserId && (commentData.author?.id || commentData.author?.userId) === currentUserId,
        replies: []
    };
};

// 댓글 계층 구조 구성
const buildCommentHierarchy = (allComments) => {
    const commentMap = new Map(allComments.map(comment => [comment.id, comment]));
    const rootComments = [];

    allComments.forEach(comment => {
        if (comment.parentId && commentMap.has(comment.parentId)) {
            const parentComment = commentMap.get(comment.parentId);
            parentComment.replies.push(comment);
        } else {
            rootComments.push(comment);
        }
    });

    return rootComments;
};

// 댓글 정렬
const sortComments = (commentList) => {
    commentList.sort((commentA, commentB) => new Date(commentA.date) - new Date(commentB.date));
    commentList.forEach(comment => comment.replies.length && sortComments(comment.replies));
};

// 댓글 데이터 처리 및 렌더링
const processComments = (commentsData) => {
    const allComments = commentsData.map(transformComment);
    const rootComments = buildCommentHierarchy(allComments);
    sortComments(rootComments);
    comments = rootComments;
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
        const response = await deletePostApi(currentPostId);
        if (response.success) {
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
        await checkLoginAndRedirect('회원만 좋아요 기능을 이용할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?');
        return;
    }

    const previousLiked = isLiked;
    const nextLiked = !previousLiked;
    const nextLikeCount = nextLiked ? likeCountValue + 1 : Math.max(0, likeCountValue - 1);

    updateLikeUI(nextLiked);
    updateLikeCount(nextLikeCount);
    elements.likeBtn.style.transform = 'scale(1.1)';
    setTimeout(() => { elements.likeBtn.style.transform = 'scale(1)'; }, 200);

    try {
        isLikePending = true;
        const response = nextLiked
            ? await addPostLike(currentPostId, currentUserId)
            : await removePostLike(currentPostId, currentUserId);
        
        const responseData = response.data;
        if (responseData?.likeCount !== undefined) updateLikeCount(responseData.likeCount);
        if (typeof responseData?.isLiked === 'boolean') updateLikeUI(responseData.isLiked);
    } catch (error) {
        updateLikeUI(previousLiked);
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
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment, 0);
        elements.commentsList.appendChild(commentElement);
    });
};

// 댓글 헤더 생성
const createCommentHeader = (comment) => {
    const header = createEl('div', 'comment-header');
    
    const authorDiv = createEl('div', 'comment-author');
    authorDiv.appendChild(createEl('div', 'author-avatar', '👤'));
    authorDiv.appendChild(createEl('span', 'author-name', comment.author));
    
    const metaDiv = createEl('div', 'comment-meta');
    metaDiv.appendChild(createEl('span', 'comment-date', comment.date));
    
    if (comment.isEditable) {
        const actionsDiv = createEl('div', 'comment-actions');
        actionsDiv.id = `commentActions-${comment.id}`;
        metaDiv.appendChild(actionsDiv);
    }
    
    header.appendChild(authorDiv);
    header.appendChild(metaDiv);
    return header;
};

// 답글 버튼 및 입력창 생성
const createReplySection = (commentId) => {
    const footer = createEl('div', 'comment-footer');
    const replyBtn = createEl('button', 'reply-btn', '답글');
    replyBtn.id = `replyBtn-${commentId}`;
    replyBtn.addEventListener('click', () => toggleReplyInput(commentId));
    footer.appendChild(replyBtn);
    
    const replyInputContainer = createEl('div', 'reply-input-container');
    replyInputContainer.id = `replyInput-${commentId}`;
    replyInputContainer.style.display = 'none';
    
    return { footer, replyInputContainer };
};

// 댓글 요소 생성
const createCommentElement = (comment, depth = 0) => {
    const commentElement = createEl('div', depth > 0 ? 'comment-item comment-reply' : 'comment-item');
    commentElement.dataset.commentId = comment.id;
    commentElement.dataset.depth = depth;
    
    commentElement.appendChild(createCommentHeader(comment));
    commentElement.appendChild(createEl('div', 'comment-content', comment.content));
    
    if (depth === 0 && currentUserId) {
        const { footer, replyInputContainer } = createReplySection(comment.id);
        commentElement.appendChild(footer);
        commentElement.appendChild(replyInputContainer);
    }
    
    const repliesContainer = createEl('div', 'replies-container');
    repliesContainer.id = `replies-${comment.id}`;
    commentElement.appendChild(repliesContainer);
    
    if (comment.isEditable) {
        const actionsContainer = commentElement.querySelector(`#commentActions-${comment.id}`);
        createButtons(
            [
                { text: '수정', variant: 'primary', onClick: () => editComment(comment.id) },
                { text: '삭제', variant: 'danger', onClick: () => deleteComment(comment.id) }
            ],
            actionsContainer,
            'btn-comment-action'
        );
    }
    
    if (comment.replies?.length) {
        comment.replies.forEach(reply => {
            repliesContainer.appendChild(createCommentElement(reply, depth + 1));
        });
    }
    
    return commentElement;
};

// 댓글 입력 처리 (버튼 활성화/비활성화)
const handleCommentInput = () => {
    if (!elements.commentInput || !elements.commentSubmitBtn) return;
    const hasCommentContent = getElementValue(elements.commentInput).trim().length > 0;
    elements.commentSubmitBtn.setDisabled(!hasCommentContent);
};

// 댓글 등록 처리
const submitComment = async (parentId = null) => {
    let content;
    let inputElement;
    
    if (parentId) {
        inputElement = document.querySelector(`#replyInput-${parentId} .reply-input`);
        content = inputElement?.value.trim() || '';
    } else {
        if (!elements.commentInput) {
            console.error('commentInput element not found');
            return;
        }
        inputElement = elements.commentInput;
        content = getElementValue(elements.commentInput).trim();
    }
    
    if (!content) return;
    if (!currentUserId) {
        await checkLoginAndRedirect('회원만 댓글을 작성할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?');
        return;
    }

    try {
        const response = await createComment(currentPostId, currentUserId, content, parentId);
        const responseData = response.data;
        
        if (responseData) {
            const user = getCurrentUser();
            const newComment = {
                id: responseData.commentId || responseData.id,
                parentId: parentId || null,
                author: responseData.author?.nickname || responseData.author?.name || user?.nickname || '작성자',
                authorId: currentUserId,
                date: responseData.createdAt ? formatDate(new Date(responseData.createdAt)) : formatDate(new Date()),
                content: responseData.content || content,
                isEditable: true,
                replies: []
            };
            
            const parentComment = parentId ? findComment(comments, parentId) : null;
            parentComment ? parentComment.replies.push(newComment) : comments.push(newComment);
        }

        if (parentId) {
            if (inputElement) inputElement.value = '';
            toggleReplyInput(parentId);
        } else {
            if (elements.commentInput) {
                setElementValue(elements.commentInput, '');
            }
            if (elements.commentSubmitBtn) {
                elements.commentSubmitBtn.setDisabled(true);
            }
        }
        
        renderComments();
        updateCommentCount(1);
        ToastUtils.success(parentId ? '답글이 등록되었습니다.' : '댓글이 등록되었습니다.');
    } catch (error) {
        ToastUtils.error(error.message || '댓글 등록에 실패했습니다.');
    }
};

// 답글 입력창 생성
const createReplyInputForm = (commentId) => {
    const inputWrapper = createEl('div', 'reply-input-wrapper');
    
    const textarea = createEl('textarea', 'reply-input text-input');
    textarea.placeholder = '답글을 입력하세요...';
    textarea.rows = 2;
    
    const actionsContainer = createEl('div', 'reply-actions');
    actionsContainer.id = `replyActions-${commentId}`;
    
    createButtons(
        [
            { text: '등록', variant: 'primary', onClick: () => submitComment(commentId), size: 'small' },
            { text: '취소', variant: 'secondary', onClick: () => toggleReplyInput(commentId), size: 'small' }
        ],
        actionsContainer,
        'btn-reply-action'
    );
    
    textarea.addEventListener('input', () => {
        const button = actionsContainer.querySelector('.btn');
        if (button) button.disabled = !textarea.value.trim();
    });
    
    inputWrapper.appendChild(textarea);
    inputWrapper.appendChild(actionsContainer);
    return { inputWrapper, textarea };
};

// 답글 입력창 토글
const toggleReplyInput = (commentId) => {
    const container = document.querySelector(`#replyInput-${commentId}`);
    if (!container) return;
    
    const isVisible = container.style.display !== 'none';
    
    if (isVisible) {
        container.style.display = 'none';
        container.innerHTML = '';
    } else {
        document.querySelectorAll('.reply-input-container').forEach(containerElement => {
            if (containerElement.id !== `replyInput-${commentId}`) {
                containerElement.style.display = 'none';
                containerElement.innerHTML = '';
            }
        });
        
        container.style.display = 'block';
        const { inputWrapper, textarea } = createReplyInputForm(commentId);
        container.appendChild(inputWrapper);
        textarea.focus();
    }
};

// 댓글 수정 폼 생성
const createCommentEditForm = (commentId, content) => {
    const editForm = createEl('div', 'comment-edit-form');
    
    const textarea = createEl('textarea', 'comment-edit-input text-input');
    textarea.placeholder = '댓글을 입력하세요...';
    textarea.value = content;
    
    const actionsContainer = createEl('div', 'comment-edit-actions');
    actionsContainer.id = `editActions-${commentId}`;
    
    createButtons(
        [
            { text: '저장', variant: 'primary', onClick: () => saveCommentEdit(commentId) },
            { text: '취소', variant: 'secondary', onClick: () => { editingCommentId = null; renderComments(); } }
        ],
        actionsContainer,
        'btn-comment-action'
    );
    
    editForm.appendChild(textarea);
    editForm.appendChild(actionsContainer);
    return { editForm, textarea };
};

// 댓글 수정 모드로 전환
const editComment = (commentId) => {
    const comment = findComment(comments, commentId);
    if (!comment) return;

    const element = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!element) return;

    editingCommentId = commentId;
    const contentElement = element.querySelector('.comment-content');
    const { editForm, textarea } = createCommentEditForm(commentId, comment.content);
    contentElement.innerHTML = '';
    contentElement.appendChild(editForm);
    
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
        const response = await updateComment(currentPostId, commentId, newContent);
        const comment = findComment(comments, commentId);
        if (comment && response.data) {
            comment.content = response.data.content || newContent;
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
    if (!findComment(comments, commentId)) return;
    if (!await Modal.confirmDelete({ title: '댓글 삭제', subtitle: '댓글을 삭제하시겠습니까?' })) return;

    try {
        await deleteCommentApi(currentPostId, commentId);
        removeComment(comments, commentId);
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
        const response = await getPostById(postId);
        const post = response.data;
        if (!post) {
            ToastUtils.error('게시글을 찾을 수 없습니다.');
            navigateTo('/post-list');
            return;
        }

        displayPostData(post);
        createActionButtons(post.author?.id || post.author?.userId || null);
        
        if (post.comments && Array.isArray(post.comments)) {
            processComments(post.comments);
        } else {
            const commentsResponse = await getComments(postId, 0, 1000);
            const commentsData = commentsResponse.data?.content || commentsResponse.data || [];
            processComments(commentsData);
        }
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
    if (elements.likeBtn) {
        elements.likeBtn.addEventListener('click', toggleLike);
    }
    
    if (elements.commentInput) {
        elements.commentInput.addEventListener('input', handleCommentInput);
    }
    
    // 댓글 등록 버튼 생성
    if (elements.commentSubmitBtnContainer) {
        const submitButton = new Button({
            text: '댓글 등록',
            variant: 'primary',
            size: 'medium',
            disabled: true,
            onClick: () => submitComment(null)
        });
        submitButton.appendTo(elements.commentSubmitBtnContainer);
        elements.commentSubmitBtn = submitButton;
    }
};

// 페이지 나갔다가 돌아올 때 상태 복원 방지
window.addEventListener('pageshow', async (event) => {
    if (event.persisted) {
        // 복원될 때 댓글 데이터가 없으면 다시 로드
        if (!comments || comments.length === 0) {
            await initPostData();
        } else {
            // 수정 모드나 답글 입력창이 열려있으면 닫기
            if (editingCommentId) {
                editingCommentId = null;
                renderComments();
            }
        }
        document.querySelectorAll('.reply-input-container').forEach(container => {
            container.style.display = 'none';
            container.innerHTML = '';
        });
    }
});

document.addEventListener('DOMContentLoaded', initPage);
