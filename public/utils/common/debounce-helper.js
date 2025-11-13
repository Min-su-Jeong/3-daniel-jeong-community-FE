/**
 * debounce 유틸리티 함수
 * - 의도: 연속된 함수 호출을 제한하여 마지막 호출 후 일정 시간이 지난 후에만 실행
 */
export function debounce(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
            clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}
