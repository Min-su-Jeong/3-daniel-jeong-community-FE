import { PageLayout } from '../../components/layout/page-layout.js';
import { Toast } from '../../components/toast/toast.js';

/**
 * 수영장 위치 찾기 - Kakao Maps API
 */
class PoolFinder {
    constructor() {
        this.center = { lat: 37.3943, lng: 127.1110 };
        this.map = null;
        this.places = null;
        this.markers = [];
        this.myLocationMarker = null;
    }

    async init() {
        PageLayout.init();
        
        // 환경 변수에서 Kakao Map API 키 가져오기
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            const apiKey = config.KAKAO_MAP_JAVASCRIPT_KEY;
            
            if (!apiKey) {
                Toast.error('Kakao Map API 키가 설정되지 않았습니다.', '지도 서비스 오류');
                this.showErrorMessage('지도 서비스를 사용할 수 없습니다.');
                return;
            }
            
            // Kakao Map SDK 로드
            await this.loadKakaoMapSDK(apiKey);
            
            // SDK 로드 후 초기화
            if (!kakao?.maps) {
                Toast.error('지도를 불러올 수 없습니다.', '지도 서비스 오류');
                this.showErrorMessage('지도를 불러올 수 없습니다.');
                return;
            }

            kakao.maps.load(() => {
                this.createMap();
                this.bindEvents();
                this.searchNearbyPools();
            });
        } catch (error) {
            Toast.error('지도 서비스를 불러올 수 없습니다.', '오류 발생');
            this.showErrorMessage('지도 서비스를 불러올 수 없습니다.');
        }
    }

    loadKakaoMapSDK(apiKey) {
        return new Promise((resolve, reject) => {
            // 이미 로드되어 있으면 바로 resolve
            if (window.kakao && window.kakao.maps) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
            script.async = true;
            
            script.onload = () => {
                // SDK가 완전히 로드되었는지 확인
                if (window.kakao && window.kakao.maps) {
                    resolve();
                } else {
                    // SDK 로드는 되었지만 maps 객체가 아직 준비되지 않은 경우
                    setTimeout(() => {
                        if (window.kakao && window.kakao.maps) {
                            resolve();
                        } else {
                            reject(new Error('Kakao Map SDK 초기화 실패'));
                        }
                    }, 100);
                }
            };
            
            script.onerror = () => reject(new Error('Kakao Map SDK 로드 실패'));
            document.head.appendChild(script);
        });
    }

    createMap() {
        const container = document.getElementById('map');
        const options = {
            center: new kakao.maps.LatLng(this.center.lat, this.center.lng),
            level: 5
        };
        
        this.map = new kakao.maps.Map(container, options);
        this.places = new kakao.maps.services.Places();
    }

    // 수영장 검색 (현재 지도 중심 기준)
    searchNearbyPools() {
        if (!this.places || !this.map) return;

        const center = this.map.getCenter();
        const radius = this.calculateMapRadius();
        const options = {
            location: center,
            radius: radius,
            sort: kakao.maps.services.SortBy.DISTANCE
        };

        this.places.keywordSearch('수영장', (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const poolLocations = this.filterPoolLocations(data);
                this.displayResults(poolLocations);
            } else {
                this.clearResults();
            }
        }, options);
    }

    // 현재 지도의 반경 계산
    calculateMapRadius() {
        const bounds = this.map.getBounds();
        const center = this.map.getCenter();
        const ne = bounds.getNorthEast(); // 북동쪽 모서리
        
        // 중심에서 모서리까지의 거리 계산 (미터 단위)
        const polyline = new kakao.maps.Polyline({
            path: [center, ne]
        });
        const distance = polyline.getLength();
        
        // API 최대 반경은 20km, 최소 100m
        return Math.min(Math.max(distance, 100), 20000);
    }

    // 키워드로 수영장 검색
    searchByKeyword(keyword) {
        if (!this.places || !keyword.trim()) return;

        const searchQuery = (keyword.includes('수영') || keyword.includes('풀')) 
            ? keyword 
            : `${keyword} 수영장`;

        this.places.keywordSearch(searchQuery, (data, status) => {
            if (status === kakao.maps.services.Status.OK) {
                const poolLocations = this.filterPoolLocations(data);
                
                if (poolLocations.length > 0) {
                    this.displayResults(poolLocations);
                    this.moveMapToFirstResult(poolLocations[0]);
                } else {
                    Toast.info('검색 결과가 없습니다.', '검색');
                    this.clearResults();
                }
            } else {
                Toast.info('검색 결과가 없습니다.', '검색');
                this.clearResults();
            }
        }, { size: 15 });
    }

    // 호텔 필터링
    filterPoolLocations(data) {
        return data.filter(place => {
            const name = place.place_name || '';
            const category = place.category_name || '';
            return !name.includes('호텔') && !category.includes('호텔');
        });
    }

    // 검색 결과 표시
    displayResults(places) {
        this.clearMarkers();
        
        if (places.length === 0) {
            this.clearResults();
            return;
        }

        this.createMarkers(places);
        this.displayList(places);
    }

    // 마커 생성
    createMarkers(places) {
        places.forEach(place => {
            const position = new kakao.maps.LatLng(place.y, place.x);
            const marker = new kakao.maps.Marker({ position, map: this.map });
            const infowindow = new kakao.maps.InfoWindow({
                content: this.createInfoWindowContent(place)
            });

            kakao.maps.event.addListener(marker, 'click', () => {
                this.closeAllInfowindows();
                infowindow.open(this.map, marker);
                this.map.setCenter(position);
            });

            this.markers.push({ marker, infowindow, place });
        });
    }

    // 인포윈도우 HTML 생성
    createInfoWindowContent(place) {
        const container = document.createElement('div');
        container.className = 'info-window-container';
        
        const name = document.createElement('div');
        name.className = 'info-window-name';
        name.textContent = place.place_name;
        
        const address = document.createElement('div');
        address.className = 'info-window-address';
        address.textContent = place.address_name || place.road_address_name;
        
        container.appendChild(name);
        container.appendChild(address);
        
        if (place.phone) {
            const phone = document.createElement('div');
            phone.className = 'info-window-phone';
            phone.textContent = place.phone;
            container.appendChild(phone);
        }
        
        return container;
    }


    // 목록 표시
    displayList(places) {
        const list = document.getElementById('poolsList');
        list.textContent = ''; // 기존 내용 제거
        
        places.forEach(place => {
            const item = this.createListItem(place);
            list.appendChild(item);
        });
    }

    // 목록 아이템 생성
    createListItem(place) {
        const item = document.createElement('div');
        item.className = 'pool-item';
        item.dataset.id = place.id;
        
        // 헤더
        const header = document.createElement('div');
        header.className = 'pool-item-header';
        
        const name = document.createElement('h4');
        name.className = 'pool-name';
        name.textContent = place.place_name;
        header.appendChild(name);
        
        const distance = this.formatDistance(place.distance);
        if (distance) {
            const distanceSpan = document.createElement('span');
            distanceSpan.className = 'pool-distance';
            distanceSpan.textContent = distance;
            header.appendChild(distanceSpan);
        }
        
        // 바디
        const body = document.createElement('div');
        body.className = 'pool-item-body';
        
        const address = document.createElement('p');
        address.className = 'pool-address';
        address.textContent = place.address_name || place.road_address_name;
        body.appendChild(address);
        
        if (place.phone) {
            const info = document.createElement('div');
            info.className = 'pool-info';
            const phone = document.createElement('span');
            phone.className = 'pool-phone';
            phone.textContent = place.phone;
            info.appendChild(phone);
            body.appendChild(info);
        }
        
        item.appendChild(header);
        item.appendChild(body);
        
        return item;
    }

    // 거리 포맷팅
    formatDistance(distance) {
        if (!distance) return '';
        const dist = parseInt(distance);
        return dist < 1000 ? `${dist}m` : `${(dist / 1000).toFixed(1)}km`;
    }

    // 내 위치로 이동
    moveToMyLocation() {
        const btn = document.getElementById('currentLocationBtn');
        const originalChildren = Array.from(btn.childNodes);
        btn.disabled = true;
        
        // 기존 내용 제거하고 로딩 텍스트만 표시
        btn.textContent = '';
        const loadingSpan = document.createElement('span');
        loadingSpan.textContent = '위치 찾는 중...';
        btn.appendChild(loadingSpan);

        if (!navigator.geolocation) {
            this.showAlert('위치 정보를 사용할 수 없습니다.', btn, originalChildren);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.updateLocation(position.coords.latitude, position.coords.longitude);
                this.showMyLocationMarker();
                this.searchNearbyPools();
                this.restoreLocationButton(btn, originalChildren);
            },
            () => {
                this.showAlert('위치 정보를 가져올 수 없습니다.', btn, originalChildren);
            }
        );
    }

    // 위치 업데이트
    updateLocation(lat, lng) {
        this.center = { lat, lng };
        this.map.setCenter(new kakao.maps.LatLng(lat, lng));
    }

    // 내 위치 마커 표시
    showMyLocationMarker() {
        // 기존 마커 제거
        if (this.myLocationMarker) {
            this.myLocationMarker.setMap(null);
        }

        const content = document.createElement('div');
        content.className = 'my-location-marker';

        this.myLocationMarker = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(this.center.lat, this.center.lng),
            content: content,
            map: this.map
        });
    }

    // 첫 번째 결과로 지도 이동
    moveMapToFirstResult(place) {
        this.map.setCenter(new kakao.maps.LatLng(place.y, place.x));
        this.map.setLevel(5);
    }

    // 알림 표시
    showAlert(message, btn, originalChildren) {
        Toast.error(message, '위치 서비스');
        this.restoreLocationButton(btn, originalChildren);
    }
    
    // 위치 버튼 복원
    restoreLocationButton(btn, originalChildren) {
        btn.disabled = false;
        btn.textContent = '';
        
        // 원래 자식 요소들 복원
        originalChildren.forEach(child => {
            btn.appendChild(child.cloneNode(true));
        });
    }
    
    // 에러 메시지 화면 표시
    showErrorMessage(message) {
        const list = document.getElementById('poolsList');
        if (list) {
            list.textContent = '';
            
            const container = document.createElement('div');
            container.className = 'error-message-container';
            
            const mainMessage = document.createElement('p');
            mainMessage.className = 'error-message-main';
            mainMessage.textContent = message;
            
            const subMessage = document.createElement('p');
            subMessage.className = 'error-message-sub';
            subMessage.textContent = '잠시 후 다시 시도해주세요.';
            
            container.appendChild(mainMessage);
            container.appendChild(subMessage);
            list.appendChild(container);
        }
    }

    // 이벤트 바인딩
    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const locationBtn = document.getElementById('currentLocationBtn');
        const poolsList = document.getElementById('poolsList');

        // 검색 버튼 텍스트 동적 변경
        searchInput?.addEventListener('input', (e) => {
            searchBtn.textContent = e.target.value.trim() ? '검색' : '주변 검색';
        });

        searchBtn?.addEventListener('click', () => this.handleSearch(searchInput.value));
        searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch(e.target.value);
        });
        locationBtn?.addEventListener('click', () => this.moveToMyLocation());
        poolsList?.addEventListener('click', (e) => this.handleListItemClick(e));
    }

    // 검색 핸들러
    handleSearch(keyword) {
        keyword.trim() ? this.searchByKeyword(keyword) : this.searchNearbyPools();
    }

    // 목록 아이템 클릭 핸들러
    handleListItemClick(e) {
        const item = e.target.closest('.pool-item');
        if (!item) return;

        const markerData = this.markers.find(m => m.place.id === item.dataset.id);
        if (markerData) {
            const { marker, infowindow, place } = markerData;
            this.closeAllInfowindows();
            infowindow.open(this.map, marker);
            this.map.setCenter(new kakao.maps.LatLng(place.y, place.x));
            this.map.setLevel(3);
        }
    }

    // 마커 제거
    clearMarkers() {
        this.markers.forEach(({ marker, infowindow }) => {
            infowindow.close();
            marker.setMap(null);
        });
        this.markers = [];
    }

    // 인포윈도우 닫기
    closeAllInfowindows() {
        this.markers.forEach(({ infowindow }) => infowindow.close());
    }

    // 결과 초기화
    clearResults() {
        this.clearMarkers();
        const list = document.getElementById('poolsList');
        list.textContent = '';
        
        const message = document.createElement('p');
        message.className = 'no-results-message';
        message.textContent = '검색 결과가 없습니다.';
        list.appendChild(message);
    }
}

// 실행
const poolFinder = new PoolFinder();
document.addEventListener('DOMContentLoaded', () => poolFinder.init());


