import { navigateTo } from '../../utils/common/navigation.js';
import { debounce } from '../../utils/common/debounce-helper.js';
import { S3_CONFIG } from '../../utils/constants/image.js';

async function init() {
    // 배경 비디오 소스 설정
    const bgVideoSource = document.querySelector('#bg-video-source');
    const bgVideo = document.querySelector('.bg-video');
    
    if (bgVideoSource) {
        const videoUrl = await S3_CONFIG.getBackgroundVideoUrl();
        if (videoUrl) {
            bgVideoSource.src = videoUrl;
        }
    }
    
    // 비디오 로드 실패 시 에러 처리
    if (bgVideo) {
        bgVideo.addEventListener('error', () => {
            // 비디오 로드 실패 시 비디오 요소 숨김 (CSS 배경 사용)
            bgVideo.style.display = 'none';
        });
    }

    const exploreBtn = document.querySelector('#exploreBtn');
    const loginBtn = document.querySelector('#loginBtn');
    const scrollIndicator = document.querySelector('.hero-scroll-indicator');
    const quoteSection = document.querySelector('.quote-section');

    exploreBtn?.addEventListener('click', () => navigateTo('/post-list'));
    loginBtn?.addEventListener('click', () => navigateTo('/login'));
    
    scrollIndicator?.addEventListener('click', () => {
        quoteSection?.scrollIntoView({ behavior: 'smooth' });
    });

    // Scroll indicator visibility
    if (scrollIndicator) {
        const handleScroll = debounce(() => {
            scrollIndicator.classList.toggle('hero-scroll-indicator-hidden', window.scrollY > 20);
        }, 100);
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
    }

    // Scroll animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.quote-section, .intro, .activities, .values, .join').forEach(el => {
        observer.observe(el);
    });
}

document.addEventListener('DOMContentLoaded', init);