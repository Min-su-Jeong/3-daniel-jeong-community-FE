/* Modal 메시지 상수 */
export const MODAL_MESSAGE = Object.freeze({
    /* 제목 */
    TITLE_DELETE: '삭제',
    TITLE_LOGOUT: '로그아웃',
    TITLE_LOGIN_REQUIRED: '로그인 필요',
    TITLE_ERROR: '오류 발생',
    TITLE_SUCCESS: '등록 완료',
    TITLE_INPUT_ERROR: '입력 오류',
    TITLE_ACCOUNT_RESTORE: '계정 복구',
    
    /* 부제목/내용 */
    SUBTITLE_POST_DELETE: '게시글을 삭제하시겠습니까?<br>삭제한 내용은 복구할 수 없습니다.',
    SUBTITLE_PRODUCT_DELETE: '상품을 삭제하시겠습니까?<br>삭제한 내용은 복구할 수 없습니다.',
    SUBTITLE_COMMENT_DELETE: '댓글을 삭제하시겠습니까?',
    SUBTITLE_USER_DELETE: '정말로 회원 탈퇴를 하시겠습니까?<br>탈퇴한 계정은 30일 이내 재로그인하시면 복구할 수 있습니다.',
    SUBTITLE_LOGOUT: '로그아웃 하시겠습니까?',
    SUBTITLE_LOGIN_REQUIRED: '게시글을 작성하려면<br>로그인이 필요합니다.',
    SUBTITLE_SESSION_EXPIRED: '세션이 만료되었습니다.<br>재로그인을 진행하시겠습니까?',
    SUBTITLE_ACCOUNT_RESTORE: '복구 가능한 계정이 있습니다.<br>계정을 복구하시겠습니까?',
    CONTENT_ACCOUNT_RESTORE: `이 계정은 탈퇴 신청으로 인해 <strong>삭제 대기 상태</strong>입니다.<br><br>
                                    복구하시면 계정이 정상적으로 활성화됩니다.<br>
                                    복구하지 않으시면 30일 경과 후 모든 데이터가 영구적으로 삭제됩니다.<br><br>
                                    <strong>계정을 복구하시겠습니까?</strong>`,
    SUBTITLE_CONFIRM: '정말로 진행하시겠습니까?',
    SUBTITLE_DELETE_CONFIRM: '정말로 삭제하시겠습니까?',
    SUBTITLE_SUCCESS: '작업이 완료되었습니다.',
    SUBTITLE_UNSAVED_CHANGES: '작성 중인 내용이 있습니다.<br>정말 나가시겠습니까?',
    
    /* 회원 탈퇴 내용 */
    WITHDRAWAL_CONFIRM: `<strong>⚠️ 회원 탈퇴 시 다음 사항을 확인해주세요:</strong><hr><br>
                    • 탈퇴 신청 후 <strong>30일간 유예 기간</strong>이 제공됩니다.<br>
                    • 30일 이내 재로그인 시 <strong>계정 복구</strong>가 가능합니다.<br>
                    • 30일 경과 후에는 <strong>영구적으로 삭제</strong>되어 복구할 수 없습니다.`,
    WITHDRAWAL_RECONFIRM: `<strong>⚠️ 최종 확인이 필요합니다</strong><hr><br>
                    • 탈퇴 신청 후 <strong>30일 이내 재로그인</strong>하면 계정을 복구할 수 있습니다.<br>
                    • 30일 경과 후에는 모든 데이터가 <strong>영구적으로 삭제</strong>됩니다.`
});

