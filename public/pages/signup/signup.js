// API 함수들 import
import { signup } from '../../api/auth.js';
import { checkEmail, checkNickname } from '../../api/users.js';
import { PageLayout } from '../../components/layout/page-layout.js';
import { Button } from '../../components/button/button.js';
import { validateEmail, validatePassword, validateNickname, setupFormValidation } from '../../utils/common/validation.js';
import { debounce } from '../../utils/common/debounce-helper.js';
import { getElementValue, setElementValue, initializeElements, navigateTo } from '../../utils/common/dom.js';
import { ToastUtils } from '../../components/toast/toast.js';
import { validateImageFiles } from '../../utils/common/image.js';
import { IMAGE_CONSTANTS } from '../../utils/constants.js';

// 회원가입 버튼 컴포넌트 생성
function createSignupButtons() {
    const elements = initializeElements({
        buttonGroup: 'buttonGroup'
    });
    if (!elements.buttonGroup) return;
    
    // 기존 버튼 제거
    elements.buttonGroup.innerHTML = '';
    
    // 회원가입 버튼
    const signupButton = new Button({
        text: '회원가입',
        type: 'submit',
        variant: 'primary',
        size: 'medium'
    });
    
    // 로그인 버튼
    const loginButton = new Button({
        text: '로그인하러 가기',
        type: 'button',
        variant: 'secondary',
        size: 'medium',
        onClick: () => {
            navigateTo('/login');
        }
    });
    
    // 버튼들을 컨테이너에 추가
    signupButton.appendTo(elements.buttonGroup);
    loginButton.appendTo(elements.buttonGroup);
}

