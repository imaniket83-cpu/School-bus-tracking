// Apni Firebase Config details
const firebaseConfig = {
  apiKey: "AIzaSyAiBYBGWj1ieiKC5thPuRrnL9zmMHJXQhE",
  authDomain: "schoolbustracking-d2f2d.firebaseapp.com",
  databaseURL: "https://schoolbustracking-d2f2d-default-rtdb.firebaseio.com", // Yeh add karna zaroori hai
  projectId: "schoolbustracking-d2f2d",
  storageBucket: "schoolbustracking-d2f2d.firebasestorage.app",
  messagingSenderId: "537002829038",
  appId: "1:537002829038:web:cb55b2a25dfc2f4d4ebfff"
};

// Initialize Firebase (CDN version ke hisaab se)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- Iske niche purani app.js ki baaki logic same rahegi ---

// UI Elements
const nameDisplay = document.getElementById('student-name');
const statusText = document.getElementById('distance-status');
const boardBtn = document.getElementById('board-btn');

let studentLat = 0;
let studentLng = 0;

// Firebase se bacche ka data lana
database.ref('student/student-01').on('value', (snapshot) => {
    const data = snapshot.val();
    if(data) {
        nameDisplay.innerText = data.name;
        studentLat = data.stopLat;
        studentLng = data.stopLng;
        
        // Agar pehle se boarded hai, toh button disable kar do
        if(data.status === "Boarded") {
            boardBtn.innerText = "Already Boarded";
            boardBtn.disabled = true;
            statusText.innerText = "Attendance marked.";
        }
    }
});

// Distance Calculate karne ka formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// Driver ki location track karna aur geofencing lagana
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(function(position) {
        const driverLat = position.coords.latitude;
        const driverLng = position.coords.longitude;

        if(studentLat !== 0 && boardBtn.innerText !== "Already Boarded") {
            const distance = calculateDistance(driverLat, driverLng, studentLat, studentLng);
            statusText.innerText = distance.toFixed(0) + " meters away";

            // Geofencing: 50 meters ke andar aane par button active hoga
            if (distance <= 50) {
                boardBtn.disabled = false;
                statusText.style.color = "green";
                statusText.innerText += " (At Location)";
            } else {
                boardBtn.disabled = true;
                statusText.style.color = "red";
            }
        }
    }, function(error) {
        statusText.innerText = "Please enable GPS location.";
    }, { enableHighAccuracy: true });
} else {
    statusText.innerText = "GPS not supported on this device.";
}

// Button dabane par Firebase me status update karna
function markBoarded() {
    // Yahan path ekdum sahi hona chahiye
    database.ref('student/student-01').update({
        status: "Boarded"
    }).then(() => {
        alert("Boarded status updated securely!");
        boardBtn.innerText = "Done";
        boardBtn.disabled = true;
    }).catch((error) => {
        alert("Error updating database: " + error);
    });
}