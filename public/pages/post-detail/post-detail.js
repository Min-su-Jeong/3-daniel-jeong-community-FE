import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { initializeElements, getElementValue, setElementValue, navigateTo, getUrlParam } from '../../utils/common/dom.js';

// 전역 변수
let isLiked = false;
let editingCommentId = null;
let comments = [];

// DOM 요소들 초기화
let elements = {};

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
    elements.commentSubmitBtn = null; // 동적으로 생성되므로 별도 설정
}

/**
 * 게시글 데이터 로드
 */
function initializePostData() {
    // URL에서 게시글 ID 가져오기
    const postId = getUrlParam('id');
    
    // TODO: API 호출 - 게시글 상세 정보 조회
    // GET /api/posts/{postId}
    const postData = {
        id: postId,
        title: '제목 1',
        author: '더미 작성자 1',
        date: '2021-01-01 00:00:00',
        content: '게시글 내용이 여기에 표시됩니다. 이 부분은 실제 게시글의 내용을 보여주는 영역입니다.\n\n사용자가 작성한 글이 여기에 표시되며, 줄바꿈과 포맷팅이 유지됩니다.\n\n이것은 긴 텍스트 예시입니다.',
        image: null,
        likes: 123,
        views: 123,
        comments: 123
    };
    
    // 게시글 정보 표시
    elements.postTitle.textContent = postData.title;
    elements.authorName.textContent = postData.author;
    elements.postDate.textContent = postData.date;
    elements.postContent.textContent = postData.content;
    elements.likeCount.textContent = formatNumber(postData.likes);
    elements.viewCount.textContent = formatNumber(postData.views);
    
    // 공통 Button 컴포넌트로 액션 버튼 생성
    createActionButtons();
    
    // TODO: API 호출 - 댓글 목록 조회
    // GET /api/posts/{postId}/comments
    // 댓글 데이터 초기화
    comments = [
        {
            id: 1,
            author: '더미 작성자 1',
            date: '2021-01-01 00:00:00',
            content: '댓글 내용입니다.',
            isEditable: true
        },
        {
            id: 2,
            author: '더미 작성자 2',
            date: '2021-01-01 01:00:00',
            content: '또 다른 댓글입니다.',
            isEditable: false
        }
    ];
    
    renderComments();
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

// 공통 Button 컴포넌트로 액션 버튼 생성
function createActionButtons() {
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
        const commentElement = createCommentElement(comment);
        elements.commentsList.appendChild(commentElement);
    });
    
    // 댓글 수 업데이트
    elements.commentCount.textContent = formatNumber(comments.length);
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
                    <div class="comment-actions" id="commentActions-${comment.id}">
                        <!-- 동적으로 버튼이 추가됩니다 -->
                    </div>
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

// 좋아요 기능
function toggleLike() {
    // TODO: API 호출 - 좋아요 토글
    // POST /api/posts/{postId}/like 또는 DELETE /api/posts/{postId}/like
    isLiked = !isLiked;
    
    // 현재 카운트를 숫자로 변환 (K, M 단위 고려)
    const currentText = elements.likeCount.textContent;
    let currentCount = parseInt(currentText.replace(/[kM]/g, ''));
    if (currentText.includes('K')) currentCount *= 1000;
    if (currentText.includes('M')) currentCount *= 1000000;
    
    const newCount = isLiked ? currentCount + 1 : currentCount - 1;
    
    elements.likeCount.textContent = formatNumber(newCount);
    elements.likeBtn.classList.toggle('liked', isLiked);
    
    // 애니메이션 효과
    elements.likeBtn.style.transform = 'scale(1.1)';
    setTimeout(() => {
        elements.likeBtn.style.transform = 'scale(1)';
    }, 200);
}

// 댓글 입력 처리
function handleCommentInput() {
    const hasText = getElementValue(elements.commentInput).trim().length > 0;
    if (elements.commentSubmitBtn && elements.commentSubmitBtn.setDisabled) {
        elements.commentSubmitBtn.setDisabled(!hasText);
    }
}

