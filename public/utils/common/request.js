import { API_SERVER_URI, METHOD } from '../constants/api.js';
import { TOAST_MESSAGE } from '../constants/toast.js';
import { MODAL_MESSAGE } from '../constants/modal.js';
import { Modal, Toast } from '../../components/index.js';
import { logout } from '../../api/index.js';
import { navigateTo } from './navigation.js';
import { removeUserFromStorage, dispatchUserUpdatedEvent } from './user.js';

/**
 * HTTP 요청 공통 유틸리티
 * 세션 관리, 에러 처리, 요청/응답 파싱 등 API 통신 로직 통합
 */

// 세션 만료 모달 중복 표시 방지 플래그
let isShowingExpiredModal = false;

/**
 * 로그아웃 처리 (API 호출 후 저장소 정리 및 로그인 페이지 이동)
 */
async function handleLogout() {
    try {
        await logout();
    } catch (error) {
        // 로그아웃 실패해도 무시
    }
    removeUserFromStorage();
    dispatchUserUpdatedEvent();
    navigateTo('/login');
    isShowingExpiredModal = false;
}

// Refresh 토큰으로 세션 갱신 (성공 시 모달 닫고 이벤트 발생, 실패 시 로그아웃)
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
        
        Toast.success(TOAST_MESSAGE.SESSION_RENEWED);
        isShowingExpiredModal = false;
        dispatchUserUpdatedEvent();
        return true;
    } catch (error) {
        Toast.error(TOAST_MESSAGE.SESSION_RENEW_FAILED);
        await handleLogout();
        return false;
    }
}

/**
 * 세션 만료 모달 표시 (중복 표시 방지, 갱신/로그아웃 선택)
 */
async function showSessionExpiredModal() {
    if (isShowingExpiredModal) return;
    isShowingExpiredModal = true;

    const modal = new Modal({
        title: '세션 만료',
        subtitle: MODAL_MESSAGE.SUBTITLE_SESSION_EXPIRED,
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

/**
 * 세션 만료 처리 (모달 표시 후 401 에러 throw)
 */
async function handleSessionExpired() {
    await showSessionExpiredModal();
    const error = new Error('세션이 만료되었습니다.');
    error.status = 401;
    throw error;
}

// Fetch 요청 옵션 생성 (FormData/JSON 자동 처리)
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

// HTTP 응답 본문 파싱 (빈 응답 처리)
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

// API 에러 객체 생성 (배열/단일 메시지 모두 처리)
function createError(data, status) {
    const errorMessage = Array.isArray(data.data) 
        ? data.data.join(', ') 
        : data.data || data.message || `HTTP error! status: ${status}`;
    const error = new Error(errorMessage);
    error.status = status;
    return error;
}

// 공통 API 요청 처리 (세션 만료 자동 처리, 에러 통일)
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
