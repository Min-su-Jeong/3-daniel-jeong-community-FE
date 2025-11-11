import { Button } from '../../components/button/button.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { getPosts } from '../../api/posts.js';
import { Modal } from '../../components/modal/modal.js';
import { extractProfileImageKey, renderProfileImage } from '../../utils/common/image.js';


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
            this.createWritePostButton();
            this.bindEvents();
            this.loadPosts();
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
                    title: '로그인 필요',
                    subtitle: '게시글을 작성하려면 로그인이 필요합니다.',
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
                    ToastUtils.error(error.message || '게시글 목록을 불러올 수 없습니다.');
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

            const { title, author, createdAt, stats } = this.extractPostData(post);
            const truncatedTitle = title.length > TITLE_MAX_LENGTH 
                ? title.substring(0, TITLE_MAX_LENGTH) + '...' 
                : title;
            
            card.appendChild(this.createPostHeader(truncatedTitle, createdAt));
            card.appendChild(this.createPostMeta(stats));
            card.appendChild(this.createPostAuthor(author));
            
            const avatar = card.querySelector('.author-avatar');
            renderProfileImage(avatar, extractProfileImageKey(post.author), author.charAt(0), author);
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