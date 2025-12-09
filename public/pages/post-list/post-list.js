import { Modal } from '../../components/modal/modal.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { formatNumber, formatDate, debounce, toggleLoadingIndicator } from '../../utils/common/element.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { extractProfileImageKey, renderProfileImage } from '../../utils/common/image.js';
import { getCurrentUserInfo, getUserFromStorage } from '../../utils/common/user.js';
import { getPosts } from '../../utils/api/posts.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';
import { S3_CONFIG } from '../../utils/constants/image.js';

const SCROLL_THRESHOLD = 400;
const TITLE_MAX_LENGTH = 50;
const PAGE_SIZE = 10;

let cursor = null;
let isLoading = false;
let hasMorePosts = true;
let isInitialLoad = true;

const elements = {
    postsContainer: null,
    loadingIndicator: null,
    emptyState: null,
    writeSection: null,
    writePostBtn: null
};

function initElements() {
    elements.postsContainer = document.getElementById('postsContainer');
    elements.loadingIndicator = document.getElementById('loadingIndicator');
    elements.emptyState = document.getElementById('emptyState');
    elements.writeSection = document.getElementById('writeSection');
    elements.writePostBtn = document.getElementById('writePostBtn');
}

// 로그인 상태에 따라 네비게이션 업데이트
function updateNavigation() {
    const user = getUserFromStorage();
    const navActions = document.getElementById('navActions');
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navSignupBtn = document.getElementById('navSignupBtn');
    const mobileLoginLink = document.getElementById('mobileLoginLink');
    const mobileSignupLink = document.getElementById('mobileSignupLink');
    
    if (user) {
        // 로그인 상태: 프로필 버튼 표시
        if (navActions) {
            navActions.replaceChildren();
            
            const profileLink = document.createElement('a');
            profileLink.href = '/user-edit';
            profileLink.className = 'nav-profile-btn';
            
            const avatar = document.createElement('div');
            avatar.className = 'nav-profile-avatar';
            avatar.id = 'navProfileAvatar';
            // 닉네임 첫 글자로 초기 아바타 표시
            avatar.textContent = user.nickname?.charAt(0) || 'U';
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = user.nickname || '사용자';
            
            profileLink.appendChild(avatar);
            profileLink.appendChild(nameSpan);
            navActions.appendChild(profileLink);
            
            // 프로필 이미지가 있으면 렌더링
            if (user.profileImageKey) {
                renderProfileImage(avatar, user.profileImageKey, user.nickname?.charAt(0) || 'U', user.nickname);
            }
        }
        
        // 모바일 메뉴 업데이트
        if (mobileLoginLink) {
            mobileLoginLink.textContent = '내 정보';
            mobileLoginLink.href = '/user-edit';
        }
        if (mobileSignupLink) {
            mobileSignupLink.textContent = '로그아웃';
            mobileSignupLink.href = '#';
            mobileSignupLink.addEventListener('click', (e) => {
                e.preventDefault();
                showLogoutModal();
            });
        }
    }
}

// 로그아웃 모달 표시
function showLogoutModal() {
    new Modal({
        title: MODAL_MESSAGE.TITLE_LOGOUT,
        subtitle: MODAL_MESSAGE.SUBTITLE_LOGOUT,
        confirmText: '로그아웃',
        cancelText: '취소',
        onConfirm: async () => {
            try {
                const { logout } = await import('../../utils/api/auth.js');
                await logout();
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                Toast.success(TOAST_MESSAGE.LOGOUT_SUCCESS);
                window.location.reload();
            } catch (error) {
                localStorage.removeItem('user');
                sessionStorage.removeItem('user');
                Toast.error(TOAST_MESSAGE.LOGOUT_FAILED);
                window.location.reload();
            }
        }
    }).show();
}

