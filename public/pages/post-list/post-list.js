import { Button, PageLayout, ToastUtils, Modal } from '../../components/index.js';
import { formatNumber, formatDate, initializeElements, navigateTo, extractProfileImageKey, renderProfileImage, getCurrentUser, getUserFromStorage } from '../../utils/common/index.js';
import { getPosts } from '../../api/index.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';


const SCROLL_THRESHOLD = 200; // 무한 스크롤 트리거 거리 (px)
const TITLE_MAX_LENGTH = 26;  // 게시글 제목 최대 길이
const PAGE_SIZE = 10;         // 페이지당 게시글 수

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.initializePage();
    
    class PostListManager {
        constructor() {
            this.elements = initializeElements({
                postsContainer: 'postsContainer',
                loadingIndicator: 'loadingIndicator',
                welcomeSection: 'welcomeSection'
            });
            this.cursor = null;
            this.isLoading = false;
            this.hasMorePosts = true;
            this.pageSize = PAGE_SIZE;
            this.isInitialLoad = true;
            
            this.init();
        }

        init() {
            this.initTypingAnimation();
            this.createWritePostButton();
            this.bindEvents();
            this.loadPosts();
            
            // 사용자 정보 업데이트 이벤트 리스너 등록
            window.addEventListener('userUpdated', () => {
                this.updateCurrentUserProfileImages();
            });
        }
        
        // 현재 사용자가 작성한 게시글의 프로필 이미지 업데이트
        updateCurrentUserProfileImages() {
            const currentUser = getUserFromStorage();
            const currentUserId = currentUser?.id || null;
            const updatedProfileImageKey = currentUser?.profileImageKey || null;
            
            if (!currentUserId) return;
            
            // 모든 게시글 카드에서 현재 사용자가 작성한 게시글 찾아서 업데이트
            // profileImageKey가 null이어도 업데이트 (기본 프로필로 표시)
            const postCards = this.elements.postsContainer.querySelectorAll('.post-card');
            postCards.forEach(card => {
                const authorId = card.dataset.authorId;
                if (!authorId || authorId !== String(currentUserId)) return;
                
                const avatar = card.querySelector('.author-avatar');
                if (avatar) {
                    // 작성자 이름 가져오기 (기본 이모지용)
                    const authorNameElement = card.querySelector('.author-name');
                    const authorName = authorNameElement?.textContent || '';
                    const fallbackText = authorName ? authorName.charAt(0) : '👤';
                    renderProfileImage(avatar, updatedProfileImageKey, fallbackText, authorName);
                }
            });
        }

        // 타이핑 애니메이션 초기화
        initTypingAnimation() {
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
        refreshList() {
            this.cursor = null;
            this.hasMorePosts = true;
            this.isLoading = false;
            this.elements.postsContainer.replaceChildren();
            this.loadPosts();
        }
        
        createWritePostButton() {
            if (!this.elements.welcomeSection) return;
            
            new Button({
                text: '게시글 작성',
                variant: 'primary',
                size: 'medium',
                onClick: () => this.handleWriteClick()
            }).appendTo(this.elements.welcomeSection);
        }
        
        handleWriteClick() {
            if (!this.isLoggedIn()) {
                new Modal({
                    title: MODAL_MESSAGE.TITLE_LOGIN_REQUIRED,
                    subtitle: MODAL_MESSAGE.SUBTITLE_LOGIN_REQUIRED,
                    confirmText: '로그인하기',
                    cancelText: '취소',
                    onConfirm: () => navigateTo('/login')
                }).show();
                return;
            }
            navigateTo('/post-write');
        }
        
        // localStorage와 sessionStorage 모두 확인 (로그인 상태 체크)
        isLoggedIn() {
            return !!(localStorage.getItem('user') || sessionStorage.getItem('user'));
        }
        
        bindEvents() {
            window.addEventListener('scroll', () => this.handleScroll());
            
            // 뒤로가기/앞으로가기 또는 bfcache 복원 시 목록 새로고침
            window.addEventListener('pageshow', (event) => {
                // 초기 로드 시 중복 호출 방지
                if (this.isInitialLoad) {
                    this.isInitialLoad = false;
                    return;
                }
                
                const navType = performance.getEntriesByType('navigation')[0]?.type;
                if (event.persisted || navType === 'back_forward') {
                    this.refreshList();
                }
            });
        }
        
        handleScroll() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            const { scrollTop, scrollHeight } = document.documentElement;
            if (scrollTop + window.innerHeight >= scrollHeight - SCROLL_THRESHOLD) {
                this.loadPosts();
            }
        }
        
        async loadPosts() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            this.isLoading = true;
            this.showLoading();
            
            try {
                const { data = {} } = await getPosts(this.cursor, this.pageSize);
                const posts = data.items || [];
                
                if (posts.length === 0) {
                    this.hasMorePosts = false;
                    return;
                }
                
                posts.forEach(post => {
                    this.elements.postsContainer.appendChild(this.createPostCard(post));
                });
                
                // 커서 기반 페이지네이션: nextCursor가 null이면 더 이상 없음
                this.hasMorePosts = data.hasNext === true;
                this.cursor = data.nextCursor || null;
                
            } catch (error) {
                // 첫 로드 시에만 에러 메시지 표시
                if (this.cursor === null) {
                    ToastUtils.error(error.message || TOAST_MESSAGE.POST_LIST_LOAD_FAILED);
                }
                this.hasMorePosts = false;
            } finally {
                this.isLoading = false;
                this.hideLoading();
                this.isInitialLoad = false;
            }
        }
        
        createPostCard(post) {
            const card = document.createElement('div');
            card.className = 'post-card';
            const postId = post.id || post.postId;
            card.dataset.postId = postId;
            
            // 작성자 ID 저장 (프로필 이미지 업데이트용)
            const postAuthorId = post.author?.id || post.author?.userId;
            if (postAuthorId) {
                card.dataset.authorId = postAuthorId;
            }

            const { title, author, createdAt, stats } = this.extractPostData(post);
            const truncatedTitle = title.length > TITLE_MAX_LENGTH 
                ? title.substring(0, TITLE_MAX_LENGTH) + '...' 
                : title;
            
            card.appendChild(this.createPostHeader(truncatedTitle, createdAt));
            card.appendChild(this.createPostMeta(stats));
            card.appendChild(this.createPostAuthor(author));
            
            const avatar = card.querySelector('.author-avatar');
            const currentUser = getCurrentUser();
            const currentUserId = currentUser?.id || null;
            
            // 현재 사용자가 작성한 게시글인 경우 최신 프로필 이미지 사용
            let profileImageKey = extractProfileImageKey(post.author);
            if (postAuthorId && currentUserId && postAuthorId === currentUserId) {
                profileImageKey = currentUser?.profileImageKey || profileImageKey;
            }
            
            renderProfileImage(avatar, profileImageKey, author.charAt(0), author);
            card.addEventListener('click', () => navigateTo('/post-detail', { id: postId }));
            
            return card;
        }
        
        // API 응답 형식 차이 대응
        extractPostData(post) {
            return {
                title: post.title || '',
                author: post.author?.nickname || post.author?.name || '작성자',
                createdAt: post.createdAt ? new Date(post.createdAt) : new Date(),
                stats: { likeCount: 0, commentCount: 0, viewCount: 0, ...post.stats }
            };
        }
        
        createPostHeader(title, date) {
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
        
        createPostMeta(stats) {
            const meta = document.createElement('div');
            meta.className = 'post-meta';
            meta.appendChild(this.createMetaItem('like', `좋아요 ${formatNumber(stats.likeCount)}`));
            meta.appendChild(this.createMetaItem('comment', `댓글 ${formatNumber(stats.commentCount)}`));
            meta.appendChild(this.createMetaItem('view', `조회수 ${formatNumber(stats.viewCount)}`));
            return meta;
        }
        
        createPostAuthor(author) {
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
        
        createMetaItem(type, text) {
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
        
        showLoading() {
            this.elements.loadingIndicator?.style.setProperty('display', 'flex');
        }
        
        hideLoading() {
            this.elements.loadingIndicator?.style.setProperty('display', 'none');
        }
    }
    
    new PostListManager();
});