import { Button } from '../../components/button/button.js';
import { Modal } from '../../components/modal/modal.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Toast } from '../../components/toast/toast.js';
import { formatNumber, formatDate, debounce, initializeElements, getElementValue, setElementValue } from '../../utils/common/element.js';
import { navigateTo, getUrlParam } from '../../utils/common/navigation.js';
import { renderProfileImage, extractProfileImageKey } from '../../utils/common/image.js';
import { S3_CONFIG } from '../../utils/constants/image.js';
import { getCurrentUserInfo } from '../../utils/common/user.js';
import { getProductById, deleteProduct as deleteProductApi } from '../../utils/api/marketplace.js';
import { getProductComments, createProductComment, updateProductComment, deleteProductComment } from '../../utils/api/marketplace-comments.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';

let currentProductId = null;
let currentUserId = null;
let currentProduct = null;
let elements = {};
let comments = [];
let editingCommentId = null;

// DOM 요소 생성 헬퍼
const createElement = (tag, className = '', text = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
};

// 상태 텍스트/클래스 매핑
const STATUS_TEXT = {
    SELLING: '판매중',
    RESERVED: '예약중',
    SOLD: '거래완료',
};

const STATUS_CLASS = {
    SELLING: 'status-selling',
    RESERVED: 'status-reserved',
    SOLD: 'status-sold',
};

// 버튼 그룹 생성 및 컨테이너에 추가
const createButtons = (configs, container, cssClass = '') => {
    if (!container) return;
    configs.forEach(config => {
        new Button({ ...config, size: 'small' }).appendTo(container);
    });
    if (cssClass) {
        container.querySelectorAll('.btn').forEach(button => button.classList.add(cssClass));
    }
};

// 로그인 필요 확인 모달 표시 및 로그인 페이지 이동
const checkLoginAndRedirect = async (message) => {
    const confirmed = await Modal.confirm({
        title: '로그인 필요',
        subtitle: message
    });
    if (confirmed) navigateTo('/login');
    return confirmed;
};

