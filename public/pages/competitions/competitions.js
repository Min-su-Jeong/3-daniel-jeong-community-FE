// 대회일정 페이지 메인 로직
import { PageLayout } from '../../components/layout/page-layout.js';
import { getCompetitions } from '../../utils/api/competitions.js';
import { S3_CONFIG } from '../../utils/constants/image.js';

// 월 이름 배열 (인덱스 0은 빈 값, 1-12는 각 월)
const MONTH_NAMES = ['', '1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

// 대회 타입 매핑 (마스터즈, 공식 대회, 지역 대회)
const TYPE_MAP = {
    'MASTERS': { label: '마스터즈', class: 'badge-masters' },
    'OFFICIAL': { label: '공식 대회', class: 'badge-official' },
    'REGIONAL': { label: '지역 대회', class: 'badge-regional' }
};

// 대회 상태 매핑 (예정, 진행중, 종료)
const STATUS_MAP = {
    'UPCOMING': { label: '예정', class: 'status-upcoming' },
    'ONGOING': { label: '진행중', class: 'status-ongoing' },
    'COMPLETED': { label: '종료', class: 'status-completed' }
};

// 아이콘 매핑 (위치, 날짜, 시간 아이콘)
const ICON_MAP = {
    'location': { src: S3_CONFIG.getImageUrl('misc/location.svg'), alt: '위치' },
    'calendar': { src: S3_CONFIG.getImageUrl('misc/calendar.svg'), alt: '날짜' },
    'clock': { src: S3_CONFIG.getImageUrl('misc/clock.svg'), alt: '시간' }
};

// 대회 데이터 저장 변수
let competitionsData = [];

// 필터 값 가져오기 (년도, 월, 타입)
function getFilterValues() {
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    return {
        year: yearFilter?.value ? parseInt(yearFilter.value) : null,
        month: monthFilter?.value && monthFilter.value !== 'all' ? parseInt(monthFilter.value) : null,
        type: typeFilter?.value || 'all'
    };
}

// 대회 데이터 로드 및 렌더링
async function loadCompetitions() {
    try {
        const { year, month, type } = getFilterValues();
        const response = await getCompetitions({ year, month, type });
        
        if (response.success && response.data) {
            competitionsData = response.data.items || [];
            renderCompetitions();
        }
    } catch (error) {
        console.error('Error loading competitions:', error);
    }
}

// 대회 목록을 년도와 월로 그룹화
function groupByYearAndMonth(competitions) {
    const grouped = {};
    
    competitions.forEach(comp => {
        const [year, month] = comp.eventDate.split('-').map(Number);
        const key = `${year}-${month}`;
        
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(comp);
    });
    
    return grouped;
}

// 상세 정보 아이템 생성 (아이콘 + 텍스트)
function createDetailItem(icon, text) {
    const item = document.createElement('div');
    item.className = 'detail-item';
    
    const iconInfo = ICON_MAP[icon];
    if (iconInfo) {
        const img = document.createElement('img');
        img.src = iconInfo.src;
        img.alt = iconInfo.alt;
        img.style.width = '18px';
        img.style.height = '18px';
        img.style.objectFit = 'contain';
        item.appendChild(img);
    }
    
    const span = document.createElement('span');
    span.textContent = text;
    item.appendChild(span);
    
    return item;
}

// 대회 시간 정보 계산 (기간 또는 시간대)
function calculateTimeInfo(comp) {
    const [year, monthNum, day] = comp.eventDate.split('-').map(Number);
    
    // 종료일이 있으면 기간 표시
    if (comp.endDate) {
        const [endYear, endMonthNum, endDay] = comp.endDate.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, day);
        const endDate = new Date(endYear, endMonthNum - 1, endDay);
        const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        return {
            text: `${monthNum}월 ${day}일 ~ ${endMonthNum}월 ${endDay}일 (${daysDiff}일간)`,
            icon: 'calendar'
        };
    }
    
    // 시작/종료 시간이 있으면 시간대 표시
    if (comp.startTime && comp.endTime) {
        const startTime = comp.startTime.substring(0, 5);
        const endTime = comp.endTime.substring(0, 5);
        return {
            text: `${startTime} ~ ${endTime}`,
            icon: 'clock'
        };
    }
    
    return { text: '', icon: 'clock' };
}

