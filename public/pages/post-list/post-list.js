import { Button, PageLayout, Toast, Modal } from '../../components/index.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { initializeElements } from '../../utils/common/element.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { extractProfileImageKey, renderProfileImage } from '../../utils/common/image.js';
import { getCurrentUserInfo } from '../../utils/common/user.js';
import { getPosts } from '../../api/index.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

const SCROLL_THRESHOLD = 200; // 무한 스크롤 트리거 거리 (px)
const TITLE_MAX_LENGTH = 26;  // 게시글 제목 최대 길이
const PAGE_SIZE = 10;         // 페이지당 게시글 수

// 상태 관리
const elements = initializeElements({
    postsContainer: 'postsContainer',
    loadingIndicator: 'loadingIndicator',
    welcomeSection: 'welcomeSection'
});

let cursor = null;
let isLoading = false;
let hasMorePosts = true;
let isInitialLoad = true;

// 게시글 카드의 작성자 이름 가져오기
function getAuthorNameFromCard(card) {
    const authorNameElement = card.querySelector('.author-name');
    return authorNameElement?.textContent || '';
}

// 프로필 이미지 업데이트
function updateProfileImageForCard(card, profileImageKey) {
    const avatar = card.querySelector('.author-avatar');
    if (!avatar) return;

    const authorName = getAuthorNameFromCard(card);
    const fallbackText = authorName ? authorName.charAt(0) : '👤';
    renderProfileImage(avatar, profileImageKey, fallbackText, authorName);
}

// 현재 사용자가 작성한 게시글의 프로필 이미지 업데이트
function updateCurrentUserProfileImages() {
    const { userId, profileImageKey } = getCurrentUserInfo();
    if (!userId) return;
    
    const postCards = elements.postsContainer.querySelectorAll('.post-card');
    postCards.forEach(card => {
        const authorId = card.dataset.authorId;
        if (authorId === String(userId)) {
            updateProfileImageForCard(card, profileImageKey);
        }
    });
}

// 타이핑 애니메이션 초기화
function initTypingAnimation() {
    const handwritingText = document.getElementById('handwritingText');
    if (!handwritingText) return;

    const fullText = handwritingText.textContent || '여러분의 재밌는 이야기를 들려주세요';
    handwritingText.textContent = '';
    handwritingText.classList.remove('typing-complete');

    let currentIndex = 0;
    const typingSpeed = 100; // 타이핑 속도 (ms)

    const typeChar = () => {
        if (currentIndex < fullText.length) {
            handwritingText.textContent += fullText.charAt(currentIndex);
            currentIndex++;
            setTimeout(typeChar, typingSpeed);
        } else {
            // 타이핑 완료 후 커서 제거
            handwritingText.classList.add('typing-complete');
        }
    };

    // 약간의 지연 후 시작
    setTimeout(typeChar, 500);
}

// 뒤로가기 시 최신 데이터 반영을 위한 목록 새로고침
function refreshList() {
    cursor = null;
    hasMorePosts = true;
    isLoading = false;
    elements.postsContainer.replaceChildren();
    loadPosts();
}

// 로그인 필요 모달 표시
function showLoginRequiredModal() {
    new Modal({
        title: MODAL_MESSAGE.TITLE_LOGIN_REQUIRED,
        subtitle: MODAL_MESSAGE.SUBTITLE_LOGIN_REQUIRED,
        confirmText: '로그인하기',
        cancelText: '취소',
        onConfirm: () => navigateTo('/login')
    }).show();
}

// localStorage와 sessionStorage 모두 확인 (로그인 상태 체크)
function isLoggedIn() {
    return !!(localStorage.getItem('user') || sessionStorage.getItem('user'));
}

function handleWriteClick() {
    if (!isLoggedIn()) {
        showLoginRequiredModal();
        return;
    }
    navigateTo('/post-write');
}

function createWritePostButton() {
    if (!elements.welcomeSection) return;
    
    new Button({
        text: '게시글 작성',
        variant: 'primary',
        size: 'medium',
        onClick: handleWriteClick
    }).appendTo(elements.welcomeSection);
}

// 페이지 복원 시 목록 새로고침 처리
function handlePageShow(event) {
    if (isInitialLoad) {
        isInitialLoad = false;
        return;
    }
    
    const navType = performance.getEntriesByType('navigation')[0]?.type;
    if (event.persisted || navType === 'back_forward') {
        refreshList();
    }
}

function handleScroll() {
    if (isLoading || !hasMorePosts) return;
    
    const { scrollTop, scrollHeight } = document.documentElement;
    if (scrollTop + window.innerHeight >= scrollHeight - SCROLL_THRESHOLD) {
        loadPosts();
    }
}

function bindEvents() {
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('pageshow', handlePageShow);
}

// 게시글 목록 렌더링
function renderPosts(posts) {
    posts.forEach(post => {
        elements.postsContainer.appendChild(createPostCard(post));
    });
}

