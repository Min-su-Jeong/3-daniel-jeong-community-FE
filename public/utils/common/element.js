/**
 * DOM 요소 조작 공통 유틸리티
 * 요소 값 읽기/쓰기, 초기화, Helper Text 관리, 포맷팅, 디바운스 등 DOM 조작 로직 통합
 */

export function getElementValue(element, defaultValue = '') {
    if (!element) return defaultValue;
    return element.type === 'checkbox' ? element.checked : (element.value || defaultValue);
}

// 요소 값 안전하게 설정
export function setElementValue(element, value) {
    if (!element) return;
    element.type === 'checkbox' ? (element.checked = Boolean(value)) : (element.value = value);
}

// ID 목록으로 DOM 요소 일괄 초기화
export function initializeElements(elementIds) {
    const elements = {};
    for (const [key, id] of Object.entries(elementIds)) {
        elements[key] = document.getElementById(id);
    }
    return elements;
}

// 버튼 그룹에서 제출 버튼 추출
export function getSubmitButton(buttonGroup) {
    const group = typeof buttonGroup === 'string' ? document.getElementById(buttonGroup) : buttonGroup;
    return group?.querySelector('.btn-primary') || null;
}

// Placeholder 설정
export function setupPlaceholders(fieldConfigs) {
    fieldConfigs.forEach(({ element, placeholder }) => {
        if (element?.placeholder !== undefined && placeholder) {
            element.placeholder = placeholder;
        }
    });
}

// Helper Text 요소 찾기
export function findHelperText(input) {
    return input?.closest('.form-group')?.querySelector('.helper-text') || null;
}

// Helper Text 설정
export function setupHelperTexts(fieldConfigs) {
    fieldConfigs.forEach(({ element, helperText }) => {
        if (!element || !helperText) return;
        const helper = findHelperText(element);
        if (helper) {
            helper.textContent = helperText;
            helper.dataset.defaultText = helperText;
        }
    });
}

// 독립 Helper Text 요소 설정
export function setupStandaloneHelperText(helperElement, helperText) {
    if (!helperElement || !helperText) return;
    helperElement.textContent = helperText;
    helperElement.dataset.defaultText = helperText;
}

// Debounce 유틸리티 함수
export function debounce(func, wait = 500) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
        }, wait);
    };
}

// 숫자 포맷팅 유틸리티
export function formatNumber(num) {
    if (num >= 1000000) {
        return Math.floor(num / 1000000) + 'M';
    } else if (num >= 1000) {
        return Math.floor(num / 1000) + 'K';
    }
    return num.toString();
}

// 날짜 포맷팅 유틸리티
export function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 컨트롤 비활성화/복구 유틸리티
export function disableControls(controls = []) {
    const prev = controls.map((el) => el?.disabled);
    controls.forEach((el) => el && (el.disabled = true));
    return () => controls.forEach((el, i) => el && (el.disabled = !!prev[i]));
}

// 버튼 로딩 상태 표시
export function showButtonLoading(button, loadingText = '처리 중...') {
    if (!button) return;
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
}

// 버튼 로딩 상태 해제
export function hideButtonLoading(button, originalText = null) {
    if (!button) return;
    button.disabled = false;
    button.textContent = originalText || button.dataset.originalText || '';
    delete button.dataset.originalText;
}

// 로딩 인디케이터 표시/숨김
export function toggleLoadingIndicator(indicator, show) {
    if (!indicator) return;
    indicator.style.display = show ? 'flex' : 'none';
}

// 위치 입력 글자수 카운터 설정
export function setupLocationCharCounter(locationInput, locationCounter, options = {}) {
    const { maxLength = 26, warningThreshold = 24 } = options;
    
    if (!locationInput || !locationCounter) return;
    
    locationCounter.textContent = locationInput.value.length;
    const charCounterParent = locationCounter.parentElement;
    
    locationInput.addEventListener('input', () => {
        // 최대 길이 제한
        if (locationInput.value.length > maxLength) {
            locationInput.value = locationInput.value.substring(0, maxLength);
        }
        
        const count = locationInput.value.length;
        locationCounter.textContent = count;
        // 경고 임계값 이상일 때 경고 표시
        charCounterParent?.classList.toggle('warning', count >= warningThreshold);
    });
}

// 가격 입력 포맷터 설정 (숫자만 허용, 천 단위 콤마 자동 추가)
export function setupPriceFormatter(priceInput, options = {}) {
    const { maxDigits = 8 } = options;
    
    if (!priceInput) return;
    
    priceInput.addEventListener('input', (e) => {
        // 숫자만 추출
        let digits = e.target.value.replace(/[^0-9]/g, '');
        
        if (!digits) {
            if (e.target.value !== '') e.target.value = '';
            return;
        }
        
        // 최대 자리수 제한
        if (digits.length > maxDigits) {
            digits = digits.slice(0, maxDigits);
        }
        
        const numeric = Number(digits);
        if (Number.isNaN(numeric)) {
            e.target.value = '';
            return;
        }
        
        // 천 단위 콤마 포맷팅
        const formatted = numeric.toLocaleString('ko-KR');
        // 무한 루프 방지: 포맷된 값과 다를 때만 업데이트
        if (e.target.value !== formatted) {
            e.target.value = formatted;
        }
    });
}

// 가격 값 추출 (콤마 제거 후 숫자로 변환)
export function getPriceValue(priceInput) {
    if (!priceInput || !priceInput.value) return null;
    const numeric = priceInput.value.replace(/[^0-9]/g, '');
    return numeric ? Number(numeric) : null;
}

