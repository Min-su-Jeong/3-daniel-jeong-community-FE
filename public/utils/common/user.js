/**
 * 사용자 정보 저장소 관리 유틸리티
 * localStorage/sessionStorage 기반 사용자 정보 CRUD
 */

// 저장소에서 사용자 정보 조회 (localStorage 우선, 없으면 sessionStorage)
export function getUserFromStorage() {
    try {
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
    }
}

// 사용자 정보 저장소에 저장 (rememberMe에 따라 localStorage/sessionStorage 선택)
export function saveUserToStorage(userData, rememberMe = false) {
    try {
        const userStr = JSON.stringify(userData);
        
        if (rememberMe) {
            localStorage.setItem('user', userStr);
            sessionStorage.removeItem('user');
        } else {
            sessionStorage.setItem('user', userStr);
            localStorage.removeItem('user');
        }
    } catch (error) {
        console.error('Failed to save user data:', error);
    }
}

// 저장소에서 사용자 정보 삭제
export function removeUserFromStorage() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
}

// 사용자 정보 업데이트 이벤트 발생
export function dispatchUserUpdatedEvent() {
    window.dispatchEvent(new CustomEvent('userUpdated'));
}

// 로그인 필수 체크 (사용자 ID 존재 여부 확인)
export function requireLogin(message = '로그인이 필요합니다.') {
    const user = getUserFromStorage();
    if (!user || !user.id) {
        return { isLoggedIn: false, user: null };
    }
    return { isLoggedIn: true, user };
}

// 현재 사용자 정보 조회 (userId, profileImageKey만 반환)
export function getCurrentUserInfo() {
    const currentUser = getUserFromStorage();
    return {
        userId: currentUser?.id || null,
        profileImageKey: currentUser?.profileImageKey || null
    };
}