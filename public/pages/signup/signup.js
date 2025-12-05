import { signup } from '../../utils/api/auth.js';
import { checkEmail, checkNickname } from '../../utils/api/users.js';
import { Button } from '../../components/button/button.js';
import { Toast } from '../../components/toast/toast.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { createFormHandler } from '../../components/form/form-handler.js';
import { validateEmail, validatePassword, validateNickname, setupFormValidation, setupDuplicateCheck, createPasswordMatchValidator } from '../../utils/common/validation.js';
import { getElementValue, initializeElements, getSubmitButton, setupPlaceholders, setupHelperTexts, findHelperText } from '../../utils/common/element.js';
import { navigateTo } from '../../utils/common/navigation.js';
import { setupProfileImage, validateProfileImage } from '../../utils/common/image.js';
import { PLACEHOLDER } from '../../utils/constants/placeholders.js';
import { HELPER_TEXT } from '../../utils/constants/helper-text.js';
import { VALIDATION_MESSAGE } from '../../utils/constants/validation.js';
import { TOAST_MESSAGE } from '../../utils/constants/toast.js';

const elements = initializeElements({
    buttonGroup: 'buttonGroup',
    profileImage: 'profileImage',
    profileInput: 'profileInput',
    signupForm: 'signupForm',
    removeImageBtn: 'removeImageBtn',
    email: 'email',
    password: 'password',
    confirmPassword: 'confirmPassword',
    nickname: 'nickname'
});

/**
 * 회원가입 버튼 생성
 * 폼 제출용 회원가입 버튼만 생성
 */
