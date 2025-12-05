import { request } from '../common/request.js';
import { METHOD } from '../constants/api.js';

// 중고거래 상품 목록 조회 API (커서 기반 페이지네이션)
export async function getProducts(cursor = null, size = 12) {
    const params = cursor ? `cursor=${cursor}&size=${size}` : `size=${size}`;
    return await request({
        method: METHOD.GET,
        url: `/api/products`,
        params: params
    });
}

// 중고거래 상품 상세 조회 API
export async function getProductById(productId) {
    return await request({
        method: METHOD.GET,
        url: `/api/products/${productId}`
    });
}

// 중고거래 상품 작성 API
export async function createProduct(productData) {
    return await request({
        method: METHOD.POST,
        url: `/api/products`,
        body: {
            userId: productData.userId,
            title: productData.title,
            content: productData.content,
            price: productData.price,
            category: productData.category,
            location: productData.location,
            status: productData.status || 'SELLING',
            imageObjectKeys: productData.imageObjectKeys || []
        }
    });
}

// 중고거래 상품 수정 API
export async function updateProduct(productId, productData) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/products/${productId}`,
        body: {
            title: productData.title,
            content: productData.content,
            price: productData.price,
            category: productData.category,
            location: productData.location,
            status: productData.status,
            imageObjectKeys: productData.imageObjectKeys || []
        }
    });
}

// 중고거래 상품 삭제 API
export async function deleteProduct(productId) {
    return await request({
        method: METHOD.DELETE,
        url: `/api/products/${productId}`
    });
}

// 중고거래 상품 상태 변경 API
export async function updateProductStatus(productId, status) {
    return await request({
        method: METHOD.PATCH,
        url: `/api/products/${productId}/status`,
        body: { status }
    });
}
