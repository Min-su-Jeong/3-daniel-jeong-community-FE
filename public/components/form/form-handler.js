/**
 * Form 제출 처리 공통 유틸리티
 */

import { PageLayout, ToastUtils } from '../index.js';
import { getElementValue } from '../../utils/common/index.js';
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

        // 커스텀 유효성 검사
        if (validate) {
            const validationResult = await validate();
            if (validationResult !== true) {
                if (typeof validationResult === 'string') {
                    ToastUtils.error(validationResult);
                }
                return;
            }
        }

        isSubmitting = true;

        // 로딩 상태 표시
        if (submitButton) {
            PageLayout.showLoading(submitButton, loadingText);
        }

        // 입력 필드 비활성화
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

        try {
            // Form 데이터 수집
            const formData = collectFormData(formElement);
            
            // 제출 처리
            const result = await onSubmit(formData, formElement);

            // 성공 처리
            if (successMessage) {
                ToastUtils.success(successMessage);
            }

            if (onSuccess) {
                await onSuccess(result, formData);
            }

        } catch (error) {
            const errorMessage = error.message || TOAST_MESSAGE.GENERIC_ERROR;
            ToastUtils.error(errorMessage);

            if (onError) {
                onError(error, formElement);
            }
        } finally {
            // 로딩 상태 해제
            if (submitButton) {
                PageLayout.hideLoading(submitButton, originalButtonText);
            }

            // 입력 필드 활성화
            previousStates.forEach(({ element, disabled }) => {
                element.disabled = disabled;
            });

            isSubmitting = false;
        }
    };

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
        if (formData[key]) {
            // 배열로 처리 (같은 name을 가진 필드들)
            if (Array.isArray(formData[key])) {
                formData[key].push(value);
            } else {
                formData[key] = [formData[key], value];
            }
        } else {
            formData[key] = value;
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
