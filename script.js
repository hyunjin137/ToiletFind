let map;
let markers = [];
let userLocationMarker = null;

function initMap() {
    // 지도 초기화
    map = L.map('map').setView([37.5665, 126.978], 13); // 서울 중심 좌표

    // 지도 타일 설정 (OpenStreetMap 사용)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 마커와 코멘트 데이터 로드
    loadMarkers();

    // 지도 클릭 및 터치 이벤트 처리
    map.on('click', function(event) {
        createMarker(event.latlng);
    });
    map.on('touchstart', function(event) {
        createMarker(event.latlng);
    });

    // 지도 이동 후 마커와 코멘트 창 위치 갱신
    map.on('moveend', function() {
        updateCommentBoxes();
    });

    // "내 위치" 버튼 클릭 이벤트 처리
    document.getElementById("locationButton").addEventListener("click", showUserLocation);
}

function createMarker(latlng) {
    // 파란색 마커 생성
    const marker = L.marker(latlng, { icon: createBlueIcon() }).addTo(map);

    // 코멘트 창 생성
    const commentBox = document.createElement('div');
    commentBox.classList.add('comment-box');
    positionCommentBox(latlng, commentBox);
    commentBox.innerHTML = `
        <textarea placeholder="댓글을 작성하세요"></textarea>
        <span class="close-btn" onclick="removeMarker(${latlng.lat}, ${latlng.lng})">X</span>
    `;
    document.body.appendChild(commentBox);

    // 코멘트가 변경될 때마다 로컬 스토리지에 저장
    const textarea = commentBox.querySelector('textarea');
    textarea.addEventListener('input', function() {
        saveMarkers();
    });

    // 마커 클릭 시 해당 마커에 연결된 코멘트 창만 보이도록 처리
    marker.on('click', function() {
        markers.forEach(markerObj => {
            if (markerObj.latlng.equals(latlng)) {
                markerObj.commentBox.style.display = 'block';  // 클릭한 마커의 코멘트 창을 보이도록
            } else {
                markerObj.commentBox.style.display = 'none';  // 다른 마커의 코멘트 창은 숨김
            }
        });
    });

    // 마커와 코멘트 창을 연결
    markers.push({ latlng, marker, commentBox });

    // 로컬 스토리지에 마커와 코멘트 정보 저장
    saveMarkers();
}

function createBlueIcon() {
    return new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28]
    });
}

function positionCommentBox(latlng, commentBox) {
    const position = map.latLngToContainerPoint(latlng);
    commentBox.style.left = `${position.x + 10}px`;  // 마커 오른쪽으로 조금 간격을 둡니다.
    commentBox.style.top = `${position.y - 80}px`;  // 마커 위쪽으로 위치
}

function updateCommentBoxes() {
    // 모든 마커와 코멘트 창의 위치를 갱신
    markers.forEach(markerObj => {
        positionCommentBox(markerObj.latlng, markerObj.commentBox);
    });
}

function removeMarker(lat, lng) {
    // 해당 마커와 코멘트 창 삭제
    markers = markers.filter(markerObj => {
        if (markerObj.latlng.lat === lat && markerObj.latlng.lng === lng) {
            map.removeLayer(markerObj.marker);
            document.body.removeChild(markerObj.commentBox);
            return false;
        }
        return true;
    });

    // 로컬 스토리지에서 삭제된 마커 정보 업데이트
    saveMarkers();
}

function saveMarkers() {
    // 마커와 코멘트 정보 저장
    const data = markers.map(markerObj => ({
        latlng: markerObj.latlng,
        comment: markerObj.commentBox.querySelector('textarea').value
    }));
    localStorage.setItem('markers', JSON.stringify(data));
}

function loadMarkers() {
    // 로컬 스토리지에서 마커 정보 불러오기
    const savedMarkers = JSON.parse(localStorage.getItem('markers') || '[]');

    savedMarkers.forEach(saved => {
        const latlng = L.latLng(saved.latlng);
        const marker = L.marker(latlng, { icon: createBlueIcon() }).addTo(map);

        const commentBox = document.createElement('div');
        commentBox.classList.add('comment-box');
        positionCommentBox(latlng, commentBox);
        commentBox.innerHTML = `
            <textarea placeholder="댓글을 작성하세요">${saved.comment}</textarea>
            <span class="close-btn" onclick="removeMarker(${latlng.lat}, ${latlng.lng})">X</span>
        `;
        document.body.appendChild(commentBox);

        // 코멘트가 변경될 때마다 로컬 스토리지에 저장
        const textarea = commentBox.querySelector('textarea');
        textarea.addEventListener('input', function() {
            saveMarkers();
        });

        // 마커 클릭 시 해당 마커의 코멘트 창만 보이도록 처리
        marker.on('click', function() {
            markers.forEach(markerObj => {
                if (markerObj.latlng.equals(latlng)) {
                    markerObj.commentBox.style.display = 'block';
                } else {
                    markerObj.commentBox.style.display = 'none';
                }
            });
        });

        // 마커와 코멘트 창을 연결
        markers.push({ latlng, marker, commentBox });
    });
}

function showUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const userLatLng = L.latLng(lat, lng);

            // 기존 마커 삭제
            if (userLocationMarker) {
                map.removeLayer(userLocationMarker);  // 기존 마커 삭제 (재설정)
            }

            // 내 위치에 원 모양 마커 추가
            userLocationMarker = L.marker(userLatLng, { icon: createUserLocationIcon() }).addTo(map);
            map.setView(userLatLng, 13);  // 사용자 위치로 지도 중심 이동

        }, function(error) {
            alert("위치 정보를 가져올 수 없습니다.");
        });
    } else {
        alert("이 브라우저는 Geolocation을 지원하지 않습니다.");
    }
}

// 원 모양 마커 아이콘 생성
function createUserLocationIcon() {
    return new L.DivIcon({
        className: 'user-location-icon',
        html: '<div style="width: 30px; height: 30px; border-radius: 50%; background-color: red; border: 3px solid white;"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]  // 중심을 마커의 가운데로 설정
    });
}

initMap();
