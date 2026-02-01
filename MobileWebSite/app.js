// Configuration
const API_BASE_URL = 'http://192.168.2.195:5000/api';

// State
let currentOrder = null;
let html5QrCode = null;
let selectedPhotos = [];

// DOM Elements
const scannerSection = document.getElementById('scanner-section');
const orderSection = document.getElementById('order-section');
const photoSection = document.getElementById('photo-section');
const startScannerBtn = document.getElementById('start-scanner-btn');
const skipToPhotosBtn = document.getElementById('skip-to-photos-btn');
const activateBtn = document.getElementById('activate-btn');
const newScanBtn = document.getElementById('new-scan-btn');
const cameraInput = document.getElementById('camera-input');
const galleryInput = document.getElementById('gallery-input');
const photoPreview = document.getElementById('photo-preview');
const submitBtn = document.getElementById('submit-btn');
const scannerStatus = document.getElementById('scanner-status');
const uploadStatus = document.getElementById('upload-status');

// Navigation buttons
const homeButtonOrder = document.getElementById('home-btn-order');
const homeButtonPhoto = document.getElementById('home-btn-photo');

// Manual entry elements
const manualCodeInput = document.getElementById('manual-code-input');
const manualSubmitBtn = document.getElementById('manual-submit-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    startScannerBtn.addEventListener('click', startScanner);
    skipToPhotosBtn.addEventListener('click', skipToPhotos);
    activateBtn.addEventListener('click', activateOrder);
    newScanBtn.addEventListener('click', resetToScanner);
    cameraInput.addEventListener('change', handlePhotoCapture);
    galleryInput.addEventListener('change', handleGalleryUpload);
    submitBtn.addEventListener('click', submitOrder);
    
    // Navigation listeners
    homeButtonOrder.addEventListener('click', goToScannerSection);
    homeButtonPhoto.addEventListener('click', goToScannerSection);
    
    // Manual entry listeners
    manualSubmitBtn.addEventListener('click', handleManualEntry);
    manualCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleManualEntry();
        }
    });
}

function skipToPhotos() {
    scannerSection.classList.add('hidden');
    orderSection.classList.add('hidden');
    photoSection.classList.remove('hidden');
}

// Navigation Functions
function goToScannerSection() {
    scannerSection.classList.remove('hidden');
    orderSection.classList.add('hidden');
    photoSection.classList.add('hidden');
}

function goToOrderSection() {
    scannerSection.classList.add('hidden');
    orderSection.classList.remove('hidden');
    photoSection.classList.add('hidden');
}

function goToPhotoSection() {
    scannerSection.classList.add('hidden');
    orderSection.classList.add('hidden');
    photoSection.classList.remove('hidden');
}

// Scanner Functions
async function startScanner() {
    try {
        // Check if HTTPS is required
        if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && location.protocol !== 'https:') {
            showStatus(scannerStatus, 'Camera requires HTTPS. Please use a secure connection.', 'error');
            startScannerBtn.style.display = 'block';
            return;
        }
        
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
            fps: 10, 
            qrbox: { width: 300, height: 300 },
            aspectRatio: 1.0,
            disableFlip: false,
            formatsToSupport: [
                Html5QrcodeSupportedFormats.CODE_128,
                Html5QrcodeSupportedFormats.EAN_13,
                Html5QrcodeSupportedFormats.QR_CODE
            ]
        };
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        
        startScannerBtn.style.display = 'none';
        showStatus(scannerStatus, 'Scanner active. Point camera at barcode or QR code.', 'info');
    } catch (err) {
        let errorMsg = `Error starting scanner: ${err}`;
        
        // Provide helpful error messages
        if (err.toString().includes('NotAllowedError')) {
            errorMsg = 'Camera permission denied. Please enable camera access in your browser settings.';
        } else if (err.toString().includes('NotFoundError')) {
            errorMsg = 'No camera found on this device.';
        } else if (err.toString().includes('NotSupportedError') || err.toString().includes('streaming not supported')) {
            errorMsg = 'Camera streaming not supported. Try using manual entry instead.';
        }
        
        showStatus(scannerStatus, errorMsg, 'error');
        console.error('Scanner error details:', err);
        startScannerBtn.style.display = 'block';
    }
}

async function stopScanner() {
    if (html5QrCode) {
        try {
            await html5QrCode.stop();
            html5QrCode.clear();
        } catch (err) {
            console.error('Error stopping scanner:', err);
        }
    }
}

function onScanSuccess(decodedText) {
    stopScanner();
    loadOrder(decodedText);
}

function onScanError(errorMessage) {
    // Ignore scan errors - they happen continuously
}

function handleManualEntry() {
    const code = manualCodeInput.value.trim();
    
    if (!code) {
        showStatus(scannerStatus, 'Please enter a barcode or QR code.', 'error');
        return;
    }
    
    manualCodeInput.value = '';
    if (html5QrCode) {
        stopScanner();
    }
    loadOrder(code);
}

