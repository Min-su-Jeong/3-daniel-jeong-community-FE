import { PageLayout } from '../../components/layout/page-layout.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { getProducts } from '../../utils/api/marketplace.js';
import { S3_CONFIG } from '../../utils/constants/image.js';
import { Modal } from '../../components/modal/modal.js';
import { MODAL_MESSAGE } from '../../utils/constants/modal.js';
import { getUserFromStorage } from '../../utils/common/user.js';

// 상태 텍스트 매핑
const STATUS_TEXT = {
    SELLING: '판매중',
    RESERVED: '예약중',
    SOLD: '거래완료',
};

// 서버에서 가져온 상품 목록과 필터링 결과
let products = [];
let filteredProducts = [];

// 로그인 여부 확인
function isLoggedIn() {
    return !!getUserFromStorage();
}

// 로그인 필요 모달 표시 (게시글 리스트와 동일한 UX)
function showLoginRequiredModal() {
    new Modal({
        title: MODAL_MESSAGE.TITLE_LOGIN_REQUIRED,
        subtitle: MODAL_MESSAGE.SUBTITLE_LOGIN_REQUIRED,
        confirmText: '로그인하기',
        cancelText: '취소',
        onConfirm: () => navigateTo('/login')
    }).show();
}

// 위치 아이콘 생성
function createLocationIcon() {
    const img = document.createElement('img');
    img.src = S3_CONFIG.getImageUrl('misc/location.svg');
    img.alt = '위치';
    img.className = 'location-icon';
    img.loading = 'lazy';
    return img;
}

// 상품 카드 생성
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card lg-glass lg-card-hover';
    
    // 상품 이미지
    const productImage = document.createElement('div');
    productImage.className = 'product-image';
    
    const img = document.createElement('img');
    img.alt = product.title;
    img.loading = 'lazy';

    // 썸네일 이미지 로딩 (S3, 없으면 로고 이미지 사용)
    if (product.thumbnailKey) {
        // S3에서 Public URL 조회
        S3_CONFIG.getPublicUrl(product.thumbnailKey).then((url) => {
            if (url) {
                img.src = url;
            } else {
                // URL 조회 실패 시 로고 플레이스홀더 표시
                img.remove();
                const placeholder = document.createElement('div');
                placeholder.className = 'product-image-placeholder';
                const logoImg = document.createElement('img');
                logoImg.src = S3_CONFIG.getImageUrl('misc/logo.svg');
                logoImg.alt = 'S.W.M Logo';
                placeholder.appendChild(logoImg);
                productImage.appendChild(placeholder);
            }
        });
    } else {
        // 썸네일이 없으면 로고 플레이스홀더 표시
        img.remove();
        const placeholder = document.createElement('div');
        placeholder.className = 'product-image-placeholder';
        const logoImg = document.createElement('img');
        logoImg.src = S3_CONFIG.getImageUrl('misc/logo.svg');
        logoImg.alt = 'S.W.M Logo';
        placeholder.appendChild(logoImg);
        productImage.appendChild(placeholder);
    }
    const statusBadge = document.createElement('div');
    statusBadge.className = `product-status product-status-${product.status.toLowerCase()}`;
    statusBadge.textContent = STATUS_TEXT[product.status] || product.status;
    
    // 실제 이미지가 존재하는 경우에만 추가 (플레이스홀더가 아닌 경우)
    if (img.parentElement === productImage) {
        productImage.appendChild(img);
    }
    productImage.appendChild(statusBadge);
    
    // 상품 정보
    const productInfo = document.createElement('div');
    productInfo.className = 'product-info';
    
    const title = document.createElement('h3');
    title.className = 'product-title';
    title.textContent = product.title;
    
    const meta = document.createElement('div');
    meta.className = 'product-meta';
    
    const location = document.createElement('span');
    location.className = 'product-location';
    location.appendChild(createLocationIcon());
    location.appendChild(document.createTextNode(product.location));
    
    const time = document.createElement('span');
    time.className = 'product-time';

    // 서버에서 전달된 생성일 기준으로 표시
    if (product.createdAt) {
        const date = new Date(product.createdAt);
        time.textContent = date.toLocaleDateString('ko-KR');
    } else {
        time.textContent = '';
    }
    
    meta.appendChild(location);
    meta.appendChild(time);
    
    const footer = document.createElement('div');
    footer.className = 'product-footer';
    
    const price = document.createElement('span');
    price.className = 'product-price';
    price.textContent = `${product.price.toLocaleString()}원`;
    
    footer.appendChild(price);
    
    productInfo.appendChild(title);
    productInfo.appendChild(meta);
    productInfo.appendChild(footer);
    
    card.appendChild(productImage);
    card.appendChild(productInfo);
    
    // 상품 카드 클릭 시 상세 페이지로 이동 (쿼리 파라미터로 ID 전달)
    card.addEventListener('click', () => {
        navigateTo('/marketplace-detail', { id: product.id });
    });
    
    return card;
}