// 페이지 DOM 요소 초기화
const initElements = () => {
    elements = initializeElements({
        productTitle: 'productTitle',
        sellerName: 'sellerName',
        sellerAvatar: 'sellerAvatar',
        productDate: 'productDate',
        productLocation: 'productLocation',
        productImages: 'productImages',
        productContent: 'productContent',
        productCategory: 'productCategory',
        productPrice: 'productPrice',
        productStatusBadge: 'productStatusBadge',
        viewCount: 'viewCount',
        productActions: 'productActions',
        commentInput: 'commentInput',
        commentsList: 'commentsList',
        commentSubmitBtnContainer: 'commentSubmitBtn'
    });
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
    const commentAuthorId = commentData.author?.id || commentData.author?.userId || null;

    let profileImageKey = extractProfileImageKey(commentData.author);
    if (commentAuthorId && currentUserId && commentAuthorId === currentUserId) {
        const { profileImageKey: currentUserProfileImageKey } = getCurrentUserInfo();
        profileImageKey = currentUserProfileImageKey || profileImageKey;
    }

    return {
        id: commentData.id || commentData.commentId,
        parentId: normalizedParentId,
        author: commentData.author?.nickname || commentData.author?.name || '작성자',
        authorId: commentAuthorId,
        authorImageKey: profileImageKey,
        date: commentData.createdAt ? formatDate(new Date(commentData.createdAt)) : '',
        content: commentData.content || '',
        isEditable: currentUserId && commentAuthorId === currentUserId,
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

// 댓글 목록 렌더링
const renderComments = () => {
    if (!elements.commentsList) return;
    elements.commentsList.replaceChildren();
    comments.forEach(comment => {
        const commentElement = createCommentElement(comment, 0);
        elements.commentsList.appendChild(commentElement);
    });
};

// 댓글 헤더 생성
const createCommentHeader = (comment) => {
    const header = createElement('div', 'comment-header');

    const authorDiv = createElement('div', 'comment-author');
    const avatarElement = createElement('div', 'author-avatar');

    let profileImageKey = comment.authorImageKey || null;
    if (comment.authorId && currentUserId && comment.authorId === currentUserId) {
        const { profileImageKey: currentUserProfileImageKey } = getCurrentUserInfo();
        profileImageKey = currentUserProfileImageKey || profileImageKey;
    }

    renderProfileImage(avatarElement, profileImageKey);
    authorDiv.appendChild(avatarElement);
    authorDiv.appendChild(createElement('span', 'author-name', comment.author));

    const metaDiv = createElement('div', 'comment-meta');
    metaDiv.appendChild(createElement('span', 'comment-date', comment.date));

    if (comment.isEditable) {
        const actionsDiv = createElement('div', 'comment-actions');
        actionsDiv.id = `commentActions-${comment.id}`;
        metaDiv.appendChild(actionsDiv);
    }

    header.appendChild(authorDiv);
    header.appendChild(metaDiv);
    return header;
};

// 답글 버튼 및 입력창 생성
const createReplySection = (commentId) => {
    const footer = createElement('div', 'comment-footer');
    const replyBtn = createElement('button', 'reply-btn', '답글');
    replyBtn.id = `replyBtn-${commentId}`;
    replyBtn.addEventListener('click', () => toggleReplyInput(commentId));
    footer.appendChild(replyBtn);

    const replyInputContainer = createElement('div', 'reply-input-container');
    replyInputContainer.id = `replyInput-${commentId}`;
    replyInputContainer.style.display = 'none';

    return { footer, replyInputContainer };
};

// 댓글 요소 생성
const createCommentElement = (comment, depth = 0) => {
    const commentElement = createElement('div', depth > 0 ? 'comment-item comment-reply' : 'comment-item');
    commentElement.dataset.commentId = comment.id;
    commentElement.dataset.depth = depth;

    commentElement.appendChild(createCommentHeader(comment));
    commentElement.appendChild(createElement('div', 'comment-content', comment.content));

    if (depth === 0 && currentUserId) {
        const { footer, replyInputContainer } = createReplySection(comment.id);
        commentElement.appendChild(footer);
        commentElement.appendChild(replyInputContainer);
    }

    const repliesContainer = createElement('div', 'replies-container');
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
const handleCommentInput = debounce(() => {
    if (!elements.commentInput || !elements.commentSubmitBtn) return;
    const hasCommentContent = getElementValue(elements.commentInput).trim().length > 0;
    elements.commentSubmitBtn.setDisabled(!hasCommentContent);
}, 150);

// 댓글 입력값 가져오기
const getCommentInput = (parentId) => {
    if (parentId) {
        const inputElement = document.querySelector(`#replyInput-${parentId} .reply-input`);
        return {
            content: inputElement?.value.trim() || '',
            inputElement
        };
    }

    if (!elements.commentInput) {
        console.error('commentInput element not found');
        return null;
    }

    return {
        content: getElementValue(elements.commentInput).trim(),
        inputElement: elements.commentInput
    };
};

// 댓글 객체 생성 (API 응답 데이터를 댓글 객체로 변환)
const mapCommentData = (responseData, parentId) => {
    const { profileImageKey } = getCurrentUserInfo();
    const authorImageKey = profileImageKey || extractProfileImageKey(responseData.author) || null;

    return {
        id: responseData.commentId || responseData.id,
        parentId: parentId || null,
        author: responseData.author?.nickname || responseData.author?.name || '작성자',
        authorId: currentUserId,
        authorImageKey,
        date: responseData.createdAt ? formatDate(new Date(responseData.createdAt)) : formatDate(new Date()),
        content: responseData.content || '',
        isEditable: true,
        replies: []
    };
};

// 댓글을 댓글 목록에 추가
const addComment = (newComment, parentId) => {
    if (parentId) {
        const parentComment = findComment(comments, parentId);
        if (parentComment) {
            parentComment.replies.push(newComment);
            return;
        }
    }
    comments.push(newComment);
};

// 입력 필드 초기화
const resetCommentInput = (inputElement, parentId) => {
    if (parentId) {
        if (inputElement) inputElement.value = '';
        toggleReplyInput(parentId);
        return;
    }

    if (elements.commentInput) {
        setElementValue(elements.commentInput, '');
    }
    if (elements.commentSubmitBtn) {
        elements.commentSubmitBtn.setDisabled(true);
    }
};

// 댓글 등록 처리
const submitComment = async (parentId = null) => {
    const inputData = getCommentInput(parentId);
    if (!inputData || !inputData.content) return;

    if (!currentUserId) {
        await checkLoginAndRedirect('회원만 댓글을 작성할 수 있습니다. <br>로그인 페이지로 이동하시겠습니까?');
        return;
    }

    try {
        const response = await createProductComment(currentProductId, currentUserId, inputData.content, parentId);
        const responseData = response.data;

        if (!responseData) return;

        const newComment = mapCommentData(responseData, parentId);
        addComment(newComment, parentId);

        resetCommentInput(inputData.inputElement, parentId);

        renderComments();

        const successMessage = parentId
            ? TOAST_MESSAGE.COMMENT_REPLY_SUCCESS
            : TOAST_MESSAGE.COMMENT_CREATE_SUCCESS;
        Toast.success(successMessage);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.COMMENT_CREATE_FAILED);
    }
};

// 답글 입력창 생성
const createReplyInputForm = (commentId) => {
    const inputWrapper = createElement('div', 'reply-input-wrapper');

    const textarea = createElement('textarea', 'reply-input text-input');
    textarea.placeholder = PLACEHOLDER.REPLY;
    textarea.rows = 2;

    const actionsContainer = createElement('div', 'reply-actions');
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
        container.replaceChildren();
        return;
    }

    const allContainers = document.querySelectorAll('.reply-input-container');
    allContainers.forEach(containerElement => {
        if (containerElement.id === `replyInput-${commentId}`) return;

        containerElement.style.display = 'none';
        containerElement.replaceChildren();
    });

    container.style.display = 'block';
    const { inputWrapper, textarea } = createReplyInputForm(commentId);
    container.appendChild(inputWrapper);
    textarea.focus();
};

// 댓글 수정 폼 생성
const createCommentEditForm = (commentId, content) => {
    const editForm = createElement('div', 'comment-edit-form');

    const textarea = createElement('textarea', 'comment-edit-input text-input');
    textarea.placeholder = PLACEHOLDER.COMMENT;
    textarea.value = content;

    const actionsContainer = createElement('div', 'comment-edit-actions');
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
    if (!contentElement) return;

    const { editForm, textarea } = createCommentEditForm(commentId, comment.content);

    contentElement.replaceChildren(editForm);

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
};

// 댓글 수정 저장
const saveCommentEdit = async (commentId) => {
    const element = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (!element) return;

    const editInput = element.querySelector('.comment-edit-input');
    if (!editInput) return;

    const newContent = editInput.value.trim();
    if (!newContent) {
        Modal.alert({ title: MODAL_MESSAGE.TITLE_INPUT_ERROR, subtitle: VALIDATION_MESSAGE.COMMENT_REQUIRED });
        return;
    }

    try {
        const response = await updateProductComment(currentProductId, commentId, newContent);
        const comment = findComment(comments, commentId);

        if (comment && response.data) {
            comment.content = response.data.content || newContent;
        }

        editingCommentId = null;
        renderComments();
        Toast.success(TOAST_MESSAGE.COMMENT_UPDATE_SUCCESS);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.COMMENT_UPDATE_FAILED);
    }
};

