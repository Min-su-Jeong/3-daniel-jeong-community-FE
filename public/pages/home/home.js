import { navigateTo } from '../../utils/common/navigation.js';
import { debounce } from '../../utils/common/element.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { S3_CONFIG } from '../../utils/constants/image.js';

// 스크롤 애니메이션 초기화
function initScrollAnimations() {
    const sections = document.querySelectorAll('.quote-section, .features-section, .brands-section, .cta-section');
    const cards = document.querySelectorAll('.feature-card, .brand-card');
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { 
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });
    
    sections.forEach(section => sectionObserver.observe(section));
    cards.forEach(card => cardObserver.observe(card));
}


// Hero 스크롤 인디케이터 초기화
function initHeroScroll() {
    const heroScroll = document.getElementById('heroScroll');
    const quoteSection = document.getElementById('quoteSection');
    
    if (heroScroll && quoteSection) {
        heroScroll.addEventListener('click', () => {
            quoteSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    const handleScroll = debounce(() => {
        if (heroScroll) {
            heroScroll.style.opacity = window.scrollY > 100 ? '0' : '1';
            heroScroll.style.pointerEvents = window.scrollY > 100 ? 'none' : 'auto';
        }
    }, 50);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// 버튼 이벤트 초기화
function initButtons() {
    const exploreBtn = document.getElementById('exploreBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    const quoteSection = document.getElementById('quoteSection');
    
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => navigateTo('/post-list'));
    }
    
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            navigateTo('/signup');
        });
    }
}

// 비디오 초기화 및 에러 처리
function initVideoErrorHandling() {
    const video = document.querySelector('.water-video');
    if (video) {
        const source = video.querySelector('source');
        if (source) {
            source.src = S3_CONFIG.BACKGROUND_VIDEO_URL;
            video.load();
        }
        
        video.addEventListener('error', () => {
            video.style.display = 'none';
        });
        
        video.play().catch(() => {});
    }
}

// 페이지 초기화
function init() {
    PageLayout.init();
    
    initScrollAnimations();
    initHeroScroll();
    initButtons();
    initVideoErrorHandling();
}

document.addEventListener('DOMContentLoaded', init);