// 대회 카드 DOM 요소 생성
function createCompetitionCard(comp) {
    const [, monthNum, day] = comp.eventDate.split('-').map(Number);
    const month = MONTH_NAMES[monthNum];
    const typeInfo = TYPE_MAP[comp.type] || { label: comp.type, class: '' };
    const statusInfo = STATUS_MAP[comp.status] || { label: comp.status, class: '' };
    const timeInfo = calculateTimeInfo(comp);
    
    const card = document.createElement('div');
    card.className = 'competition-card lg-glass lg-card-hover';
    card.dataset.type = comp.type.toLowerCase();
    
    // 날짜 표시 영역 (일, 월)
    const dateDiv = document.createElement('div');
    dateDiv.className = 'competition-date';
    
    const daySpan = document.createElement('span');
    daySpan.className = 'date-day';
    daySpan.textContent = day;
    dateDiv.appendChild(daySpan);
    
    const monthSpan = document.createElement('span');
    monthSpan.className = 'date-month';
    monthSpan.textContent = month;
    dateDiv.appendChild(monthSpan);
    
    card.appendChild(dateDiv);
    
    // 정보 표시 영역 (배지, 이름, 상세정보)
    const infoDiv = document.createElement('div');
    infoDiv.className = 'competition-info';
    
    const badgeDiv = document.createElement('div');
    badgeDiv.className = 'competition-badge';
    
    const badge = document.createElement('span');
    badge.className = `badge ${typeInfo.class}`;
    badge.textContent = typeInfo.label;
    badgeDiv.appendChild(badge);
    infoDiv.appendChild(badgeDiv);
    
    const name = document.createElement('h3');
    name.className = 'competition-name';
    name.textContent = comp.name;
    infoDiv.appendChild(name);
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'competition-details';
    
    const locationItem = createDetailItem('location', comp.location);
    detailsDiv.appendChild(locationItem);
    
    if (timeInfo.text) {
        const timeItem = createDetailItem(timeInfo.icon, timeInfo.text);
        detailsDiv.appendChild(timeItem);
    }
    
    infoDiv.appendChild(detailsDiv);
    card.appendChild(infoDiv);
    
    // 액션 영역 (상태 배지)
    const actionDiv = document.createElement('div');
    actionDiv.className = 'competition-action';
    
    const statusBadge = document.createElement('span');
    statusBadge.className = `status-badge ${statusInfo.class}`;
    statusBadge.textContent = statusInfo.label;
    actionDiv.appendChild(statusBadge);
    
    card.appendChild(actionDiv);
    
    return card;
}

// 월별 그룹 DOM 요소 생성 (년도-월 헤더 + 대회 목록)
function createMonthGroup(year, month, competitions) {
    const monthGroup = document.createElement('div');
    monthGroup.className = 'month-group';
    monthGroup.dataset.year = year;
    monthGroup.dataset.month = month;
    
    // 월 헤더 (년도-월, 대회 개수)
    const header = document.createElement('div');
    header.className = 'month-header';
    
    const title = document.createElement('h2');
    title.className = 'month-title';
    title.textContent = `${year}년 ${MONTH_NAMES[month]}`;
    header.appendChild(title);
    
    const count = document.createElement('span');
    count.className = 'month-count';
    count.textContent = `${competitions.length}개 대회`;
    header.appendChild(count);
    
    monthGroup.appendChild(header);
    
    // 대회 목록
    const list = document.createElement('div');
    list.className = 'competitions-list';
    
    competitions.forEach(comp => {
        const card = createCompetitionCard(comp);
        list.appendChild(card);
    });
    
    monthGroup.appendChild(list);
    
    return monthGroup;
}

// 대회 목록 렌더링 (년도-월별로 그룹화하여 표시)
function renderCompetitions() {
    const container = document.querySelector('.competitions-container');
    if (!container) return;
    
    const grouped = groupByYearAndMonth(competitionsData);
    const fragment = document.createDocumentFragment();
    
    // 년도-월 순으로 정렬하여 렌더링
    Object.keys(grouped).sort().forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const competitions = grouped[key];
        const monthGroup = createMonthGroup(year, month, competitions);
        fragment.appendChild(monthGroup);
    });
    
    container.replaceChildren(fragment);
}

// 필터 이벤트 리스너 초기화
function initFilters() {
    const yearFilter = document.getElementById('yearFilter');
    const monthFilter = document.getElementById('monthFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    yearFilter?.addEventListener('change', loadCompetitions);
    monthFilter?.addEventListener('change', loadCompetitions);
    typeFilter?.addEventListener('change', loadCompetitions);
}

// 페이지 초기화
async function init() {
    PageLayout.init();
    await loadCompetitions();
    initFilters();
}

document.addEventListener('DOMContentLoaded', init);
