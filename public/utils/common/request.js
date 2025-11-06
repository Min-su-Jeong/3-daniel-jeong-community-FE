import { API_SERVER_URI, METHOD } from '../constants.js';
import { Modal } from '../../components/modal/modal.js';
import { logout } from '../../api/auth.js';
import { navigateTo } from './dom.js';
import { ToastUtils } from '../../components/toast/toast.js';

// 세션 만료 모달 표시 여부 추적
let isShowingExpiredModal = false;

// 사용자 저장소 정리
function clearUserStorage() {
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
}

// 로그아웃 처리
async function handleLogout() {
    try {
        await logout();
    } catch (error) {
        // 로그아웃 실패해도 무시
    }
    clearUserStorage();
    window.dispatchEvent(new CustomEvent('userUpdated'));
    navigateTo('/login');
    isShowingExpiredModal = false;
}

// Refresh 토큰으로 세션 갱신
async function handleRefreshToken() {
    try {
        const refreshResponse = await fetch(`${API_SERVER_URI}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (!refreshResponse.ok) {
            throw new Error('Refresh failed');
        }
        
        const refreshData = await refreshResponse.json();
        if (!refreshData.success) {
            throw new Error('Refresh failed');
        }
        
        ToastUtils.success('세션이 갱신되었습니다.');
        isShowingExpiredModal = false;
        window.dispatchEvent(new CustomEvent('userUpdated'));
        return true;
    } catch (error) {
        ToastUtils.error('세션 갱신에 실패했습니다. 로그아웃됩니다.');
        await handleLogout();
        return false;
    }
}

// 세션 만료 모달 표시
async function showSessionExpiredModal() {
    if (isShowingExpiredModal) return;
    isShowingExpiredModal = true;

    const modal = new Modal({
        title: '세션 만료',
        subtitle: '세션이 만료되었습니다. 재로그인을 진행하시겠습니까?',
        showCancel: true,
        cancelText: '로그아웃',
        confirmText: '로그인 유지',
        confirmType: 'primary',
        onConfirm: async () => {
            const success = await handleRefreshToken();
            if (success) {
                modal.hide();
            }
        },
        onCancel: async () => {
            await handleLogout();
        }
    });

    modal.show();
}

// 세션 만료 처리
async function handleSessionExpired() {
    await showSessionExpiredModal();
    const error = new Error('세션이 만료되었습니다.');
    error.status = 401;
    throw error;
}

// 요청 옵션 생성
function buildRequestOptions(method, body, isFormData) {
    const options = { method, credentials: 'include' };
    
    if (isFormData) {
        options.body = body;
    } else {
        options.headers = { 'Content-Type': 'application/json' };
        if (body) {
            options.body = JSON.stringify(body);
        }
    }
    
    return options;
}

// 응답 파싱
async function parseResponse(response) {
    try {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
    } catch (error) {
        const parseError = new Error('응답을 읽을 수 없습니다.');
        parseError.status = response.status || 0;
        throw parseError;
    }
}

// 에러 객체 생성
function createError(data, status) {
    const errorMessage = Array.isArray(data.data) 
        ? data.data.join(', ') 
        : data.data || data.message || `HTTP error! status: ${status}`;
    const error = new Error(errorMessage);
    error.status = status;
    return error;
}

// 공통 API 요청 처리 함수
export async function request({
    method = METHOD.POST,
    url = '/',
    params = '',
    body = undefined,
    isFormData = false,
}) {
    const options = buildRequestOptions(method, body, isFormData);
    const urlWithParams = params ? `${API_SERVER_URI}${url}?${params}` : `${API_SERVER_URI}${url}`;
    
    try {
        let response;
        try {
            response = await fetch(urlWithParams, options);
        } catch (fetchError) {
            // CORS 에러로 fetch가 실패한 경우 세션 만료로 간주
            if (fetchError.name === 'TypeError') {
                await handleSessionExpired();
            }
            throw fetchError;
        }
        
        // 401 에러 처리
        if (response.status === 401) {
            await handleSessionExpired();
        }
        
        const data = await parseResponse(response);

        // 응답 에러 처리
        if (!response.ok || !data.success) {
            throw createError(data, response.status);
        }

        return data;
    } catch (error) {
        // status가 없는 경우 기본값 설정
        if (!error.status) {
            error.status = 0;
        }
        throw error;
    }
}
