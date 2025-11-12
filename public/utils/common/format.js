/**
 * 숫자 포맷팅 유틸리티
 * 큰 숫자를 K/M 단위로 축약 표시
 */

// 숫자를 K/M 단위로 축약 표시 (1000 이상 K, 1000000 이상 M)
export function formatNumber(num) {
    if (num >= 1000000) {
        return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) {
        return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
}

// 날짜를 YYYY-MM-DD HH:mm:ss 형식으로 포맷팅
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}