// 상품 목록 렌더링
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');
    
    if (!grid) return;
    
    grid.replaceChildren();
    
    if (filteredProducts.length === 0) {
        grid.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    grid.style.display = 'grid';
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    filteredProducts.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

// 필터링
function filterProducts() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const category = document.getElementById('categoryFilter')?.value || 'all';
    const status = document.getElementById('statusFilter')?.value || 'all';
    const priceRange = document.getElementById('priceFilter')?.value || 'all';
    const sortBy = document.getElementById('sortFilter')?.value || 'latest';
    
    filteredProducts = products.filter(product => {
        // 검색 필터
        if (searchTerm && !product.title.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // 카테고리 필터
        if (category !== 'all' && product.category !== category) {
            return false;
        }
        
        // 상태 필터
        if (status !== 'all' && product.status !== status) {
            return false;
        }
        
        // 가격 필터
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(v => v ? parseInt(v) : null);
            if (min !== null && product.price < min) return false;
            if (max !== null && product.price > max) return false;
        }
        
        return true;
    });
    
    // 정렬 필터
    if (sortBy === 'price-low') {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else {
        // latest - createdAt 기준 내림차순
        filteredProducts.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return 0;
        });
    }
    
    renderProducts();
}

// 서버에서 상품 목록 로드
async function loadProducts() {
    try {
        const response = await getProducts(null, 50);
        if (!response.success) {
            throw new Error(response.message || '상품 목록을 불러오는데 실패했습니다.');
        }

        const data = response.data;
        const items = data?.items || [];

        products = items.map((item) => ({
            id: item.productId,
            title: item.title,
            price: item.price,
            category: item.category,
            location: item.location,
            status: item.status,
            thumbnailKey: item.thumbnailKey,
            createdAt: item.createdAt,
            viewCount: item.viewCount,
            seller: item.seller
        }));

        filteredProducts = [...products];
        filterProducts();
    } catch (error) {
        console.error(error);
        // 로딩 실패 시 비워진 상태로 렌더
        products = [];
        filteredProducts = [];
        renderProducts();
    }
}

function init() {
    PageLayout.init();

    // 작성 버튼 클릭 시 로그인 여부 확인
    const writeBtn = document.getElementById('writeProductBtn');
    if (writeBtn) {
        writeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!isLoggedIn()) {
                showLoginRequiredModal();
                return;
            }
            navigateTo('/marketplace-write');
        });
    }

    document.getElementById('searchInput')?.addEventListener('input', filterProducts);
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('statusFilter')?.addEventListener('change', filterProducts);
    document.getElementById('priceFilter')?.addEventListener('change', filterProducts);
    document.getElementById('sortFilter')?.addEventListener('change', filterProducts);

    // 서버 데이터 로드
    loadProducts();
}

document.addEventListener('DOMContentLoaded', init);
