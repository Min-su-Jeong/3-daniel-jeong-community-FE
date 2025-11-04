// API 함수들 import
import { signup } from '../../api/auth.js';
import { uploadImage } from '../../api/images.js';
import { updateUser, checkEmail, checkNickname } from '../../api/users.js';
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
                if (response?.data === true) {
                    // 사용 가능
                    emailInput.classList.remove('error', 'warning');
                    emailInput.classList.add('success');
                    emailHelperText.classList.remove('error', 'warning');
                    emailHelperText.classList.add('success');
                    emailHelperText.textContent = '사용 가능한 이메일입니다';
                } else {
                    // 중복
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
    
    // 닉네임 중복 체크
    const nicknameInput = document.getElementById('nickname');
    const nicknameHelperText = nicknameInput?.nextElementSibling;
    if (nicknameInput && nicknameHelperText) {
        const checkNicknameAvailability = debounce(async (nickname) => {
            // 형식 검증이 통과한 경우에만 중복 체크
            const formatValidation = validateNickname(nickname);
            if (!formatValidation.isValid || nickname.trim() === '') {
                return;
            }
            
            try {
                const response = await checkNickname(nickname);
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
        elements.profileImage.onclick = function() {
            elements.profileInput.click();
        };

        // 프로필 이미지 선택 시 미리보기
        elements.profileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                // 이미지 파일 유효성 검사
                const { validFiles, errors } = validateImageFiles([file], IMAGE_CONSTANTS.MAX_IMAGE_SIZE, IMAGE_CONSTANTS.SUPPORTED_TYPES, 1);
                
                if (errors.length > 0) {
                    errors.forEach(error => ToastUtils.error(error));
                    elements.profileInput.value = '';
                    return;
                }
                
                if (validFiles.length > 0) {
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
        
            // 로딩 상태 표시 (회원가입 버튼)
            const buttonGroup = document.getElementById('buttonGroup');
            const submitButton = buttonGroup?.querySelector('.btn-primary');
            PageLayout.showLoading(submitButton, '처리중...');
            
            // 1. 회원가입 먼저 처리
            const signupResponse = await signup({ 
                email, 
                password, 
                confirmPassword, 
                nickname, 
                profileImageKey: null
            });
            
            // 2. 프로필 이미지가 있으면 업로드하고 사용자 정보 업데이트
            if (profileImage) {
                if (!signupResponse?.data?.id) {
                    ToastUtils.warning('프로필 이미지를 업로드할 수 없습니다. 회원가입은 완료되었습니다.');
                } else {
                    try {
                        // 이미지 업로드
                        const uploadResponse = await uploadImage('PROFILE', signupResponse.data.id, profileImage);
                        
                        // 사용자 정보 업데이트
                        if (uploadResponse?.data?.objectKey) {
                            const updateResponse = await updateUser(signupResponse.data.id, {
                                nickname: nickname,
                                profileImageKey: uploadResponse.data.objectKey
                            });
                            
                            // 업데이트된 사용자 정보를 localStorage에 저장 (나중에 로그인 시 사용)
                            if (updateResponse?.data) {
                                localStorage.setItem('user', JSON.stringify(updateResponse.data));
                            } else {
                                ToastUtils.warning('프로필 이미지가 저장되지 않았습니다. 회원정보수정에서 다시 업로드해주세요.');
                            }
                        } else {
                            ToastUtils.warning('프로필 이미지 업로드에 실패했습니다. 회원정보수정에서 다시 업로드해주세요.');
                        }
                    } catch (uploadError) {
                        // 사용자 친화적인 에러 메시지 표시
                        let userMessage = '프로필 이미지 업로드에 실패했습니다.';
                        if (uploadError.message) {
                            if (uploadError.message.includes('지원하지 않는 이미지 확장자')) {
                                userMessage = '지원하지 않는 이미지 형식입니다. JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.';
                            } else if (uploadError.message.includes('최대 크기')) {
                                userMessage = '이미지 파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.';
                            } else if (uploadError.message.includes('업로드 파일이 비어있습니다')) {
                                userMessage = '이미지 파일이 비어있습니다. 다른 파일을 선택해주세요.';
                            }
                        }
                        ToastUtils.warning(userMessage + ' 회원가입은 완료되었습니다.');
                    }
                }
            }
            
            // 프로필 이미지가 없어도 회원가입 응답의 사용자 정보를 저장
            if (signupResponse?.data) {
                const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
                // localStorage에 저장된 사용자 정보가 없거나 profileImageKey가 없으면 회원가입 응답 저장
                if (!savedUser.profileImageKey) {
                    localStorage.setItem('user', JSON.stringify(signupResponse.data));
                }
            }
            
            ToastUtils.success('회원가입이 완료되었습니다!');
            
            // 에러가 없으면 로그인 페이지로 이동
            navigateTo('/login');
            
        } catch (error) {
            // 에러 처리 (회원가입 실패 시 처리)
            let userMessage = '회원가입에 실패했습니다.';
            if (error.message) {
                if (error.message.includes('이메일')) {
                    if (error.message.includes('중복') || error.message.includes('이미 사용 중')) {
                        userMessage = '이미 사용 중인 이메일입니다.';
                    } else if (error.message.includes('형식')) {
                        userMessage = '올바른 이메일 형식을 입력해주세요.';
                    } else {
                        userMessage = '이메일을 확인해주세요.';
                    }
                } else if (error.message.includes('비밀번호')) {
                    if (error.message.includes('일치')) {
                        userMessage = '비밀번호와 비밀번호 확인이 일치하지 않습니다.';
                    } else if (error.message.includes('영문') || error.message.includes('숫자') || error.message.includes('특수문자')) {
                        userMessage = '비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상이어야 합니다.';
                    } else {
                        userMessage = '비밀번호를 확인해주세요.';
                    }
                } else if (error.message.includes('닉네임')) {
                    if (error.message.includes('중복') || error.message.includes('이미 사용 중')) {
                        userMessage = '이미 사용 중인 닉네임입니다.';
                    } else if (error.message.includes('한글') || error.message.includes('영문')) {
                        userMessage = '닉네임은 2-10자 사이로 한글, 영문, 숫자, 언더스코어(_)만 사용 가능합니다.';
                    } else {
                        userMessage = '닉네임을 확인해주세요.';
                    }
                } else if (error.message.includes('Conflict')) {
                    userMessage = '이미 사용 중인 정보입니다. 이메일 또는 닉네임을 확인해주세요.';
                } else if (error.message.includes('Bad Request')) {
                    userMessage = '입력한 정보를 확인해주세요.';
                } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                    userMessage = '네트워크 연결을 확인해주세요.';
                }
            }
            
            ToastUtils.error(userMessage);
        } finally {
            // 로딩 상태 해제
            const buttonGroup = document.getElementById('buttonGroup');
            const submitButton = buttonGroup?.querySelector('.btn-primary');
            PageLayout.hideLoading(submitButton, '회원가입');
        }
    };
});