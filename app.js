const firebaseConfig = {
    apiKey: "AIzaSyAiBYBGWj1ieiKC5thPuRrnL9zmMHJXQhE",
    authDomain: "schoolbustracking-d2f2d.firebaseapp.com",
    databaseURL: "https://schoolbustracking-d2f2d-default-rtdb.firebaseio.com",
    projectId: "schoolbustracking-d2f2d",
    storageBucket: "schoolbustracking-d2f2d.firebasestorage.app",
    messagingSenderId: "537002829038",
    appId: "1:537002829038:web:cb55b2a25dfc2f4d4ebfff",
    measurementId: "G-DQCZ4N7YVN"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();

const studentList = document.getElementById('student-list');
let currentLat = null;
let currentLng = null;
let studentsData = {};

// GPS Tracking (Continuously update hogi)
if (navigator.geolocation) {
    navigator.geolocation.watchPosition((position) => {
        currentLat = position.coords.latitude;
        currentLng = position.coords.longitude;
        
        // NAYA CODE: Bus ki live location Firebase par lagataar bhejna
        database.ref('busLocation').set({
            lat: currentLat,
            lng: currentLng,
            timestamp: Date.now()
        });

        updateUI(); 
    }, (error) => {
        console.error("GPS Error", error);
    }, { enableHighAccuracy: true });
}

// Firebase se saare bacchon ka data ek sath lana
database.ref('student').on('value', (snapshot) => {
    studentsData = snapshot.val() || {};
    updateUI(); 
});

// UI Banane ka function (Sabse main part)
function updateUI() {
    if(!currentLat || Object.keys(studentsData).length === 0) return;
    
    studentList.innerHTML = ''; // Screen clear karo
    
    // Har bacche ke liye card banao
    for (let key in studentsData) {
        let student = studentsData[key];
        let stopLat = parseFloat(student.stopLat);
        let stopLng = parseFloat(student.stopLng);
        
        let distance = calculateDistance(currentLat, currentLng, stopLat, stopLng);
        distance = Math.round(distance);

        // Card UI design
        let card = document.createElement('div');
        card.className = 'card';
        if(distance <= 100 && student.status !== 'Boarded') card.className += ' active';

        let statusBadge = student.status === 'Boarded' 
            ? '<span class="badge boarded">Boarded ✅</span>' 
            : '<span class="badge pending">Pending ⏳</span>';
        
        let btnHtml = '';
        if(student.status === 'Boarded') {
            btnHtml = `<button class="btn done" disabled>Already Boarded</button>`;
        } else if(distance <= 100) { // Geofence Radius
            btnHtml = `<button class="btn ready" onclick="markBoarded('${key}')">Mark Boarded</button>`;
        } else {
            btnHtml = `<button class="btn" disabled>Too far</button>`;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="student-name">${student.name}</div>
                ${statusBadge}
            </div>
            <div class="distance-text">📍 ${student.status === 'Boarded' ? 'Picked up' : distance + ' meters away'}</div>
            ${btnHtml}
        `;
        studentList.appendChild(card);
    }
}

// Specific bacche ko boarded mark karna
window.markBoarded = function(studentId) {
    database.ref('student/' + studentId).update({
        status: "Boarded"
    });
}

// Haversine Distance Formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371e3; 
    var p1 = lat1 * Math.PI/180;
    var p2 = lat2 * Math.PI/180;
    var dp = (lat2-lat1) * Math.PI/180;
    var dl = (lon2-lon1) * Math.PI/180;
    var a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