// 로그인 상태 확인
function isLoggedIn() {
    return !!(localStorage.getItem('user') || sessionStorage.getItem('user'));
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

// 작성 버튼 클릭 처리
function handleWriteClick() {
    if (!isLoggedIn()) {
        showLoginRequiredModal();
        return;
    }
    navigateTo('/post-write');
}

// 작성 버튼 초기화
function initWriteButton() {
    if (elements.writePostBtn) {
        elements.writePostBtn.addEventListener('click', handleWriteClick);
    }
}

// 제목 자르기
function truncateTitle(title) {
    return title.length > TITLE_MAX_LENGTH 
        ? title.substring(0, TITLE_MAX_LENGTH) + '...' 
        : title;
}

// 게시글 데이터 추출
function extractPostData(post) {
    return {
        title: post.title || '',
        author: post.author?.nickname || post.author?.name || '작성자',
        createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
        stats: { likeCount: 0, commentCount: 0, viewCount: 0, ...post.stats }
    };
}

// 프로필 이미지 키 가져오기
function getProfileImageKey(post, postAuthorId) {
    const { userId, profileImageKey: currentUserProfileImageKey } = getCurrentUserInfo();
    
    let profileImageKey = extractProfileImageKey(post.author);
    if (postAuthorId && userId && postAuthorId === userId) {
        profileImageKey = currentUserProfileImageKey || profileImageKey;
    }
    
    return profileImageKey;
}

// 게시글 카드 생성
function createPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    
    const postId = post.id || post.postId;
    const postAuthorId = post.author?.id || post.author?.userId;
    
    card.dataset.postId = postId;
    if (postAuthorId) card.dataset.authorId = postAuthorId;
    
    const { title, author, createdAt, stats } = extractPostData(post);
    const truncatedTitle = truncateTitle(title);
    const profileImageKey = getProfileImageKey(post, postAuthorId);
    
    // 게시글 헤더
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';
    
    const postTitle = document.createElement('h2');
    postTitle.className = 'post-title';
    postTitle.textContent = truncatedTitle;
    
    const postDate = document.createElement('span');
    postDate.className = 'post-date';
    postDate.textContent = formatDate(createdAt);
    
    postHeader.appendChild(postTitle);
    postHeader.appendChild(postDate);
    
    // 게시글 메타 정보
    const postMeta = document.createElement('div');
    postMeta.className = 'post-meta';
    
    // 좋아요 개수
    const likeItem = document.createElement('div');
    likeItem.className = 'meta-item';
    const likeIcon = document.createElement('img');
    likeIcon.src = S3_CONFIG.getImageUrl('post/like.svg');
    likeIcon.alt = '좋아요';
    likeIcon.className = 'meta-icon';
    likeIcon.loading = 'lazy';
    const likeSpan = document.createElement('span');
    likeSpan.textContent = formatNumber(stats.likeCount);
    likeItem.appendChild(likeIcon);
    likeItem.appendChild(likeSpan);
    
    // 조회수
    const viewItem = document.createElement('div');
    viewItem.className = 'meta-item';
    const viewIcon = document.createElement('img');
    viewIcon.src = S3_CONFIG.getImageUrl('post/view.svg');
    viewIcon.alt = '조회수';
    viewIcon.className = 'meta-icon';
    viewIcon.loading = 'lazy';
    const viewSpan = document.createElement('span');
    viewSpan.textContent = formatNumber(stats.viewCount);
    viewItem.appendChild(viewIcon);
    viewItem.appendChild(viewSpan);
    
    // 댓글 개수
    const commentItem = document.createElement('div');
    commentItem.className = 'meta-item';
    const commentIcon = document.createElement('img');
    commentIcon.src = S3_CONFIG.getImageUrl('post/comment.svg');
    commentIcon.alt = '댓글';
    commentIcon.className = 'meta-icon';
    commentIcon.loading = 'lazy';
    const commentSpan = document.createElement('span');
    commentSpan.textContent = formatNumber(stats.commentCount);
    commentItem.appendChild(commentIcon);
    commentItem.appendChild(commentSpan);
    
    postMeta.appendChild(likeItem);
    postMeta.appendChild(viewItem);
    postMeta.appendChild(commentItem);
    
    // 게시글 작성자
    const postAuthor = document.createElement('div');
    postAuthor.className = 'post-author';
    
    const avatar = document.createElement('div');
    avatar.className = 'author-avatar';
    avatar.textContent = author.charAt(0);
    
    const authorName = document.createElement('span');
    authorName.className = 'author-name';
    authorName.textContent = author;
    
    postAuthor.appendChild(avatar);
    postAuthor.appendChild(authorName);
    
    card.appendChild(postHeader);
    card.appendChild(postMeta);
    card.appendChild(postAuthor);
    
    // 프로필 이미지 렌더링
    renderProfileImage(avatar, profileImageKey, author.charAt(0), author);
    
    // 클릭 이벤트
    card.addEventListener('click', () => navigateTo('/post-detail', { id: postId }));
    
    return card;
}


