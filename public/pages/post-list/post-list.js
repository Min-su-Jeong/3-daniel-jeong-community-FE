import { Button } from '../../components/button/button.js';
import { formatNumber, formatDate } from '../../utils/common/format.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { getPosts } from '../../api/posts.js';

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
            this.pageSize = 10;
            
            this.init();
        }

        init() {
            this.createWritePostButton();
            this.bindEvents();
            this.loadPosts();
        }

        // 목록 리프레시: 뒤로가기 시 최신 데이터 반영
        refreshList() {
            this.cursor = null;
            this.hasMorePosts = true;
            this.isLoading = false;
            if (this.elements.postsContainer) {
                this.elements.postsContainer.innerHTML = '';
            }
            this.loadPosts();
        }
        
        createWritePostButton() {
            if (!this.elements.welcomeSection) return;
            
            new Button({
                text: '게시글 작성',
                variant: 'primary',
                size: 'medium',
                onClick: () => navigateTo('/post-write')
            }).appendTo(this.elements.welcomeSection);
        }
        
        bindEvents() {
            window.addEventListener('scroll', () => this.handleScroll());
            // 브라우저 뒤로가기 시 목록 새로고침
            window.addEventListener('pageshow', (event) => {
                const navEntries = performance.getEntriesByType('navigation');
                const navType = navEntries && navEntries[0] ? navEntries[0].type : undefined;
                if (event.persisted === true || navType === 'back_forward') {
                    this.refreshList();
                }
            });
        }
        
        handleScroll() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            if (scrollTop + windowHeight >= documentHeight - 200) {
                this.loadPosts();
            }
        }
        
        async loadPosts() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            this.isLoading = true;
            this.showLoading();
            
            try {
                const response = await getPosts(this.cursor, this.pageSize);
                const postsData = response.data || {};
                const posts = postsData.items || [];
                
                if (posts.length === 0) {
                    this.hasMorePosts = false;
                    return;
                }
                
                posts.forEach(post => {
                    this.elements.postsContainer.appendChild(this.createPostCard(post));
                });
                
                // 커서 기반 페이지네이션: nextCursor가 null이면 더 이상 없음
                this.hasMorePosts = postsData.hasNext === true;
                this.cursor = postsData.nextCursor || null;
                
            } catch (error) {
                // 첫 로드 시에만 에러 메시지 표시
                if (this.cursor === null) {
                    ToastUtils.error(error.message || '게시글 목록을 불러올 수 없습니다.');
                }
                
                this.hasMorePosts = false;
            } finally {
                this.isLoading = false;
                this.hideLoading();
            }
        }
        
		createPostCard(post) {
            const card = document.createElement('div');
            card.className = 'post-card';
            const postId = post.id || post.postId;
            card.dataset.postId = postId;

            const title = post.title || '';
            const author = post.author?.nickname || post.author?.name || post.author || '작성자';
            const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
            const stats = post?.stats || {};
            const likes = stats.likeCount || 0;
            const comments = stats.commentCount || 0;
            const views = stats.viewCount || 0;
            
            const truncatedTitle = title.length > 26 ? title.substring(0, 26) + '...' : title;
            
            card.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${truncatedTitle}</h3>
                    <span class="post-date">${formatDate(createdAt)}</span>
                </div>
                <div class="post-meta">
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        <span>좋아요 ${formatNumber(likes)}</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span>댓글 ${formatNumber(comments)}</span>
                    </div>
                    <div class="meta-item">
                        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <span>조회수 ${formatNumber(views)}</span>
                    </div>
                </div>
                <div class="post-author">
                    <div class="author-avatar">${author.charAt(0)}</div>
                    <span class="author-name">${author}</span>
                </div>
            `;
            
            card.addEventListener('click', () => navigateTo('/post-detail', { id: postId }));
            
            return card;
        }
        
        showLoading() {
            if (this.elements.loadingIndicator) {
                this.elements.loadingIndicator.style.display = 'flex';
            }
        }
        
        hideLoading() {
            if (this.elements.loadingIndicator) {
                this.elements.loadingIndicator.style.display = 'none';
            }
        }
    }
    
    new PostListManager();
});