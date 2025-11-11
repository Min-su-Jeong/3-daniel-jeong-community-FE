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
    validateImageFiles,
    setupProfileImagePreview,
    createProfilePlaceholder,
    getSubmitButton
} from '../../utils/common/index.js';
import { IMAGE_CONSTANTS } from '../../utils/constants/api.js';
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
    
    // 이메일 중복 체크
    if (elements.email && elements.email.nextElementSibling) {
        setupDuplicateCheck({
            input: elements.email,
            helperText: elements.email.nextElementSibling,
            checkFunction: checkEmail,
            validateFunction: validateEmail,
            successMessage: VALIDATION_MESSAGE.EMAIL_AVAILABLE,
            errorMessage: VALIDATION_MESSAGE.EMAIL_DUPLICATE
        });
    }
    
    // 닉네임 중복 체크
    if (elements.nickname && elements.nickname.nextElementSibling) {
        setupDuplicateCheck({
            input: elements.nickname,
            helperText: elements.nickname.nextElementSibling,
            checkFunction: checkNickname,
            validateFunction: validateNickname,
            successMessage: VALIDATION_MESSAGE.NICKNAME_AVAILABLE,
            errorMessage: VALIDATION_MESSAGE.NICKNAME_DUPLICATE
        });
    }
    
    // 비밀번호 변경 시 비밀번호 확인 유효성 검사
    if (elements.password && elements.confirmPassword) {
        elements.password.addEventListener('input', () => {
            if (elements.confirmPassword.value.trim() !== '') {
                elements.confirmPassword.dispatchEvent(new Event('input'));
            }
        });
    }
}

/**
 * 프로필 이미지 업로드 설정 (미리보기, 삭제 버튼 처리)
 */
function setupProfileImage() {
    if (!elements.profileImage || !elements.profileInput) return;

    const handleRemove = () => {
        createProfilePlaceholder(elements.profileImage);
        if (elements.removeImageBtn) {
            elements.removeImageBtn.style.display = 'none';
        }
                    elements.profileInput.value = '';
    };

    setupProfileImagePreview({
        imageContainer: elements.profileImage,
        imageInput: elements.profileInput,
        removeButton: elements.removeImageBtn,
        onRemove: handleRemove
    });
    }
    
// 폼 데이터 유효성 검사 (이메일/비밀번호/닉네임 형식 검증)
function validateFormData() {
    const email = getElementValue(elements.email, '');
    const password = getElementValue(elements.password, '');
    const confirmPassword = getElementValue(elements.confirmPassword, '');
    const nickname = getElementValue(elements.nickname, '');
    
            const emailValidation = validateEmail(email);
            const passwordValidation = validatePassword(password);
            const nicknameValidation = validateNickname(nickname);
            const confirmPasswordMatch = password === confirmPassword && password.length > 0;
            
            if (!emailValidation.isValid) {
                ToastUtils.error(VALIDATION_MESSAGE.EMAIL_INVALID);
        return false;
            }
            
            if (!passwordValidation.isValid) {
                ToastUtils.error(VALIDATION_MESSAGE.PASSWORD_INVALID);
        return false;
            }
            
            if (!confirmPasswordMatch) {
                ToastUtils.error(VALIDATION_MESSAGE.PASSWORD_MISMATCH);
        return false;
            }
            
            if (!nicknameValidation.isValid) {
                ToastUtils.error(VALIDATION_MESSAGE.NICKNAME_INVALID);
        return false;
            }
            
    return true;
            }
            
// 이메일 중복 체크 (API 호출)
async function validateEmailAvailability(email) {
            try {
        const response = await checkEmail(email);
        const emailData = response?.data || {};
                if (!emailData.available) {
                    ToastUtils.error(VALIDATION_MESSAGE.EMAIL_DUPLICATE);
            return false;
                }
        return true;
            } catch (error) {
                ToastUtils.error(VALIDATION_MESSAGE.EMAIL_CHECK_FAILED);
        return false;
    }
            }
            
// 프로필 이미지 유효성 검사 (크기/형식 검증)
function validateProfileImage(profileImage) {
    if (!profileImage) return true;
    
                const { validFiles, errors } = validateImageFiles(
                    [profileImage], 
                    IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
                    1
                );
                
                if (errors.length > 0) {
                    errors.forEach(error => ToastUtils.error(error));
        return false;
                }
                
                if (validFiles.length === 0) {
                    ToastUtils.error(TOAST_MESSAGE.IMAGE_INVALID);
        return false;
                }
    
    return true;
}

/**
 * 폼 제출 핸들러 설정 (유효성 검사, API 호출, 성공 시 로그인 페이지 이동)
 */
function setupFormSubmission() {
    if (!elements.signupForm) return;

    createFormHandler({
        form: elements.signupForm,
        loadingText: '처리중...',
        successMessage: TOAST_MESSAGE.SIGNUP_SUCCESS,
        submitButtonSelector: getSubmitButton(elements.buttonGroup),
        validate: async () => {
            if (!validateFormData()) {
                return false;
            }
            
            const email = getElementValue(elements.email, '');
            if (!(await validateEmailAvailability(email))) {
                return false;
            }
            
            const profileImage = elements.profileInput?.files[0];
            if (!validateProfileImage(profileImage)) {
                return false;
            }
            
            return true;
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
    if (elements.email) elements.email.placeholder = PLACEHOLDER.EMAIL;
    if (elements.password) elements.password.placeholder = PLACEHOLDER.PASSWORD;
    if (elements.confirmPassword) elements.confirmPassword.placeholder = PLACEHOLDER.PASSWORD_CONFIRM;
    if (elements.nickname) elements.nickname.placeholder = PLACEHOLDER.NICKNAME;
    
    // Helper Text 설정
    const emailHelper = elements.email?.nextElementSibling;
    if (emailHelper?.classList.contains('helper-text')) {
        emailHelper.textContent = HELPER_TEXT.EMAIL;
    }
    const passwordHelper = elements.password?.nextElementSibling;
    if (passwordHelper?.classList.contains('helper-text')) {
        passwordHelper.textContent = HELPER_TEXT.PASSWORD;
    }
    const confirmPasswordHelper = elements.confirmPassword?.nextElementSibling;
    if (confirmPasswordHelper?.classList.contains('helper-text')) {
        confirmPasswordHelper.textContent = HELPER_TEXT.PASSWORD_CONFIRM;
    }
    const nicknameHelper = elements.nickname?.nextElementSibling;
    if (nicknameHelper?.classList.contains('helper-text')) {
        nicknameHelper.textContent = HELPER_TEXT.NICKNAME;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setupPlaceholdersAndHelperTexts();
    PageLayout.initializePage();
    createSignupButtons();
    setupSignupFormFields();
    setupProfileImage();
    setupFormSubmission();
});
