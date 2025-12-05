/**
 * Form 제출 처리 공통 유틸리티
 */

import { Toast } from '../toast/toast.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

// Form 제출 핸들러 생성 (로딩/에러/성공 처리 자동화)
export function createFormHandler(options) {
    const {
        form,
        onSubmit,
        onSuccess,
        onError,
        loadingText = '처리중...',
        successMessage = '',
        submitButtonSelector = '.btn-primary',
        preventDefault = true,
        validate = null
    } = options;

    const formElement = resolveFormElement(form);
    if (!formElement) {
        console.error('Form element not found:', form);
        return createNoopCleanup();
    }

    const submitButton = resolveSubmitButton(formElement, submitButtonSelector);
    const originalButtonText = submitButton?.textContent || '';
    let isSubmitting = false;

    const handleSubmit = async (event) => {
        if (preventDefault) {
            event.preventDefault();
        }

        if (isSubmitting) {
            return;
        }

        if (!await runValidation(validate)) {
            return;
        }

        isSubmitting = true;
        const formState = disableForm(formElement, submitButton);
        
        if (submitButton) {
            setButtonLoading(submitButton, loadingText);
        }

        try {
            const formData = collectFormData(formElement);
            const result = await onSubmit(formData, formElement);

            if (successMessage) {
                Toast.success(successMessage);
            }

            if (onSuccess) {
                await onSuccess(result, formData);
            }
        } catch (error) {
            handleError(error, onError, formElement);
        } finally {
            restoreForm(formElement, submitButton, formState, originalButtonText);
            isSubmitting = false;
        }
    };

    formElement.addEventListener('submit', handleSubmit);

    return () => {
        formElement.removeEventListener('submit', handleSubmit);
    };
}

// Form 요소 해석 (ID 문자열 또는 요소 객체)
function resolveFormElement(form) {
    if (typeof form === 'string') {
        return document.getElementById(form);
    }
    return form instanceof HTMLElement ? form : null;
}

// 제출 버튼 해석
function resolveSubmitButton(formElement, selector) {
    if (selector instanceof HTMLElement) {
        return selector;
    }
    
    if (typeof selector === 'string') {
        return formElement.querySelector(selector) 
            || document.querySelector(selector);
    }
    
    return null;
}

// 유효성 검사 실행
async function runValidation(validate) {
    if (!validate) {
        return true;
    }

    try {
        const result = await validate();
        
        if (result === true) {
            return true;
        }
        
        if (typeof result === 'string') {
            Toast.error(result);
        }
        
        return false;
    } catch (error) {
        Toast.error(error.message || '유효성 검사 중 오류가 발생했습니다.');
        return false;
    }
}

// 폼 비활성화 및 상태 저장
function disableForm(formElement, submitButton) {
    const inputs = formElement.querySelectorAll('input, textarea, select, button');
    const previousStates = Array.from(inputs).map(input => ({
        element: input,
        disabled: input.disabled
    }));
    
    inputs.forEach(input => {
        if (input !== submitButton) {
            input.disabled = true;
        }
    });
    
    return previousStates;
}

// 폼 상태 복구
function restoreForm(formElement, submitButton, previousStates, originalButtonText) {
    if (submitButton) {
        removeButtonLoading(submitButton, originalButtonText);
    }

    previousStates.forEach(({ element, disabled }) => {
        element.disabled = disabled;
    });
}

// 버튼 로딩 상태 설정
function setButtonLoading(button, loadingText) {
    if (!button) return;
    
    button.disabled = true;
    button.dataset.originalText = button.textContent || '';
    button.textContent = loadingText;
}

// 버튼 로딩 상태 제거
function removeButtonLoading(button, originalText) {
    if (!button) return;
    
    button.disabled = false;
    button.textContent = originalText || button.dataset.originalText || '';
    delete button.dataset.originalText;
}

// 에러 처리
function handleError(error, onError, formElement) {
    const errorMessage = error?.message || TOAST_MESSAGE.GENERIC_ERROR;
    Toast.error(errorMessage);

    if (onError) {
        onError(error, formElement);
    }
}

// 빈 정리 함수 (에러 처리용)
function createNoopCleanup() {
    return () => {};
}

// Form 요소에서 데이터 수집
// FormData를 사용하여 폼 데이터를 수집하고, 체크박스는 별도로 처리합니다.
export function collectFormData(formElement) {
    const formData = {};
    const formDataObj = new FormData(formElement);

    // FormData에서 객체로 변환
    for (const [key, value] of formDataObj.entries()) {
        if (!formData[key]) {
            formData[key] = value;
            continue;
        }
        
        // 배열로 처리 (같은 name을 가진 필드들)
        if (Array.isArray(formData[key])) {
            formData[key].push(value);
        } else {
            formData[key] = [formData[key], value];
        }
    }

    // 체크박스 처리 (FormData는 체크되지 않은 체크박스를 포함하지 않음)
    const checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.name) {
            formData[checkbox.name] = checkbox.checked;
        }
    });

    return formData;
}