// 페이지네이션 상태 업데이트
function updatePaginationState(data) {
    hasMorePosts = data.hasNext === true;
    cursor = data.nextCursor || null;
}

// 에러 처리
function handleLoadError(error) {
    if (cursor === null) {
        Toast.error(error.message || TOAST_MESSAGE.POST_LIST_LOAD_FAILED);
    }
    hasMorePosts = false;
}

async function loadPosts() {
    if (isLoading || !hasMorePosts) return;
    
    isLoading = true;
    showLoading();
    
    try {
        const { data = {} } = await getPosts(cursor, PAGE_SIZE);
        const posts = data.items || [];
        
        if (posts.length === 0) {
            hasMorePosts = false;
            return;
        }
        
        renderPosts(posts);
        updatePaginationState(data);
        
    } catch (error) {
        handleLoadError(error);
    } finally {
        isLoading = false;
        hideLoading();
        isInitialLoad = false;
    }
}

// 게시글 제목 길이 제한
function truncateTitle(title) {
    return title.length > TITLE_MAX_LENGTH 
        ? title.substring(0, TITLE_MAX_LENGTH) + '...' 
        : title;
}

// 게시글 카드 데이터 속성 설정
function setCardDataAttributes(card, postId, authorId) {
    card.dataset.postId = postId;
    if (authorId) {
        card.dataset.authorId = authorId;
    }
}

// 프로필 이미지 키 결정
function getProfileImageKey(post, postAuthorId) {
    const { userId, profileImageKey: currentUserProfileImageKey } = getCurrentUserInfo();
    
    let profileImageKey = extractProfileImageKey(post.author);
    if (postAuthorId && userId && postAuthorId === userId) {
        profileImageKey = currentUserProfileImageKey || profileImageKey;
    }
    
    return profileImageKey;
}

// 게시글 카드 클릭 이벤트 설정
function setupCardClickEvent(card, postId) {
    card.addEventListener('click', () => navigateTo('/post-detail', { id: postId }));
}

// API 응답 형식 차이 대응
function extractPostData(post) {
    return {
        title: post.title || '',
        author: post.author?.nickname || post.author?.name || '작성자',
        createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
        stats: { likeCount: 0, commentCount: 0, viewCount: 0, ...post.stats }
    };
}

function createPostHeader(title, date) {
    const header = document.createElement('div');
    header.className = 'post-header';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'post-title';
    titleElement.textContent = title;
    
    const dateElement = document.createElement('span');
    dateElement.className = 'post-date';
    dateElement.textContent = formatDate(date);
    
    header.appendChild(titleElement);
    header.appendChild(dateElement);
    return header;
}

function createPostMeta(stats) {
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.appendChild(createMetaItem('like', `좋아요 ${formatNumber(stats.likeCount)}`));
    meta.appendChild(createMetaItem('view', `조회수 ${formatNumber(stats.viewCount)}`));
    meta.appendChild(createMetaItem('comment', `댓글 ${formatNumber(stats.commentCount)}`));
    return meta;
}

function createPostAuthor(author) {
    const authorDiv = document.createElement('div');
    authorDiv.className = 'post-author';
    
    const avatar = document.createElement('div');
    avatar.className = 'author-avatar';
    
    const authorName = document.createElement('span');
    authorName.className = 'author-name';
    authorName.textContent = author;
    
    authorDiv.appendChild(avatar);
    authorDiv.appendChild(authorName);
    return authorDiv;
}

function createMetaItem(type, text) {
    const item = document.createElement('div');
    item.className = 'meta-item';
    const icon = document.createElement('div');
    icon.className = `meta-icon meta-icon-${type}`;
    const span = document.createElement('span');
    span.textContent = text;
    item.appendChild(icon);
    item.appendChild(span);
    return item;
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    
    const postId = post.id || post.postId;
    const postAuthorId = post.author?.id || post.author?.userId;
    setCardDataAttributes(card, postId, postAuthorId);

    const { title, author, createdAt, stats } = extractPostData(post);
    const truncatedTitle = truncateTitle(title);
    
    card.appendChild(createPostHeader(truncatedTitle, createdAt));
    card.appendChild(createPostMeta(stats));
    card.appendChild(createPostAuthor(author));
    
    const avatar = card.querySelector('.author-avatar');
    const profileImageKey = getProfileImageKey(post, postAuthorId);
    renderProfileImage(avatar, profileImageKey, author.charAt(0), author);
    
    setupCardClickEvent(card, postId);
    
    return card;
}

function showLoading() {
    elements.loadingIndicator?.style.setProperty('display', 'flex');
}

function hideLoading() {
    elements.loadingIndicator?.style.setProperty('display', 'none');
}

// 초기화
function init() {
    initTypingAnimation();
    createWritePostButton();
    bindEvents();
    loadPosts();
    
    // 사용자 정보 업데이트 이벤트 리스너 등록
    window.addEventListener('userUpdated', updateCurrentUserProfileImages);
}

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    init();
});