// 댓글 등록
function submitComment() {
    const content = getElementValue(elements.commentInput).trim();
    if (!content) return;
    
    // TODO: API 호출 - 댓글 등록
    // POST /api/posts/{postId}/comments
    // 새 댓글 추가
    const newComment = {
        id: Date.now(),
        author: '현재 사용자',
        date: formatDate(new Date()),
        content: content,
        isEditable: true
    };
    comments.push(newComment);
    
    setElementValue(elements.commentInput, '');
    if (elements.commentSubmitBtn && elements.commentSubmitBtn.setDisabled) {
        elements.commentSubmitBtn.setDisabled(true);
    }
    
    renderComments();
}

// 댓글 수정
function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    editingCommentId = commentId;
    
    // 해당 댓글 카드 찾기
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!commentElement) return;
    
    // 댓글 내용 부분을 입력창으로 변경
    const contentElement = commentElement.querySelector('.comment-content');
    const currentContent = contentElement.textContent;
    
    contentElement.innerHTML = `
        <div class="comment-edit-form">
            <textarea class="comment-edit-input" placeholder="댓글을 입력하세요...">${currentContent}</textarea>
            <div class="comment-edit-actions" id="editActions-${commentId}">
                <!-- 동적으로 버튼이 추가됩니다 -->
            </div>
        </div>
    `;
    
    // 수정 폼 버튼 생성
    const editActionsContainer = contentElement.querySelector(`#editActions-${commentId}`);
    
    const buttons = [
        { text: '저장', variant: 'primary', onClick: () => saveCommentEdit(commentId) },
        { text: '취소', variant: 'secondary', onClick: () => cancelCommentEdit(commentId) }
    ];
    
    createButtons(buttons, editActionsContainer, 'btn-comment-action');
    
    // 입력창에 포커스
    const textarea = contentElement.querySelector('.comment-edit-input');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

// 댓글 삭제
function deleteComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 공통 Modal 컴포넌트로 삭제 확인
    Modal.confirmDelete({
        title: '댓글 삭제',
        subtitle: '댓글을 삭제하시겠습니까?'
    }).then(confirmed => {
        if (confirmed) {
            // TODO: API 호출 - 댓글 삭제
            // DELETE /api/comments/{commentId}
            comments = comments.filter(c => c.id !== commentId);
            renderComments();
        }
    });
}

// 게시글 수정
function editPost() {
    // 현재 게시글 ID 가져오기
    const postId = getUrlParam('id');
    
    // 현재 페이지의 게시글 데이터를 가져와서 수정 페이지로 전달
    const currentPostData = {
        id: postId,
        title: elements.postTitle.textContent,
        content: elements.postContent.textContent,
        images: getCurrentPostImages()
    };
    
    // 세션 스토리지에 데이터 저장 (임시)
    sessionStorage.setItem('editPostData', JSON.stringify(currentPostData));
    
    // 게시글 수정 페이지로 이동
    navigateTo(`/post-edit?id=${postId}`);
}

// 현재 게시글의 이미지 데이터 가져오기
function getCurrentPostImages() {
    const imageElements = elements.postImage.querySelectorAll('img');
    return Array.from(imageElements).map((img, index) => ({
        id: index + 1,
        url: img.src,
        alt: img.alt
    }));
}

// 게시글 삭제
function deletePost() {
    // 공통 Modal 컴포넌트로 삭제 확인
    Modal.confirmDelete({
        title: '게시글 삭제',
        subtitle: '게시글을 삭제하시겠습니까? 삭제한 내용은 복구할 수 없습니다.'
    }).then(confirmed => {
        if (confirmed) {
            // TODO: API 호출 - 게시글 삭제
            // DELETE /api/posts/{postId}
            // 게시글 목록으로 이동
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
function initializePage() {
    PageLayout.initializePage();
    initializePageElements();
    initializePostData();
    setupEventListeners();
}

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', initializePage);

// 댓글 수정 저장
function saveCommentEdit(commentId) {
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
    
    // TODO: API 호출 - 댓글 수정
    // PUT /api/comments/{commentId}
    // 댓글 내용 업데이트
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
        comment.content = newContent;
    }
    
    // 수정 모드 종료
    editingCommentId = null;
    
    // 댓글 목록 다시 렌더링
    renderComments();
}

// 댓글 수정 취소
function cancelCommentEdit(commentId) {
    // 수정 모드 종료
    editingCommentId = null;
    
    // 댓글 목록 다시 렌더링
    renderComments();
}