// Order Functions
async function loadOrder(orderNumber) {
    try {
        showStatus(scannerStatus, 'Loading order...', 'info');
        console.log(`Fetching from: ${API_BASE_URL}/orders/${orderNumber}`);
        
        const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`);
        
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response error:', errorText);
            throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
        }
        
        currentOrder = await response.json();
        displayOrder(currentOrder);
        
        scannerSection.classList.add('hidden');
        orderSection.classList.remove('hidden');
        photoSection.classList.remove('hidden');
    } catch (err) {
        let errorMsg = err.message;
        
        // Provide more specific error messages
        if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
            errorMsg = `Network error: Cannot connect to ${API_BASE_URL}. Check:\n1. Backend is running\n2. URL is correct\n3. No CORS/firewall issues`;
        } else if (err.message.includes('NetworkError')) {
            errorMsg = 'Network connection failed. Check your internet and backend server.';
        }
        
        showStatus(scannerStatus, `Error: ${errorMsg}`, 'error');
        console.error('Full error:', err);
        startScannerBtn.style.display = 'block';
    }
}

function displayOrder(order) {
    const orderDetails = document.getElementById('order-details');
    const statusClass = order.isActivated ? 'status-activated' : 'status-pending';
    const statusText = order.isActivated ? 'Activated' : 'Pending';
    
    orderDetails.innerHTML = `
        <div class="order-field">
            <label>Order Number:</label>
            <div class="value">${order.orderNumber}</div>
        </div>
        <div class="order-field">
            <label>Customer Name:</label>
            <div class="value">${order.customerName}</div>
        </div>
        <div class="order-field">
            <label>Product:</label>
            <div class="value">${order.productDescription}</div>
        </div>
        <div class="order-field">
            <label>Status:</label>
            <div class="value">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>
        ${order.activatedAt ? `
        <div class="order-field">
            <label>Activated At:</label>
            <div class="value">${new Date(order.activatedAt).toLocaleString()}</div>
        </div>
        ` : ''}
    `;
    
    // Show/hide activate button based on order status
    activateBtn.style.display = order.isActivated ? 'none' : 'block';
}

async function activateOrder() {
    if (!currentOrder) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/orders/${currentOrder.orderNumber}/activate`, {
            method: 'POST'
        });
        
        if (!response.ok) {
            throw new Error(`Failed to activate order (${response.status}): ${response.statusText}`);
        }
        
        currentOrder = await response.json();
        displayOrder(currentOrder);
    } catch (err) {
        let errorMsg = err.message;
        if (err instanceof TypeError) {
            errorMsg = `Network error: Cannot reach backend at ${API_BASE_URL}`;
        }
        alert(`Error: ${errorMsg}`);
        console.error('Activation error:', err);
    }
}

// Photo Functions
function handlePhotoCapture(event) {
    const files = Array.from(event.target.files);
    addPhotosToPreview(files);
    event.target.value = ''; // Reset input
}

function handleGalleryUpload(event) {
    const files = Array.from(event.target.files);
    addPhotosToPreview(files);
    event.target.value = ''; // Reset input
}

function addPhotosToPreview(files) {
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            selectedPhotos.push(file);
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="Photo">
                    <button class="remove-btn" onclick="removePhoto(${selectedPhotos.length - 1})">×</button>
                `;
                photoPreview.appendChild(photoItem);
                
                submitBtn.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

function removePhoto(index) {
    selectedPhotos.splice(index, 1);
    updatePhotoPreview();
}

function updatePhotoPreview() {
    photoPreview.innerHTML = '';
    selectedPhotos.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const photoItem = document.createElement('div');
            photoItem.className = 'photo-item';
            photoItem.innerHTML = `
                <img src="${e.target.result}" alt="Photo">
                <button class="remove-btn" onclick="removePhoto(${index})">×</button>
            `;
            photoPreview.appendChild(photoItem);
        };
        reader.readAsDataURL(file);
    });
    
    submitBtn.style.display = selectedPhotos.length > 0 ? 'block' : 'none';
}

async function submitOrder() {
    if (selectedPhotos.length === 0) {
        showStatus(uploadStatus, 'Please select at least one photo.', 'error');
        return;
    }
    
    // Use dummy order if no order is scanned
    if (!currentOrder) {
        currentOrder = {
            orderNumber: 'ORD00000',
            customerName: 'Anonymous',
            productDescription: 'Generic Upload'
        };
    }
    
    try {
        showStatus(uploadStatus, 'Uploading photos...', 'info');
        console.log(`Uploading ${selectedPhotos.length} photo(s) to ${API_BASE_URL}/orders/${currentOrder.orderNumber}/photos`);
        
        for (const photo of selectedPhotos) {
            const formData = new FormData();
            formData.append('photo', photo);
            
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${currentOrder.orderNumber}/photos`, {
                    method: 'POST',
                    body: formData
                });
                
                console.log(`Photo upload response status: ${response.status}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed (${response.status}): ${errorText || response.statusText}`);
                }
            } catch (fetchErr) {
                console.error('Fetch error for photo upload:', fetchErr);
                throw fetchErr;
            }
        }
        
        showStatus(uploadStatus, 'All photos uploaded successfully!', 'success');
        setTimeout(() => {
            resetToScanner();
        }, 2000);
    } catch (err) {
        let errorMsg = err.message;
        if (err instanceof TypeError) {
            errorMsg = `Network error: Cannot reach backend. Check:\n1. Backend URL is correct: ${API_BASE_URL}\n2. Backend is running\n3. Network connection is active`;
        }
        showStatus(uploadStatus, `Error: ${errorMsg}`, 'error');
        console.error('Full submission error:', err);
    }
}

// Utility Functions
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

function resetToScanner() {
    currentOrder = null;
    selectedPhotos = [];
    
    scannerSection.classList.remove('hidden');
    orderSection.classList.add('hidden');
    photoSection.classList.add('hidden');
    
    photoPreview.innerHTML = '';
    submitBtn.style.display = 'none';
    startScannerBtn.style.display = 'block';
    
    scannerStatus.textContent = '';
    uploadStatus.textContent = '';
}

// Make removePhoto available globally
window.removePhoto = removePhoto;