// 회원가입 폼 필드 유효성 검사 설정
function setupSignupFormFields() {
    setupFormValidation('signupForm', [
        {
            id: 'email',
            validation: validateEmail,
            options: {
                successMessage: '유효한 이메일 주소입니다',
                defaultText: '이메일 주소를 정확히 입력해주세요'
            }
        },
        {
            id: 'password',
            validation: validatePassword,
            options: {
                successMessage: '유효한 비밀번호입니다',
                defaultText: '영문, 숫자, 특수문자를 포함하여 8자 이상 입력해주세요',
                preventSpaces: true
            }
        },
        {
            id: 'confirmPassword',
            validation: (value) => {
                const password = getElementValue(document.getElementById('password'), '');
                const isValid = value === password && value.length > 0;
                return {
                    isValid,
                    message: isValid ? '' : '비밀번호가 일치하지 않습니다'
                };
            },
            options: {
                successMessage: '비밀번호가 일치합니다',
                defaultText: '비밀번호를 다시 한번 입력해주세요',
                preventSpaces: true
            }
        },
        {
            id: 'nickname',
            validation: validateNickname,
            options: {
                successMessage: '유효한 닉네임입니다',
                defaultText: '2-10자 사이로 입력해주세요',
                preventSpaces: true,
                preventEmojis: true,
                allowedChars: /[가-힣a-zA-Z0-9_]/
            }
        }
    ]);
    
    // 이메일 중복 체크
    const emailInput = document.getElementById('email');
    const emailHelperText = emailInput?.nextElementSibling;
    if (emailInput && emailHelperText) {
        const checkEmailAvailability = debounce(async (email) => {
            // 형식 검증이 통과한 경우에만 중복 체크
            const formatValidation = validateEmail(email);
            if (!formatValidation.isValid || email.trim() === '') {
                return;
            }
            
            try {
                const response = await checkEmail(email);
                const emailData = response?.data || {};
                
                // 이메일 사용 가능 여부 확인 (삭제 대기 중인 이메일도 중복으로 처리)
                if (emailData.available) {
                    // 사용 가능
                    emailInput.classList.remove('error', 'warning');
                    emailInput.classList.add('success');
                    emailHelperText.classList.remove('error', 'warning');
                    emailHelperText.classList.add('success');
                    emailHelperText.textContent = '사용 가능한 이메일입니다';
                } else {
                    // 중복 (삭제 대기 중인 이메일 포함)
                    emailInput.classList.remove('success');
                    emailInput.classList.add('error');
                    emailHelperText.classList.remove('success');
                    emailHelperText.classList.add('error');
                    emailHelperText.textContent = '이미 사용 중인 이메일입니다';
                }
            } catch (error) {
                // 네트워크 오류 등은 무시
            }
        }, 500);
        
        emailInput.addEventListener('input', () => {
            const email = emailInput.value.trim();
            if (email && validateEmail(email).isValid) {
                checkEmailAvailability(email);
            }
        });
    }
    
    /**
     * 닉네임 중복 체크
     * - 의도: 닉네임 형식 검증 통과 후 백엔드 API를 통한 중복 여부 확인
     */
    const nicknameInput = document.getElementById('nickname');
    const nicknameHelperText = nicknameInput?.nextElementSibling;
    if (nicknameInput && nicknameHelperText) {
        const checkNicknameAvailability = debounce(async (nickname) => {
            const formatValidation = validateNickname(nickname);
            if (!formatValidation.isValid || nickname.trim() === '') {
                return;
            }
            
            try {
                const response = await checkNickname(nickname);
                // 닉네임 사용 가능 여부 확인 (true = 사용 가능, false = 중복)
                if (response?.data === true) {
                    // 사용 가능
                    nicknameInput.classList.remove('error', 'warning');
                    nicknameInput.classList.add('success');
                    nicknameHelperText.classList.remove('error', 'warning');
                    nicknameHelperText.classList.add('success');
                    nicknameHelperText.textContent = '사용 가능한 닉네임입니다';
                } else {
                    // 중복
                    nicknameInput.classList.remove('success');
                    nicknameInput.classList.add('error');
                    nicknameHelperText.classList.remove('success');
                    nicknameHelperText.classList.add('error');
                    nicknameHelperText.textContent = '이미 사용 중인 닉네임입니다';
                }
            } catch (error) {
                // 네트워크 오류 등은 무시
            }
        }, 500);
        
        nicknameInput.addEventListener('input', () => {
            const nickname = nicknameInput.value.trim();
            if (nickname && validateNickname(nickname).isValid) {
                checkNicknameAvailability(nickname);
            }
        });
    }
    
    // 비밀번호 변경 시 비밀번호 확인 유효성 검사
    const passwordElements = initializeElements({
        password: 'password',
        confirmPassword: 'confirmPassword'
    });
    if (passwordElements.password && passwordElements.confirmPassword) {
        passwordElements.password.addEventListener('input', () => {
            if (passwordElements.confirmPassword.value.trim() !== '') {
                passwordElements.confirmPassword.dispatchEvent(new Event('input'));
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    // 공통 페이지 초기화
    PageLayout.initializePage();
    
    // 회원가입 버튼 컴포넌트 생성
    createSignupButtons();
    
    // 회원가입 폼 필드 유효성 검사 설정
    setupSignupFormFields();
    
    // DOM 요소 초기화
    const elements = initializeElements({
        profileImage: 'profileImage',
        profileInput: 'profileInput',
        signupForm: 'signupForm'
    });
    
    // 프로필 이미지 선택 이벤트 설정
    if (elements.profileImage && elements.profileInput) {
        elements.profileInput.accept = IMAGE_CONSTANTS.ACCEPT;
        elements.profileImage.onclick = function() {
            elements.profileInput.click();
        };

        // 프로필 이미지 선택 시 유효성 검사 및 미리보기
        elements.profileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                // 이미지 파일 유효성 검사
                const { validFiles, errors } = validateImageFiles([file], IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 1);
                
                if (errors.length > 0) {
                    errors.forEach(error => ToastUtils.error(error));
                    elements.profileInput.value = '';
                    return;
                }
                
                if (validFiles.length > 0) {
                    // FileReader를 사용하여 미리보기 생성
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        elements.profileImage.innerHTML = 
                            '<img src="' + e.target.result + '" alt="프로필 이미지">';
                    };
                    reader.readAsDataURL(file);
                }
            }
        };
    }

    // 회원가입 폼 제출 처리
    if (!elements.signupForm) {
        return;
    }
    
    /**
     * 회원가입 폼 제출 처리
     * - 의도: 회원가입 요청 처리
     * - 로직:
     *   1. 프로필 이미지가 있는 경우: 이미지 유효성 검사 + 회원정보 유효성 검사
     *   2. 프로필 이미지가 없는 경우: 회원정보 유효성 검사만
     *   3. 모든 검사 통과 시 회원가입 진행
     */
    elements.signupForm.onsubmit = async function(event) {
        event.preventDefault(); // 기본 제출 방지

        try {
            const formElements = initializeElements({
                email: 'email',
                password: 'password',
                confirmPassword: 'confirmPassword',
                nickname: 'nickname'
            });
            
            const email = getElementValue(formElements.email, '');
            const password = getElementValue(formElements.password, '');
            const confirmPassword = getElementValue(formElements.confirmPassword, '');
            const nickname = getElementValue(formElements.nickname, '');
            const profileImage = elements.profileInput?.files[0];
        
            // 1. 회원정보 유효성 검사
            const emailValidation = validateEmail(email);
            const passwordValidation = validatePassword(password);
            const nicknameValidation = validateNickname(nickname);
            const confirmPasswordMatch = password === confirmPassword && password.length > 0;
            
            if (!emailValidation.isValid) {
                ToastUtils.error('이메일을 확인해주세요.');
                return;
            }
            
            if (!passwordValidation.isValid) {
                ToastUtils.error('비밀번호를 확인해주세요.');
                return;
            }
            
            if (!confirmPasswordMatch) {
                ToastUtils.error('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                return;
            }
            
            if (!nicknameValidation.isValid) {
                ToastUtils.error('닉네임을 확인해주세요.');
                return;
            }
            
            // 2. 이메일 중복 최종 확인 (삭제 대기 중인 이메일 포함)
            try {
                const emailCheckResponse = await checkEmail(email);
                const emailData = emailCheckResponse?.data || {};
                if (!emailData.available) {
                    ToastUtils.error('이미 사용 중인 이메일입니다.');
                    return;
                }
            } catch (error) {
                ToastUtils.error('이메일 중복 확인에 실패했습니다. 다시 시도해주세요.');
                return;
            }
            
            // 3. 프로필 이미지 유효성 검사 (있는 경우)
            if (profileImage) {
                const { validFiles, errors } = validateImageFiles(
                    [profileImage], 
                    IMAGE_CONSTANTS.MAX_IMAGE_SIZE, 
                    1
                );
                
                if (errors.length > 0) {
                    errors.forEach(error => ToastUtils.error(error));
                    return;
                }
                
                if (validFiles.length === 0) {
                    ToastUtils.error('프로필 이미지가 유효하지 않습니다.');
                    return;
                }
            }
            
            // 4. 모든 검사 통과 시 회원가입 진행
            // 로딩 상태 표시 (회원가입 버튼)
            const buttonGroup = document.getElementById('buttonGroup');
            const submitButton = buttonGroup?.querySelector('.btn-primary');
            PageLayout.showLoading(submitButton, '처리중...');
            
            // 회원가입 처리
            await signup({ 
                email, 
                password, 
                confirmPassword, 
                nickname
            }, profileImage);
            
            ToastUtils.success('회원가입이 완료되었습니다!');
            navigateTo('/login');
            
        } catch (error) {
            // 에러 메시지 표시
            const errorMessage = error.message || '회원가입에 실패했습니다.';
            ToastUtils.error(errorMessage);
        } finally {
            // 로딩 상태 해제
            const buttonGroup = document.getElementById('buttonGroup');
            const submitButton = buttonGroup?.querySelector('.btn-primary');
            PageLayout.hideLoading(submitButton, '회원가입');
        }
    };
});
