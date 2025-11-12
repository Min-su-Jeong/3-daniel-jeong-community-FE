import { signup, checkEmail, checkNickname } from '../../api/index.js';
import { PageLayout, Button, ToastUtils, createFormHandler } from '../../components/index.js';
import { 
    validateEmail, 
    validatePassword, 
    validateNickname, 
    setupFormValidation, 
    setupDuplicateCheck,
    getElementValue, 
    initializeElements, 
    navigateTo, 
    setupProfileImage,
    validateProfileImage,
    getSubmitButton
} from '../../utils/common/index.js';
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
 * 회원가입 페이지 버튼 생성 (회원가입/로그인하러 가기 버튼)
 */
function createSignupButtons() {
    if (!elements.buttonGroup) return;
    
    Button.createGroup(elements.buttonGroup, [
        {
            text: '회원가입',
            type: 'submit',
            variant: 'primary',
            size: 'medium'
        },
        {
            text: '로그인하러 가기',
            type: 'button',
            variant: 'secondary',
            size: 'medium',
            onClick: () => navigateTo('/login')
        }
    ]);
}

/**
 * 회원가입 폼 필드 유효성 검사 설정 (이메일/비밀번호/닉네임 실시간 검증, 중복 체크)
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
            validation: (value) => {
                const password = getElementValue(elements.password, '');
                const isValid = value === password && value.length > 0;
                return {
                    isValid,
                    message: isValid ? '' : VALIDATION_MESSAGE.PASSWORD_MISMATCH
                };
            },
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
    
    const duplicateChecks = [
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

    duplicateChecks.forEach(({ input, checkFunction, validateFunction, successMessage, errorMessage }) => {
        const helperText = input?.nextElementSibling;
        if (input && helperText) {
            setupDuplicateCheck({
                input,
                helperText,
                checkFunction,
                validateFunction,
                successMessage,
                errorMessage
            });
        }
    });
    
    // 비밀번호 변경 시 비밀번호 확인 유효성 검사
    if (elements.password && elements.confirmPassword) {
        elements.password.addEventListener('input', () => {
            if (elements.confirmPassword.value.trim() !== '') {
                elements.confirmPassword.dispatchEvent(new Event('input'));
            }
        });
    }
}

// 프로필 이미지 업로드 설정 (미리보기, 삭제 버튼 처리)
function setupProfileImageHandler() {
    setupProfileImage({
        imageContainer: elements.profileImage,
        imageInput: elements.profileInput,
        removeButton: elements.removeImageBtn
    });
}
    
// 폼 데이터 유효성 검사 (이메일/비밀번호/닉네임 형식 검증)
function validateFormData() {
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
            ToastUtils.error(error);
            return false;
        }
    }
    
    return true;
}

// 이메일 중복 체크 (API 호출)
async function validateEmailAvailability(email) {
    try {
        const response = await checkEmail(email);
        const isAvailable = response?.data?.available ?? false;
        
        if (!isAvailable) {
            ToastUtils.error(VALIDATION_MESSAGE.EMAIL_DUPLICATE);
            return false;
        }
        
        return true;
    } catch (error) {
        ToastUtils.error(VALIDATION_MESSAGE.EMAIL_CHECK_FAILED);
        return false;
    }
}
            
// 폼 제출 핸들러 설정 (유효성 검사, API 호출, 성공 시 로그인 페이지 이동)
function setupFormSubmission() {
    if (!elements.signupForm) return;

    createFormHandler({
        form: elements.signupForm,
        loadingText: '처리중...',
        successMessage: TOAST_MESSAGE.SIGNUP_SUCCESS,
        submitButtonSelector: getSubmitButton(elements.buttonGroup),
        validate: async () => {
            if (!validateFormData()) return false;
            
            const email = getElementValue(elements.email, '');
            if (!(await validateEmailAvailability(email))) return false;
            
            const profileImage = elements.profileInput?.files[0];
            return validateProfileImage(profileImage);
        },
        onSubmit: async () => {
            const email = getElementValue(elements.email, '');
            const password = getElementValue(elements.password, '');
            const confirmPassword = getElementValue(elements.confirmPassword, '');
            const nickname = getElementValue(elements.nickname, '');
            const profileImage = elements.profileInput?.files[0];
            
            await signup({ 
                email, 
                password, 
                confirmPassword, 
                nickname
            }, profileImage);
            
            return { success: true };
        },
        onSuccess: () => {
            navigateTo('/login');
        }
    });
}

// Placeholder 및 Helper Text 설정
function setupPlaceholdersAndHelperTexts() {
    const fieldConfigs = [
        { element: elements.email, placeholder: PLACEHOLDER.EMAIL, helperText: HELPER_TEXT.EMAIL },
        { element: elements.password, placeholder: PLACEHOLDER.PASSWORD, helperText: HELPER_TEXT.PASSWORD },
        { element: elements.confirmPassword, placeholder: PLACEHOLDER.PASSWORD_CONFIRM, helperText: HELPER_TEXT.PASSWORD_CONFIRM },
        { element: elements.nickname, placeholder: PLACEHOLDER.NICKNAME, helperText: HELPER_TEXT.NICKNAME }
    ];

    fieldConfigs.forEach(({ element, placeholder, helperText }) => {
        if (element) {
            element.placeholder = placeholder;
            const helper = element.nextElementSibling;
            if (helper?.classList.contains('helper-text')) {
                helper.textContent = helperText;
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupPlaceholdersAndHelperTexts();
    PageLayout.initializePage();
    createSignupButtons();
    setupSignupFormFields();
    setupProfileImageHandler();
    setupFormSubmission();
});