// 댓글 삭제 처리
const deleteComment = async (commentId) => {
    if (!findComment(comments, commentId)) return;
    if (!await Modal.confirmDelete({ title: MODAL_MESSAGE.TITLE_DELETE, subtitle: MODAL_MESSAGE.SUBTITLE_COMMENT_DELETE })) return;

    try {
        await deleteProductComment(currentProductId, commentId);
        removeComment(comments, commentId);
        renderComments();
        Toast.success(TOAST_MESSAGE.COMMENT_DELETE_SUCCESS);
    } catch (error) {
        Toast.error(error.message || TOAST_MESSAGE.COMMENT_DELETE_FAILED);
    }
};

// 댓글 데이터 로드 (상품 댓글용)
const loadComments = async (productId) => {
    const response = await getProductComments(productId, 0, 1000);
    const commentsData = response.data?.content || response.data || [];
    processComments(commentsData);
};

// 상품 이미지 렌더링
const renderProductImages = (imageKeys) => {
    if (!elements.productImages) return;

    elements.productImages.replaceChildren();

    // 이미지가 하나도 없으면 이미지 영역 숨김
    if (!imageKeys || imageKeys.length === 0) {
        elements.productImages.style.display = 'none';
        return;
    }

    elements.productImages.style.display = 'block';
    
    const isSingleImage = imageKeys.length === 1;
    const container = isSingleImage ? elements.productImages : document.createElement('div');
    
    if (!isSingleImage) {
        container.className = 'product-image-gallery';
    }
    
    imageKeys.forEach(imageKey => {
        if (isSingleImage) {
            const imageItem = document.createElement('img');
            imageItem.className = 'product-image-item';
            imageItem.onerror = () => imageItem.remove();
            
            S3_CONFIG.getPublicUrl(imageKey).then(url => {
                if (url) imageItem.src = url;
            });
            
            container.appendChild(imageItem);
        } else {
            const imageItem = document.createElement('div');
            imageItem.className = 'product-image-item-container';
            
            const image = document.createElement('img');
            image.className = 'product-image-item';
            image.onerror = () => imageItem.remove();
            
            S3_CONFIG.getPublicUrl(imageKey).then(url => {
                if (url) image.src = url;
            });
            
            imageItem.appendChild(image);
            container.appendChild(imageItem);
        }
    });
    
    if (!isSingleImage) {
        elements.productImages.appendChild(container);
    }
};

