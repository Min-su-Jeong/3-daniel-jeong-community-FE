import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { initializeElements, getElementValue, setElementValue, navigateTo, getUrlParam } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { getPostById } from '../../api/posts.js';
import { addPostLike, removePostLike } from '../../api/post-like.js';
import { createComment, updateComment, deleteComment as deleteCommentApi } from '../../api/comments.js';
import { API_SERVER_URI } from '../../utils/constants.js';

// 전역 변수
let isLiked = false;
let isLikePending = false;
let editingCommentId = null;
let comments = [];
let currentPostId = null;
let currentUserId = null;

// DOM 요소들 초기화
let elements = {};

// 현재 사용자 정보 가져오기
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch {
        return null;
    }
}

/**
 * DOM 요소 초기화
 */
function initializePageElements() {
    const elementIds = {
        // 게시글 관련 요소
        postTitle: 'postTitle',
        authorName: 'authorName',
        postDate: 'postDate',
        postImage: 'postImage',
        postContent: 'postContent',
        likeBtn: 'likeBtn',
        likeCount: 'likeCount',
        viewCount: 'viewCount',
        commentCount: 'commentCount',
        
        // 컨테이너
        postActions: 'postActions',
        commentSubmitBtnContainer: 'commentSubmitBtn',
        commentsList: 'commentsList',
        commentInput: 'commentInput'
    };
    
    elements = initializeElements(elementIds);
}

/**
 * 게시글 데이터 로드
 */
async function initializePostData() {
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
        
        const postData = response.data;
        
        if (!postData) {
            console.error('게시글 데이터가 없습니다. 응답:', response);
            ToastUtils.error('게시글을 찾을 수 없습니다.');
            navigateTo('/post-list');
            return;
        }
        
        // 게시글 정보 표시
        elements.postTitle.textContent = postData.title || '';
        elements.authorName.textContent = postData.author?.nickname || postData.author?.name || '작성자';
        elements.postDate.textContent = formatDate(new Date(postData.createdAt));
        elements.postContent.textContent = postData.content || '';
        
        // 게시글 이미지 표시
        renderPostImages(postData.imageObjectKeys || []);
        
        // 통계 정보
        const stats = postData.stats || {};
        elements.likeCount.textContent = formatNumber(stats.likeCount || 0);
        elements.viewCount.textContent = formatNumber(stats.viewCount || 0);
        elements.commentCount.textContent = formatNumber(stats.commentCount || 0);
        
        // 초기 좋아요 상태 (백엔드에서 isLiked 포함 시 반영)
        if (typeof postData.isLiked === 'boolean') {
            isLiked = postData.isLiked;
            elements.likeBtn.classList.toggle('liked', isLiked);
            elements.likeBtn.setAttribute('aria-pressed', String(isLiked));
        }
        
        // 댓글 데이터 - 현재 사용자와 작성자 비교하여 수정 가능 여부 설정
        const postAuthorId = postData.author?.id || postData.author?.userId || null;
        comments = (postData.comments || []).map(comment => {
            const authorId = comment.author?.id || comment.author?.userId || null;
            return {
                id: comment.id || comment.commentId,
                author: comment.author?.nickname || comment.author?.name || '작성자',
                authorId,
                date: comment.createdAt ? formatDate(new Date(comment.createdAt)) : '',
                content: comment.content || '',
                isEditable: currentUserId && authorId === currentUserId
            };
        });
        
        renderComments();
        createActionButtons(postAuthorId);
        
    } catch (error) {
        console.error('게시글 상세 조회 실패:', error);
        console.error('에러 상세:', {
            message: error.message,
            status: error.status,
            stack: error.stack
        });
        ToastUtils.error(error.message || '게시글을 불러올 수 없습니다.');
        navigateTo('/post-list');
    }
}

/**
 * 게시글 이미지 렌더링
 */
