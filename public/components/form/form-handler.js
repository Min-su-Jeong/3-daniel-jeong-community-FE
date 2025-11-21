/**
 * Form 제출 처리 공통 유틸리티
 */

import { PageLayout } from '../layout/page-layout.js';
import { Toast } from '../toast/toast.js';
import { getElementValue } from '../../utils/common/element.js';
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

    const formElement = typeof form === 'string' 
        ? document.getElementById(form) 
        : form;

    if (!formElement) {
        console.error('Form element not found');
        return () => {};
    }

    let isSubmitting = false;
    let submitButton = null;

    // 제출 버튼 찾기
    if (typeof submitButtonSelector === 'string') {
        submitButton = formElement.querySelector(submitButtonSelector) 
            || document.querySelector(submitButtonSelector);
    } else {
        submitButton = submitButtonSelector;
    }

    const originalButtonText = submitButton?.textContent || '';

    // Form 제출 이벤트 핸들러 (중복 제출 방지, 유효성 검사, 로딩 처리)
    const handleSubmit = async (event) => {
        if (preventDefault) {
            event.preventDefault();
        }

        if (isSubmitting) {
            return;
        }

        if (!await validateFormSubmission(validate)) {
            return;
        }

        isSubmitting = true;
        const previousStates = disableFormInputs(formElement, submitButton);
        
        if (submitButton) {
            PageLayout.showLoading(submitButton, loadingText);
        }

        try {
            await processFormSubmission(formElement, onSubmit, successMessage, onSuccess);
        } catch (error) {
            handleFormError(error, onError, formElement);
        } finally {
            restoreFormState(submitButton, previousStates, originalButtonText);
            isSubmitting = false;
        }
    };

    // 폼 제출 유효성 검사
    async function validateFormSubmission(validate) {
        if (!validate) return true;

        const validationResult = await validate();
        if (validationResult !== true) {
            if (typeof validationResult === 'string') {
                Toast.error(validationResult);
            }
            return false;
        }
        return true;
    }

    // 폼 입력 필드 비활성화
    function disableFormInputs(formElement, submitButton) {
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

    // 폼 제출 처리
    async function processFormSubmission(formElement, onSubmit, successMessage, onSuccess) {
        const formData = collectFormData(formElement);
        const result = await onSubmit(formData, formElement);

        if (successMessage) {
            Toast.success(successMessage);
        }

        if (onSuccess) {
            await onSuccess(result, formData);
        }
    }

    // 폼 에러 처리
    function handleFormError(error, onError, formElement) {
        const errorMessage = error.message || TOAST_MESSAGE.GENERIC_ERROR;
        Toast.error(errorMessage);

        if (onError) {
            onError(error, formElement);
        }
    }

    // 폼 상태 복구
    function restoreFormState(submitButton, previousStates, originalButtonText) {
        if (submitButton) {
            PageLayout.hideLoading(submitButton, originalButtonText);
        }

        previousStates.forEach(({ element, disabled }) => {
            element.disabled = disabled;
        });
    }

    // 이벤트 리스너 등록
    formElement.addEventListener('submit', handleSubmit);

    // 핸들러 제거 함수 반환
    return () => {
        formElement.removeEventListener('submit', handleSubmit);
    };
}

// Form 요소에서 데이터 수집 (FormData 기반, 체크박스 별도 처리)
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

    // 체크박스 처리
    const checkboxes = formElement.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.name) {
            formData[checkbox.name] = checkbox.checked;
        }
    });

    return formData;
}

// Form에서 지정된 필드들의 값만 추출
export function getFormValues(formElement, fieldIds) {
    const values = {};
    
    fieldIds.forEach(id => {
        const element = formElement.querySelector(`#${id}`);
        if (element) {
            values[id] = getElementValue(element, '');
        }
    });

    return values;
}
