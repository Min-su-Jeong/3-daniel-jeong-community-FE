// DOMContentLoaded 이벤트 리스너
document.addEventListener('DOMContentLoaded', function() {
    
    // 말풍선 애니메이션 초기화
    if (window.BubbleAnimation) {
        window.bubbleAnimation = new window.BubbleAnimation('body');
    }
    
    // 게시글 목록 관리 클래스
    class PostListManager {
        constructor() {
            this.postsContainer = document.getElementById('postsContainer');
            this.loadingIndicator = document.getElementById('loadingIndicator');
            this.writePostBtn = document.getElementById('writePostBtn');
            this.currentPage = 1;
            this.isLoading = false;
            this.hasMorePosts = true;
            
            this.init();
        }
        
        init() {
            this.bindEvents();
            this.loadPosts();
        }
        
        bindEvents() {
            // 게시글 작성 버튼 클릭
            this.writePostBtn.addEventListener('click', () => {
                window.location.href = '/post-create';
            });
            
            // 인피니티 스크롤링
            window.addEventListener('scroll', () => {
                this.handleScroll();
            });
        }
        
        handleScroll() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            // 스크롤이 하단 근처에 도달했을 때 (디버깅 로그 추가)
            if (scrollTop + windowHeight >= documentHeight - 200) {
                console.log('스크롤 하단 도달 - 게시글 로딩 시작');
                this.loadPosts();
            }
        }
        
        async loadPosts() {
            if (this.isLoading || !this.hasMorePosts) return;
            
            this.isLoading = true;
            this.showLoading();
            
            try {
                // 더미 데이터 생성 (TODO: API 호출)
                const posts = this.generateDummyPosts(this.currentPage);
                
                if (posts.length === 0) {
                    this.hasMorePosts = false;
                    return;
                }
                
                // 게시글 카드 생성 및 추가
                posts.forEach(post => {
                    const postCard = this.createPostCard(post);
                    this.postsContainer.appendChild(postCard);
                });
                
                this.currentPage++;
                
                // 더 이상 게시글이 없으면 스크롤 이벤트 제거
                if (posts.length < 10) {
                    this.hasMorePosts = false;
                }
                
            } catch (error) {
                console.error('게시글 로딩 실패:', error);
            } finally {
                this.isLoading = false;
                this.hideLoading();
            }
        }
        
        generateDummyPosts(page) {
            const posts = [];
            const startIndex = (page - 1) * 10;
            
            // 마지막 페이지인지 확인 (총 50개 게시글)
            if (startIndex >= 50) {
                return [];
            }
            
            for (let i = 0; i < 10; i++) {
                const index = startIndex + i;
                if (index >= 50) break;
                
                posts.push({
                    id: index + 1,
                    title: this.generateRandomTitle(),
                    content: `게시글 ${index + 1}의 내용입니다.`,
                    author: `더미 작성자 ${index + 1}`,
                    createdAt: this.generateRandomDate(),
                    likes: Math.floor(Math.random() * 1000),
                    comments: Math.floor(Math.random() * 100),
                    views: Math.floor(Math.random() * 5000)
                });
            }
            
            console.log(`페이지 ${page} 로딩 완료 - ${posts.length}개 게시글`);
            return posts;
        }
        
        generateRandomTitle() {
            const titles = [
                '오늘의 일상 공유',
                '프로그래밍 질문이 있어요',
                '맛있는 음식 추천해주세요',
                '여행 후기 올려봅니다',
                '책 추천 받고 싶어요',
                '운동 같이 할 사람?',
                '영화 추천 좀 해주세요',
                '취업 관련 조언 구해요',
                '게임 같이 할 사람 있나요?',
                '반려동물 자랑하고 싶어요',
                '요리 레시피 공유합니다',
                '공부 방법 궁금해요',
                '취미로 뭐 하시나요?',
                '좋은 음악 추천해주세요',
                '주말에 뭐 하실 예정인가요?'
            ];
            
            return titles[Math.floor(Math.random() * titles.length)];
        }
        
        generateRandomDate() {
            const now = new Date();
            const randomDays = Math.floor(Math.random() * 30);
            const randomHours = Math.floor(Math.random() * 24);
            const randomMinutes = Math.floor(Math.random() * 60);
            const randomSeconds = Math.floor(Math.random() * 60);
            
            const date = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
            date.setHours(randomHours, randomMinutes, randomSeconds);
            
            return date;
        }
        
        createPostCard(post) {
            const card = document.createElement('div');
            card.className = 'post-card';
            card.dataset.postId = post.id;
            
            // 제목 (최대 26자)
            const truncatedTitle = post.title.length > 26 
                ? post.title.substring(0, 26) + '...' 
                : post.title;
            
            // 날짜 포맷팅 (YYYY-MM-DD HH:mm:ss)
            const formattedDate = this.formatDate(post.createdAt);
            
            // 숫자 포맷팅 (1k, 10k, 100k)
            const formattedLikes = this.formatNumber(post.likes);
            const formattedComments = this.formatNumber(post.comments);
            const formattedViews = this.formatNumber(post.views);
            
            card.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${truncatedTitle}</h3>
                    <span class="post-date">${formattedDate}</span>
                </div>
                <div class="post-meta">
                    <div class="meta-item">
                        <span>❤️</span>
                        <span>좋아요 ${formattedLikes}</span>
                    </div>
                    <div class="meta-item">
                        <span>💬</span>
                        <span>댓글 ${formattedComments}</span>
                    </div>
                    <div class="meta-item">
                        <span>👁️</span>
                        <span>조회수 ${formattedViews}</span>
                    </div>
                </div>
                <div class="post-author">
                    <div class="author-avatar">${post.author.charAt(0)}</div>
                    <span class="author-name">${post.author}</span>
                </div>
            `;
            
            // 카드 클릭 이벤트
            card.addEventListener('click', () => {
                window.location.href = `/post-detail?id=${post.id}`;
            });
            
            return card;
        }
        
        formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        
        formatNumber(num) {
            if (num >= 100000) {
                return Math.floor(num / 1000) + 'k';
            } else if (num >= 10000) {
                return Math.floor(num / 1000) + 'k';
            } else if (num >= 1000) {
                return Math.floor(num / 1000) + 'k';
            }
            return num.toString();
        }
        
        showLoading() {
            this.loadingIndicator.style.display = 'flex';
        }
        
        hideLoading() {
            this.loadingIndicator.style.display = 'none';
        }
    }
    
    // 게시글 목록 매니저 초기화
    const postListManager = new PostListManager();
});