function renderPostImages(imageObjectKeys) {
    if (!elements.postImage) return;
    
    // 이미지가 없으면 placeholder 표시
    if (!imageObjectKeys || imageObjectKeys.length === 0) {
        elements.postImage.innerHTML = '';
        elements.postImage.style.display = 'none';
        return;
    }
    
    elements.postImage.style.display = 'block';
    
    // 이미지가 1개인 경우
    if (imageObjectKeys.length === 1) {
        const img = document.createElement('img');
        img.src = `${API_SERVER_URI}/files/${imageObjectKeys[0]}`;
        img.alt = '게시글 이미지';
        img.className = 'post-image-item';
        img.onerror = () => {
            img.style.display = 'none';
        };
        elements.postImage.innerHTML = '';
        elements.postImage.appendChild(img);
    } else {
        // 이미지가 여러 개인 경우 갤러리 형식
        const gallery = document.createElement('div');
        gallery.className = 'post-image-gallery';
        
        imageObjectKeys.forEach((imageKey, index) => {
            const imgContainer = document.createElement('div');
            imgContainer.className = 'post-image-item-container';
            
            const img = document.createElement('img');
            img.src = `${API_SERVER_URI}/files/${imageKey}`;
            img.alt = `게시글 이미지 ${index + 1}`;
            img.className = 'post-image-item';
            img.onerror = () => {
                imgContainer.style.display = 'none';
            };
            
            imgContainer.appendChild(img);
            gallery.appendChild(imgContainer);
        });
        
        elements.postImage.innerHTML = '';
        elements.postImage.appendChild(gallery);
    }
}

// 공통 버튼 생성 함수
function createButtons(buttonConfigs, container, cssClass = '') {
    buttonConfigs.forEach(buttonConfig => {
        const button = new Button({
            ...buttonConfig,
            size: 'small'
        });
        button.appendTo(container);
    });
    
    if (cssClass) {
        const buttons = container.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.classList.add(cssClass);
        });
    }
}

// 공통 Button 컴포넌트로 액션 버튼 생성 (작성자만 표시)
function createActionButtons(postAuthorId) {
    // 작성자만 수정/삭제 버튼 표시
    if (!currentUserId || !postAuthorId || currentUserId !== postAuthorId) {
        return;
    }
    
    const buttons = [
        { text: '수정', variant: 'primary', onClick: editPost },
        { text: '삭제', variant: 'danger', onClick: deletePost }
    ];
    
    createButtons(buttons, elements.postActions, 'btn-post-action');
}

// 댓글 렌더링
function renderComments() {
    elements.commentsList.innerHTML = '';
    comments.forEach(comment => {
        elements.commentsList.appendChild(createCommentElement(comment));
    });
}

// 댓글 요소 생성
function createCommentElement(comment) {
    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment-item';
    commentDiv.dataset.commentId = comment.id;
    
    commentDiv.innerHTML = `
        <div class="comment-header">
            <div class="comment-author">
                <div class="author-avatar">👤</div>
                <span class="author-name">${comment.author}</span>
            </div>
            <div class="comment-meta">
                <span class="comment-date">${comment.date}</span>
                ${comment.isEditable ? `
                    <div class="comment-actions" id="commentActions-${comment.id}"></div>
                ` : ''}
            </div>
        </div>
        <div class="comment-content">${comment.content}</div>
    `;
    
    // 댓글 액션 버튼 생성
    if (comment.isEditable) {
        const actionsContainer = commentDiv.querySelector(`#commentActions-${comment.id}`);
        
        const buttons = [
            { text: '수정', variant: 'primary', onClick: () => editComment(comment.id) },
            { text: '삭제', variant: 'danger', onClick: () => deleteComment(comment.id) }
        ];
        
        createButtons(buttons, actionsContainer, 'btn-comment-action');
    }
    
    return commentDiv;
}

