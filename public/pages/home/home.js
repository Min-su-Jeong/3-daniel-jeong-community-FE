import { navigateTo } from '../../utils/common/navigation.js';
import { debounce } from '../../utils/common/debounce-helper.js';

function init() {
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