// 카테고리 텍스트 변환
const getCategoryText = (category) => {
    const categoryMap = {
        'swimsuit': '수영복',
        'goggles': '수영고글',
        'cap': '수영모',
        'training': '훈련용품',
        'fins': '오리발',
        'bag': '가방/액세서리'
    };
    return categoryMap[category] || category;
};

// 상품 수정/삭제 버튼 생성 (판매자만 표시)
const createActionButtons = (sellerId) => {
    if (currentUserId !== sellerId) return;
    createButtons(
        [
            { text: '수정', variant: 'primary', onClick: handleEditProduct },
            { text: '삭제', variant: 'danger', onClick: handleDeleteProduct }
        ],
        elements.productActions,
        'btn-product-action'
    );
};

// 상품 수정 페이지로 이동 (세션 스토리지에 데이터 저장)
const handleEditProduct = () => {
    if (currentProduct) {
        // 세션 스토리지에 상품 데이터 저장 (뒤로가기 후 재진입 시 사용)
        sessionStorage.setItem('editProductData', JSON.stringify(currentProduct));
    }
    navigateTo(`/marketplace-edit?id=${currentProductId}`);
};

// 상품 삭제 처리
const handleDeleteProduct = async () => {
    const confirmed = await Modal.confirmDelete({
        title: MODAL_MESSAGE.TITLE_DELETE,
        subtitle: MODAL_MESSAGE.SUBTITLE_PRODUCT_DELETE
    });
    
    if (!confirmed) return;
    
    try {
        const response = await deleteProductApi(currentProductId);
        
        if (!response.success) {
            throw new Error(response.message || '상품 삭제에 실패했습니다');
        }
        
        Toast.success('상품이 삭제되었습니다');
        navigateTo('/marketplace');
    } catch (error) {
        Toast.error(error.message || '상품 삭제에 실패했습니다');
    }
};

// 사용자 프로필 업데이트 시 현재 사용자가 작성한 상품/댓글의 프로필 이미지 업데이트
const updateCurrentUserProfileImages = () => {
    if (!currentUserId) return;

    const { profileImageKey: updatedProfileImageKey } = getCurrentUserInfo();

    // 현재 사용자가 판매자인 경우 판매자 아바타 업데이트
    if (currentProduct && elements.sellerAvatar) {
        const sellerId = currentProduct.seller?.id || currentProduct.seller?.userId;
        if (sellerId === currentUserId) {
            renderProfileImage(
                elements.sellerAvatar,
                updatedProfileImageKey,
                '👤',
                currentProduct.seller?.nickname || currentProduct.seller?.name || '판매자'
            );
        }
    }

    // 현재 사용자가 작성한 댓글의 프로필 이미지 업데이트
    comments.forEach(comment => {
        if (comment.authorId === currentUserId) {
            comment.authorImageKey = updatedProfileImageKey;
        }
        if (comment.replies) {
            comment.replies.forEach(reply => {
                if (reply.authorId === currentUserId) {
                    reply.authorImageKey = updatedProfileImageKey;
                }
            });
        }
    });

    renderComments();
};

