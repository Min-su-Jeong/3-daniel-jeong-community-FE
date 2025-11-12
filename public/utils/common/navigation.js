/**
 * 페이지 네비게이션 유틸리티
 * URL 이동 및 파라미터 처리
 */

// 페이지 이동 (쿼리 파라미터 자동 추가)
export function navigateTo(path, params = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    window.location.href = url.toString();
}

// URL 쿼리 파라미터 값 추출
export function getUrlParam(paramName, defaultValue = '') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName) || defaultValue;
}