// 빈 상태 표시/숨김
function showEmptyState() {
    if (elements.emptyState) {
        elements.emptyState.style.display = 'flex';
    }
}

function hideEmptyState() {
    if (elements.emptyState) {
        elements.emptyState.style.display = 'none';
    }
}

// 게시글 로드
async function loadPosts() {
    if (isLoading || !hasMorePosts) return;
    
    isLoading = true;
    toggleLoadingIndicator(elements.loadingIndicator, true);
    
    try {
        const { data = {} } = await getPosts(cursor, PAGE_SIZE);
        const posts = data.items || [];
        
        if (posts.length === 0 && cursor === null) {
            showEmptyState();
            hasMorePosts = false;
            return;
        }
        
        hideEmptyState();
        
        posts.forEach(post => {
            elements.postsContainer.appendChild(createPostCard(post));
        });
        
        hasMorePosts = data.hasNext === true;
        cursor = data.nextCursor || null;
        
    } catch (error) {
        if (cursor === null) {
            Toast.error(error.message || TOAST_MESSAGE.POST_LIST_LOAD_FAILED);
        }
        hasMorePosts = false;
    } finally {
        isLoading = false;
        toggleLoadingIndicator(elements.loadingIndicator, false);
        isInitialLoad = false;
    }
}

// 목록 새로고침
function refreshList() {
    cursor = null;
    hasMorePosts = true;
    isLoading = false;
    if (elements.postsContainer) {
        elements.postsContainer.replaceChildren();
    }
    loadPosts();
}

// 스크롤 처리
function handleScroll() {
    if (isLoading || !hasMorePosts) return;
    
    const { scrollTop, scrollHeight } = document.documentElement;
    if (scrollTop + window.innerHeight >= scrollHeight - SCROLL_THRESHOLD) {
        loadPosts();
    }
}

const debouncedHandleScroll = debounce(handleScroll, 50);

// 페이지 표시 처리
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

// 이벤트 바인딩
function bindEvents() {
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('userUpdated', () => {
        updateNavigation();
        updateCurrentUserProfileImages();
    });
}

// 현재 사용자 프로필 이미지 업데이트
function updateCurrentUserProfileImages() {
    const { userId, profileImageKey } = getCurrentUserInfo();
    if (!userId || !elements.postsContainer) return;
    
    const postCards = elements.postsContainer.querySelectorAll(`[data-author-id="${userId}"]`);
    postCards.forEach(card => {
        const avatar = card.querySelector('.author-avatar');
        const authorName = card.querySelector('.author-name')?.textContent || '';
        if (avatar) {
            renderProfileImage(avatar, profileImageKey, authorName.charAt(0), authorName);
        }
    });
}

// 초기화
function init() {
    initElements();
    PageLayout.init();
    updateNavigation();
    initWriteButton();
    bindEvents();
    loadPosts();
}

document.addEventListener('DOMContentLoaded', init);