// 상품 데이터 표시
const displayProductData = (product) => {
    // 제목
    if (elements.productTitle) {
        elements.productTitle.textContent = product.title || '';
    }
    
    // 판매자 정보
    if (elements.sellerName && product.seller) {
        elements.sellerName.textContent = product.seller.nickname || product.seller.name || '판매자';
    }
    
    if (elements.sellerAvatar && product.seller) {
        // 현재 사용자가 판매자인 경우 최신 프로필 이미지 사용
        const sellerId = product.seller.id || product.seller.userId;
        let profileImageKey = extractProfileImageKey(product.seller);
        if (sellerId && currentUserId && sellerId === currentUserId) {
            const { profileImageKey: currentUserProfileImageKey } = getCurrentUserInfo();
            profileImageKey = currentUserProfileImageKey || profileImageKey;
        }
        renderProfileImage(elements.sellerAvatar, profileImageKey, '👤', product.seller.nickname || '판매자');
    }
    
    // 날짜
    if (elements.productDate && product.createdAt) {
        // product.createdAt는 문자열이므로 Date 객체로 변환 후 포맷팅
        elements.productDate.textContent = formatDate(new Date(product.createdAt));
    }
    
    // 위치
    if (elements.productLocation) {
        elements.productLocation.textContent = product.location || '';
    }
    
    // 이미지
    if (product.imageObjectKeys) {
        renderProductImages(product.imageObjectKeys);
    }
    
    // 내용
    if (elements.productContent) {
        elements.productContent.textContent = product.content || '';
    }
    
    // 가격
    if (elements.productPrice) {
        elements.productPrice.textContent = `${(product.price || 0).toLocaleString()}원`;
    }
    
    // 카테고리
    if (elements.productCategory) {
        elements.productCategory.textContent = getCategoryText(product.category) || '';
    }
    
    // 상태 배지
    if (elements.productStatusBadge) {
        elements.productStatusBadge.textContent = STATUS_TEXT[product.status] || product.status;
        elements.productStatusBadge.className = `product-status-badge ${STATUS_CLASS[product.status] || ''}`;
    }
    
    // 조회수
    if (elements.viewCount) {
        elements.viewCount.textContent = formatNumber(product.viewCount || 0);
    }
    
    // 액션 버튼 (판매자만)
    if (product.seller) {
        const sellerId = product.seller.id || product.seller.userId || null;
        createActionButtons(sellerId);
    }
};

// 상품 데이터 초기화 및 로드
const initProductData = async () => {
    const productId = getUrlParam('id');
    if (!productId) {
        Toast.error('상품 ID가 필요합니다');
        navigateTo('/marketplace');
        return;
    }

    currentProductId = productId;
    const { userId } = getCurrentUserInfo();
    currentUserId = userId;

    try {
        const response = await getProductById(productId);
        const product = response.data;
        
        if (!product) {
            Toast.error('상품을 찾을 수 없습니다');
            navigateTo('/marketplace');
            return;
        }

        currentProduct = product;
        displayProductData(product);
        await loadComments(productId);
    } catch (error) {
        Toast.error(error.message || '상품 정보를 불러오는데 실패했습니다');
        navigateTo('/marketplace');
    }
};

// 페이지 초기화
const init = async () => {
    PageLayout.init();
    initElements();
    await initProductData();

    // 사용자 정보 업데이트 시 프로필 이미지 갱신 (post-detail과 동일 구조)
    window.addEventListener('userUpdated', () => {
        updateCurrentUserProfileImages();
    });

    if (elements.commentInput) {
        elements.commentInput.addEventListener('input', handleCommentInput);
    }

    // 댓글 등록 버튼 생성 (post-detail과 동일한 Button 구조)
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

// 페이지 나갔다가 돌아올 때 상태 복원 방지 (post-detail과 동일한 패턴)
window.addEventListener('pageshow', async (event) => {
    if (!event.persisted) return;

    if (!comments || comments.length === 0) {
        await initProductData();
    } else {
        if (editingCommentId) {
            editingCommentId = null;
            renderComments();
        }
    }

    document.querySelectorAll('.reply-input-container').forEach(container => {
        container.style.display = 'none';
        container.replaceChildren();
    });
});

document.addEventListener('DOMContentLoaded', init);

