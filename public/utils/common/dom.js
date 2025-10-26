/**
 * DOM 관련 공통 유틸리티
 * DOM 요소 초기화, 이벤트 바인딩 등 공통 기능
 */

/**
 * DOM 요소들을 한 번에 초기화
 * @param {Object} elementIds - 초기화할 요소들의 ID 객체
 * @returns {Object} 초기화된 DOM 요소들
 */
export function initializeElements(elementIds) {
    const elements = {};
    
    for (const [key, id] of Object.entries(elementIds)) {
        elements[key] = document.getElementById(id);
    }
    
    return elements;
}

/**
 * 요소의 값을 안전하게 가져오기
 * @param {Element} element - 요소
 * @param {string} defaultValue - 기본값
 * @returns {string} 요소의 값 또는 기본값
 */
export function getElementValue(element, defaultValue = '') {
    if (!element || element === null || element === undefined) return defaultValue;
    
    if (element.type === 'checkbox') {
        return element.checked;
    }
    
    return element.value || defaultValue;
}

/**
 * 요소의 값을 안전하게 설정
 * @param {Element} element - 요소
 * @param {string} value - 설정할 값
 */
export function setElementValue(element, value) {
    if (!element || element === null || element === undefined) return;
    
    if (element.type === 'checkbox') {
        element.checked = Boolean(value);
    } else {
        element.value = value;
    }
}

/**
 * 요소에 클래스를 안전하게 추가/제거
 * @param {Element} element - 요소
 * @param {string} className - 클래스명
 * @param {boolean} add - 추가 여부
 */
export function toggleElementClass(element, className, add) {
    if (!element || element === null || element === undefined) return;
    
    if (add) {
        element.classList.add(className);
    } else {
        element.classList.remove(className);
    }
}

/**
 * URL 파라미터에서 값을 가져오기
 * @param {string} paramName - 파라미터명
 * @param {string} defaultValue - 기본값
 * @returns {string} 파라미터 값 또는 기본값
 */
export function getUrlParam(paramName, defaultValue = '') {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName) || defaultValue;
}

/**
 * 페이지 이동 (파라미터 포함)
 * @param {string} path - 이동할 경로
 * @param {Object} params - URL 파라미터 객체
 */
export function navigateTo(path, params = {}) {
    const url = new URL(path, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    window.location.href = url.toString();
}