// 좋아요 기능 (API 연동, 낙관적 업데이트 + 롤백)
async function toggleLike() {
    if (isLikePending) return;
    if (!currentUserId) {
        Modal.confirm({
            title: '로그인 필요',
            subtitle: '회원만 좋아요를 할 수 있습니다. 로그인 페이지로 이동하시겠습니까?'
        }).then((confirmed) => confirmed && navigateTo('/login'));
        return;
    }

    const currentText = elements.likeCount.textContent;
    let currentCount = parseInt(currentText.replace(/[kM]/g, '')) || 0;
    if (currentText.includes('K')) currentCount *= 1000;
    if (currentText.includes('M')) currentCount *= 1000000;

    const prevLiked = isLiked;
    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

    // 낙관적 업데이트
    isLiked = nextLiked;
    elements.likeBtn.classList.toggle('liked', isLiked);
    elements.likeCount.textContent = formatNumber(nextCount);
    elements.likeBtn.style.transform = 'scale(1.1)';
    setTimeout(() => elements.likeBtn.style.transform = 'scale(1)', 200);

    try {
        isLikePending = true;
        const res = nextLiked
            ? await addPostLike(currentPostId, currentUserId)
            : await removePostLike(currentPostId, currentUserId);
        const data = res.data;
        if (data && typeof data.likeCount === 'number') {
            elements.likeCount.textContent = formatNumber(data.likeCount);
        }
        if (data && typeof data.isLiked === 'boolean') {
            isLiked = data.isLiked;
            elements.likeBtn.classList.toggle('liked', isLiked);
        }
    } catch (error) {
        // 롤백
        isLiked = prevLiked;
        elements.likeBtn.classList.toggle('liked', isLiked);
        elements.likeCount.textContent = formatNumber(currentCount);
        console.error('like API error', error);
        ToastUtils.error(error.message || '좋아요 처리에 실패했습니다.');
    } finally {
        isLikePending = false;
    }
}

// 댓글 입력 처리
function handleCommentInput() {
    const hasText = getElementValue(elements.commentInput).trim().length > 0;
    if (elements.commentSubmitBtn?.setDisabled) {
        elements.commentSubmitBtn.setDisabled(!hasText);
    }
}

// 댓글 등록
async function submitComment() {
    const content = getElementValue(elements.commentInput).trim();
    if (!content) return;
    
    if (!currentUserId) {
        Modal.confirm({
            title: '로그인 필요',
            subtitle: '회원만 댓글을 작성할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?'
        }).then((confirmed) => {
            if (confirmed) {
                navigateTo('/login');
            }
        });
        return;
    }
    
    if (!currentPostId) {
        ToastUtils.error('게시글 ID가 없습니다.');
        return;
    }
    
    try {
        const response = await createComment(currentPostId, currentUserId, content);
        const newCommentData = response.data;
        
        if (newCommentData) {
            const user = getCurrentUser();
            comments.push({
                id: newCommentData.commentId || newCommentData.id,
                author: newCommentData.author?.nickname || newCommentData.author?.name || user?.nickname || '작성자',
                authorId: currentUserId,
                date: newCommentData.createdAt ? formatDate(new Date(newCommentData.createdAt)) : formatDate(new Date()),
                content: newCommentData.content || content,
                isEditable: true
            });
        }
        
        setElementValue(elements.commentInput, '');
        elements.commentSubmitBtn?.setDisabled(true);
        renderComments();
        // 댓글 수 +1 업데이트
        {
            const currentText = elements.commentCount.textContent;
            let currentCount = parseInt(currentText.replace(/[kM]/g, '')) || 0;
            if (currentText.includes('K')) currentCount *= 1000;
            if (currentText.includes('M')) currentCount *= 1000000;
            elements.commentCount.textContent = formatNumber(currentCount + 1);
        }
        ToastUtils.success('댓글이 등록되었습니다.');
        
    } catch (error) {
        console.error('댓글 등록 실패:', error);
        ToastUtils.error(error.message || '댓글 등록에 실패했습니다.');
    }
}