function createSignupButtons() {
    if (!elements.buttonGroup) return;
    
    Button.create(elements.buttonGroup, {
        text: '회원가입',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
}


/**
 * 중복 체크 설정
 * 이메일과 닉네임의 중복 여부를 실시간으로 확인
 * 디바운스를 적용하여 API 호출 최적화
 */
function configureDuplicateChecks() {
    const configs = [
        {
            input: elements.email,
            checkFunction: checkEmail,
            validateFunction: validateEmail,
            successMessage: VALIDATION_MESSAGE.EMAIL_AVAILABLE,
            errorMessage: VALIDATION_MESSAGE.EMAIL_DUPLICATE
        },
        {
            input: elements.nickname,
            checkFunction: checkNickname,
            validateFunction: validateNickname,
            successMessage: VALIDATION_MESSAGE.NICKNAME_AVAILABLE,
            errorMessage: VALIDATION_MESSAGE.NICKNAME_DUPLICATE
        }
    ];

    configs.forEach(config => {
        const helperText = findHelperText(config.input);
        if (helperText) {
            setupDuplicateCheck({ ...config, helperText });
        }
    });
}

/**
 * 비밀번호와 비밀번호 확인 필드 동기화
 * 비밀번호 필드가 변경되면 비밀번호 확인 필드도 자동으로 재검증하여 일치 여부 확인
 */
function syncPasswordConfirmation() {
    if (!elements.password || !elements.confirmPassword) return;
    
    elements.password.addEventListener('input', () => {
        // 비밀번호 확인 필드에 값이 있으면 재검증 트리거
        if (elements.confirmPassword.value.trim() !== '') {
            elements.confirmPassword.dispatchEvent(new Event('input'));
        }
    });
}

/**
 * 회원가입 폼 필드 유효성 검사 설정
 * 이메일, 비밀번호, 비밀번호 확인, 닉네임 필드에 대한 실시간 검증 및 중복 체크 설정
 */
function setupSignupFormFields() {
    setupFormValidation('signupForm', [
        {
            id: 'email',
            validation: validateEmail,
            options: {
                successMessage: VALIDATION_MESSAGE.EMAIL_VALID,
                defaultText: HELPER_TEXT.EMAIL
            }
        },
        {
            id: 'password',
            validation: validatePassword,
            options: {
                successMessage: VALIDATION_MESSAGE.PASSWORD_VALID,
                defaultText: HELPER_TEXT.PASSWORD,
                preventSpaces: true
            }
        },
        {
            id: 'confirmPassword',
            validation: createPasswordMatchValidator(elements.password),
            options: {
                successMessage: VALIDATION_MESSAGE.PASSWORD_MATCH,
                defaultText: HELPER_TEXT.PASSWORD_CONFIRM,
                preventSpaces: true
            }
        },
        {
            id: 'nickname',
            validation: validateNickname,
            options: {
                successMessage: VALIDATION_MESSAGE.NICKNAME_VALID,
                defaultText: HELPER_TEXT.NICKNAME,
                preventSpaces: true,
                preventEmojis: true,
                allowedChars: /[가-힣a-zA-Z0-9_]/
            }
        }
    ]);
    
    configureDuplicateChecks();
    syncPasswordConfirmation();
}

/**
 * 프로필 이미지 업로드 설정
 * 이미지 선택, 미리보기, 삭제 버튼 처리
 */
function setupProfileImageHandler() {
    setupProfileImage({
        imageContainer: elements.profileImage,
        imageInput: elements.profileInput,
        removeButton: elements.removeImageBtn
    });
}
    
/**
 * 폼 데이터 유효성 검사
 * 이메일, 비밀번호, 닉네임 형식 및 비밀번호 일치 여부 검증
 */
function validateSignupFormFields() {
    const email = getElementValue(elements.email, '');
    const password = getElementValue(elements.password, '');
    const confirmPassword = getElementValue(elements.confirmPassword, '');
    const nickname = getElementValue(elements.nickname, '');
    
    const validations = [
        { result: validateEmail(email), error: VALIDATION_MESSAGE.EMAIL_INVALID },
        { result: validatePassword(password), error: VALIDATION_MESSAGE.PASSWORD_INVALID },
        { result: validateNickname(nickname), error: VALIDATION_MESSAGE.NICKNAME_INVALID },
        { 
            result: { isValid: password === confirmPassword && password.length > 0 }, 
            error: VALIDATION_MESSAGE.PASSWORD_MISMATCH 
        }
    ];

    for (const { result, error } of validations) {
        if (!result.isValid) {
            Toast.error(error);
            return false;
        }
    }
    
    return true;
}

/**
 * 이메일 중복 체크 (API 호출)
 * 서버에 이메일 사용 가능 여부 확인
 */
async function checkEmailAvailability(email) {
    try {
        const response = await checkEmail(email);
        const isAvailable = response?.data?.available ?? false;
        
        if (!isAvailable) {
            Toast.error(VALIDATION_MESSAGE.EMAIL_DUPLICATE);
            return false;
        }
        
        return true;
    } catch (error) {
        Toast.error(VALIDATION_MESSAGE.EMAIL_CHECK_FAILED);
        return false;
    }
}

/**
 * 회원가입 폼 데이터 수집
 * 모든 입력 필드의 값을 객체로 반환
 */
function getSignupFormData() {
    return {
        email: getElementValue(elements.email, ''),
        password: getElementValue(elements.password, ''),
        confirmPassword: getElementValue(elements.confirmPassword, ''),
        nickname: getElementValue(elements.nickname, ''),
        profileImage: elements.profileInput?.files[0]
    };
}

/**
 * 폼 제출 전 최종 유효성 검사
 * 필드 형식 검증, 이메일 중복 체크, 프로필 이미지 검증 수행
 */
async function validateForm() {
    if (!validateSignupFormFields()) return false;
    
    const email = getElementValue(elements.email, '');
    if (!(await checkEmailAvailability(email))) return false;
    
    const profileImage = elements.profileInput?.files[0];
    return validateProfileImage(profileImage);
}

/**
 * 폼 제출 핸들러 설정
 * 유효성 검사, API 호출, 성공 시 로그인 페이지로 이동 처리
 */
function setupFormSubmission() {
    if (!elements.signupForm) return;

    createFormHandler({
        form: elements.signupForm,
        loadingText: '처리중...',
        successMessage: TOAST_MESSAGE.SIGNUP_SUCCESS,
        submitButtonSelector: getSubmitButton(elements.buttonGroup),
        validate: validateForm,
        onSubmit: async () => {
            const formData = getSignupFormData();
            
            await signup({ 
                email: formData.email, 
                password: formData.password, 
                confirmPassword: formData.confirmPassword, 
                nickname: formData.nickname
            }, formData.profileImage);
            
            return { success: true };
        },
        onSuccess: () => {
            // 회원가입 성공 토스트가 충분히 보이도록 약간의 지연 후 이동
            setTimeout(() => {
                navigateTo('/login');
            }, 1200);
        }
    });
}

/**
 * Placeholder 및 Helper Text 설정
 * 각 입력 필드의 플레이스홀더와 도움말 텍스트 초기화
 */
function setupPlaceholdersAndHelperTexts() {
    const fieldConfigs = [
        { element: elements.email, placeholder: PLACEHOLDER.EMAIL, helperText: HELPER_TEXT.EMAIL },
        { element: elements.password, placeholder: PLACEHOLDER.PASSWORD, helperText: HELPER_TEXT.PASSWORD },
        { element: elements.confirmPassword, placeholder: PLACEHOLDER.PASSWORD_CONFIRM, helperText: HELPER_TEXT.PASSWORD_CONFIRM },
        { element: elements.nickname, placeholder: PLACEHOLDER.NICKNAME, helperText: HELPER_TEXT.NICKNAME }
    ];

    setupPlaceholders(fieldConfigs);
    setupHelperTexts(fieldConfigs);
}

document.addEventListener('DOMContentLoaded', function() {
    PageLayout.init();
    
    setupPlaceholdersAndHelperTexts();
    createSignupButtons();
    setupSignupFormFields();
    setupProfileImageHandler();
    setupFormSubmission();
});
