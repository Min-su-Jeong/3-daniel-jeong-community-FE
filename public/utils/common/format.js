/**
 * 숫자 포맷팅
 * @param {number} num - 포맷팅할 숫자
 * @returns {string} - 포맷팅된 문자열
 */
export function formatNumber(num) {
    if (num >= 1000000) {
        return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) {
        return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
}

/**
 * 날짜 포맷팅 (YYYY-MM-DD HH:mm:ss 형식)
 * @param {Date} date - 포맷팅할 날짜 객체
 * @returns {string} - 포맷팅된 날짜 문자열
 */
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}