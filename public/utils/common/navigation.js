/**
 * 페이지 네비게이션 유틸리티
 * URL 이동 및 파라미터 처리
 */
import { Modal } from '../../components/modal/modal.js';
import { MODAL_MESSAGE } from '../constants/modal.js';

// 페이지 이동 (쿼리 파라미터 자동 추가)
export function navigateTo(path, params = {}) {
    const url = new URL(path, window.location.origin);
    // 쿼리 파라미터 추가
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

// 뒤로가기 처리 (저장되지 않은 변경사항 확인)
export function handleBackNavigationWithUnsavedCheck(options = {}) {
    const {
        hasUnsavedChanges,
        subtitle = MODAL_MESSAGE.SUBTITLE_UNSAVED_CHANGES,
        title = '확인',
        confirmText = '나가기',
        cancelText = '취소',
        confirmType = 'danger'
    } = options;

    // 미저장 변경사항이 있으면 확인 모달 표시
    if (hasUnsavedChanges) {
        new Modal({
            title,
            subtitle,
            confirmText,
            cancelText,
            confirmType,
            onConfirm: () => {
                window.history.back();
            }
        }).show();
        return;
    }
    window.history.back();
}

// 게시글 작성/수정 페이지 뒤로가기 처리 (제목/내용/이미지 중 하나라도 있으면 미저장으로 간주)
export function handlePostEditorBackNavigation(postEditor) {
    const formData = postEditor?.getFormData();
    const selectedImages = postEditor?.getSelectedImages() || [];
    // 제목, 내용, 이미지 중 하나라도 있으면 미저장 변경사항으로 간주
    const hasContent = (formData?.title || formData?.content || selectedImages.length > 0);

    handleBackNavigationWithUnsavedCheck({
        hasUnsavedChanges: hasContent
    });
}

