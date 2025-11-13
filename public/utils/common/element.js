/**
 * DOM 요소 조작 공통 유틸리티
 * 요소 값 읽기/쓰기, 초기화 등 DOM 조작 로직 통합
 */

// 요소 값 안전하게 추출 (checkbox는 checked, 나머지는 value)
export function getElementValue(element, defaultValue = '') {
    if (!element) return defaultValue;
    if (element.type === 'checkbox') return element.checked;
    return element.value || defaultValue;
}

// 요소 값 안전하게 설정 (checkbox는 checked, 나머지는 value)
export function setElementValue(element, value) {
    if (!element) return;
    if (element.type === 'checkbox') {
        element.checked = Boolean(value);
    } else {
        element.value = value;
    }
}

// ID 목록으로 DOM 요소 일괄 초기화
export function initializeElements(elementIds) {
    const elements = {};
    for (const [key, id] of Object.entries(elementIds)) {
        elements[key] = document.getElementById(id);
    }
    return elements;
}

// 버튼 그룹에서 제출 버튼(.btn-primary) 추출
export function getSubmitButton(buttonGroup) {
    const group = typeof buttonGroup === 'string' 
        ? document.getElementById(buttonGroup) 
        : buttonGroup;
    return group?.querySelector('.btn-primary') || null;
}

// Placeholder 설정
export function setupPlaceholders(fieldConfigs) {
    fieldConfigs.forEach(({ element, placeholder }) => {
        if (element && placeholder) {
            element.placeholder = placeholder;
        }
    });
}

// Helper Text 설정 (요소의 nextElementSibling)
export function setupHelperTexts(fieldConfigs) {
    fieldConfigs.forEach(({ element, helperText }) => {
        if (!element || !helperText) return;
        
        const helper = element.nextElementSibling;
        if (!helper?.classList.contains('helper-text')) return;
        
        helper.textContent = helperText;
        if (helper.dataset) {
            helper.dataset.defaultText = helperText;
        }
    });
}

// 독립 Helper Text 요소 설정
export function setupStandaloneHelperText(helperElement, helperText) {
    if (!helperElement || !helperText) return;
    
    helperElement.textContent = helperText;
    if (helperElement.dataset) {
        helperElement.dataset.defaultText = helperText;
    }
}