// 댓글 수정
function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    editingCommentId = commentId;
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;
    
    const contentElement = commentElement.querySelector('.comment-content');
    contentElement.innerHTML = `
        <div class="comment-edit-form">
            <textarea class="comment-edit-input" placeholder="댓글을 입력하세요...">${contentElement.textContent}</textarea>
            <div class="comment-edit-actions" id="editActions-${commentId}"></div>
        </div>
    `;
    
    const editActionsContainer = contentElement.querySelector(`#editActions-${commentId}`);
    createButtons([
        { text: '저장', variant: 'primary', onClick: () => saveCommentEdit(commentId) },
        { text: '취소', variant: 'secondary', onClick: () => cancelCommentEdit() }
    ], editActionsContainer, 'btn-comment-action');
    
    const textarea = contentElement.querySelector('.comment-edit-input');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

// 댓글 삭제
async function deleteComment(commentId) {
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
        // 댓글 수 -1 업데이트
        {
            const currentText = elements.commentCount.textContent;
            let currentCount = parseInt(currentText.replace(/[kM]/g, '')) || 0;
            if (currentText.includes('K')) currentCount *= 1000;
            if (currentText.includes('M')) currentCount *= 1000000;
            elements.commentCount.textContent = formatNumber(Math.max(0, currentCount - 1));
        }
        ToastUtils.success('댓글이 삭제되었습니다.');
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        ToastUtils.error(error.message || '댓글 삭제에 실패했습니다.');
    }
}

// 게시글 수정
function editPost() {
    if (currentPostId) {
        navigateTo(`/post-edit?id=${currentPostId}`);
    }
}

// 게시글 삭제
function deletePost() {
    Modal.confirmDelete({
        title: '게시글 삭제',
        subtitle: '게시글을 삭제하시겠습니까? 삭제한 내용은 복구할 수 없습니다.'
    }).then(confirmed => {
        if (confirmed) {
            navigateTo('/post-list');
        }
    });
}

// 댓글 등록 버튼 생성
function createCommentSubmitButton() {
    const submitButton = new Button({
        text: '댓글 등록',
        variant: 'primary',
        size: 'medium',
        disabled: true, // 초기에는 비활성화
        onClick: submitComment
    });
    submitButton.appendTo(elements.commentSubmitBtnContainer);
    
    elements.commentSubmitBtn = submitButton;
}

// 이벤트 리스너 등록
function setupEventListeners() {
    // 좋아요 버튼
    elements.likeBtn.addEventListener('click', toggleLike);
    
    // 댓글 입력
    elements.commentInput.addEventListener('input', handleCommentInput);
    
    // 댓글 제출 버튼 생성
    createCommentSubmitButton();
}

// 페이지 초기화
async function initializePage() {
    PageLayout.initializePage();
    initializePageElements();
    await initializePostData();
    setupEventListeners();
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', initializePage);

// 댓글 수정 저장
async function saveCommentEdit(commentId) {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;
    
    const textarea = commentElement.querySelector('.comment-edit-input');
    const newContent = textarea.value.trim();
    
    if (!newContent) {
        Modal.alert({
            title: '입력 오류',
            subtitle: '댓글 내용을 입력해주세요.'
        });
        return;
    }
    
    if (!currentPostId) {
        ToastUtils.error('게시글 ID가 없습니다.');
        return;
    }
    
    try {
        const response = await updateComment(currentPostId, commentId, newContent);
        const updatedCommentData = response.data;
        
        const comment = comments.find(c => c.id === commentId);
        if (comment && updatedCommentData) {
            comment.content = updatedCommentData.content || newContent;
        }
        
        editingCommentId = null;
        renderComments();
        ToastUtils.success('댓글이 수정되었습니다.');
        
    } catch (error) {
        console.error('댓글 수정 실패:', error);
        ToastUtils.error(error.message || '댓글 수정에 실패했습니다.');
    }
}

// 댓글 수정 취소
function cancelCommentEdit() {
    editingCommentId = null;
    renderComments();
}