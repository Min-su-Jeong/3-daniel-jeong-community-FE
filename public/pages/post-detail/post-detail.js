// 전역 변수
let isLiked = false;
let editingCommentId = null;
let comments = [];

// DOM 요소들
const elements = {
    // 게시글 관련
    postTitle: document.getElementById('postTitle'),
    authorName: document.getElementById('authorName'),
    postDate: document.getElementById('postDate'),
    postImage: document.getElementById('postImage'),
    postContent: document.getElementById('postContent'),
    likeBtn: document.getElementById('likeBtn'),
    likeCount: document.getElementById('likeCount'),
    viewCount: document.getElementById('viewCount'),
    commentCount: document.getElementById('commentCount'),
    
    // 버튼들
    editBtn: document.getElementById('editBtn'),
    deleteBtn: document.getElementById('deleteBtn'),
    
    // 댓글 관련
    commentInput: document.getElementById('commentInput'),
    commentSubmitBtn: document.getElementById('commentSubmitBtn'),
    commentsList: document.getElementById('commentsList'),
    
    // 모달들
    deleteModal: document.getElementById('deleteModal'),
    commentDeleteModal: document.getElementById('commentDeleteModal'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelCommentDeleteBtn: document.getElementById('cancelCommentDeleteBtn'),
    confirmCommentDeleteBtn: document.getElementById('confirmCommentDeleteBtn')
};

// 숫자 포맷팅 함수 (1k, 10k, 100k)
function formatNumber(num) {
    if (num >= 100000) {
        return Math.floor(num / 1000) + 'k';
    } else if (num >= 10000) {
        return Math.floor(num / 1000) + 'k';
    } else if (num >= 1000) {
        return Math.floor(num / 1000) + 'k';
    }
    return num.toString();
}

// 게시글 데이터 초기화
function initializePostData() {
    // URL에서 게시글 ID 가져오기 (실제 구현에서는 URL 파라미터 사용)
    const postId = new URLSearchParams(window.location.search).get('id') || '1';
    
    // TODO: API 호출 - 게시글 상세 정보 조회
    // GET /api/posts/{postId}
    // 더미 데이터 (실제 구현에서는 API 호출)
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
    elements.commentCount.textContent = formatNumber(postData.comments);
    
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
                    <div class="comment-actions">
                        <button class="btn-comment-edit" onclick="editComment(${comment.id})">수정</button>
                        <button class="btn-comment-delete" onclick="deleteComment(${comment.id})">삭제</button>
                    </div>
                ` : ''}
            </div>
        </div>
        <div class="comment-content">${comment.content}</div>
    `;
    
    return commentDiv;
}

// 좋아요 기능
function toggleLike() {
    // TODO: API 호출 - 좋아요 토글
    // POST /api/posts/{postId}/like 또는 DELETE /api/posts/{postId}/like
    isLiked = !isLiked;
    const currentCount = parseInt(elements.likeCount.textContent.replace('k', '000'));
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
    const hasText = elements.commentInput.value.trim().length > 0;
    elements.commentSubmitBtn.disabled = !hasText;
}

// 댓글 등록
function submitComment() {
    const content = elements.commentInput.value.trim();
    if (!content) return;
    
    // TODO: API 호출 - 댓글 등록
    // POST /api/posts/{postId}/comments
    // 새 댓글 추가
    const newComment = {
        id: Date.now(),
        author: '현재 사용자',
        date: new Date().toLocaleString('ko-KR'),
        content: content,
        isEditable: true
    };
    comments.push(newComment);
    
    elements.commentInput.value = '';
    elements.commentSubmitBtn.disabled = true;
    
    renderComments();
}

// 댓글 수정
function editComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 이미 수정 모드인지 확인
    if (editingCommentId === commentId) return;
    
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
            <div class="comment-edit-actions">
                <button class="btn-comment-save" onclick="saveCommentEdit(${commentId})">저장</button>
                <button class="btn-comment-cancel" onclick="cancelCommentEdit(${commentId})">취소</button>
            </div>
        </div>
    `;
    
    // 입력창에 포커스
    const textarea = contentElement.querySelector('.comment-edit-input');
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

// 댓글 삭제
function deleteComment(commentId) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;
    
    // 삭제 확인 모달 표시
    showModal(elements.commentDeleteModal);
    
    // 확인 버튼에 이벤트 리스너 추가
    const confirmBtn = elements.confirmCommentDeleteBtn;
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
        // TODO: API 호출 - 댓글 삭제
        // DELETE /api/comments/{commentId}
        comments = comments.filter(c => c.id !== commentId);
        renderComments();
        hideModal(elements.commentDeleteModal);
    });
}

// 게시글 수정
function editPost() {
    // 게시글 수정 페이지로 이동 (실제 구현에서는 라우팅 사용)
    window.location.href = `/post-edit?id=${new URLSearchParams(window.location.search).get('id') || '1'}`;
}

// 게시글 삭제
function deletePost() {
    showModal(elements.deleteModal);
}

// 모달 표시
function showModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// 모달 숨기기
function hideModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// 이벤트 리스너 등록
function setupEventListeners() {
    // 좋아요 버튼
    elements.likeBtn.addEventListener('click', toggleLike);
    
    // 댓글 입력
    elements.commentInput.addEventListener('input', handleCommentInput);
    elements.commentSubmitBtn.addEventListener('click', submitComment);
    
    // 게시글 액션 버튼들
    elements.editBtn.addEventListener('click', editPost);
    elements.deleteBtn.addEventListener('click', deletePost);
    
    // 모달 관련
    elements.cancelDeleteBtn.addEventListener('click', () => hideModal(elements.deleteModal));
    elements.confirmDeleteBtn.addEventListener('click', () => {
        // TODO: API 호출 - 게시글 삭제
        // DELETE /api/posts/{postId}
        hideModal(elements.deleteModal);
        // 게시글 목록으로 이동
        window.location.href = '/post-list';
    });
    
    elements.cancelCommentDeleteBtn.addEventListener('click', () => hideModal(elements.commentDeleteModal));
    
    // 모달 배경 클릭 시 닫기
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            hideModal(elements.deleteModal);
        }
    });
    
    elements.commentDeleteModal.addEventListener('click', (e) => {
        if (e.target === elements.commentDeleteModal) {
            hideModal(elements.commentDeleteModal);
        }
    });
    
    // ESC 키로 모달 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (elements.deleteModal.classList.contains('show')) {
                hideModal(elements.deleteModal);
            }
            if (elements.commentDeleteModal.classList.contains('show')) {
                hideModal(elements.commentDeleteModal);
            }
        }
    });
}

// 페이지 초기화
function initializePage() {
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
        alert('댓글 내용을 입력해주세요.');
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

// 전역 함수로 노출
window.editComment = editComment;
window.deleteComment = deleteComment;
window.saveCommentEdit = saveCommentEdit;
window.cancelCommentEdit = cancelCommentEdit;