// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// State
let currentOrder = null;
let html5QrCode = null;
let selectedPhotos = [];

// DOM Elements
const scannerSection = document.getElementById('scanner-section');
const orderSection = document.getElementById('order-section');
const photoSection = document.getElementById('photo-section');
const startScannerBtn = document.getElementById('start-scanner-btn');
const activateBtn = document.getElementById('activate-btn');
const newScanBtn = document.getElementById('new-scan-btn');
const cameraInput = document.getElementById('camera-input');
const galleryInput = document.getElementById('gallery-input');
const photoPreview = document.getElementById('photo-preview');
const submitBtn = document.getElementById('submit-btn');
const scannerStatus = document.getElementById('scanner-status');
const uploadStatus = document.getElementById('upload-status');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

function setupEventListeners() {
    startScannerBtn.addEventListener('click', startScanner);
    activateBtn.addEventListener('click', activateOrder);
    newScanBtn.addEventListener('click', resetToScanner);
    cameraInput.addEventListener('change', handlePhotoCapture);
    galleryInput.addEventListener('change', handleGalleryUpload);
    submitBtn.addEventListener('click', submitOrder);
}

// Scanner Functions
async function startScanner() {
    try {
        html5QrCode = new Html5Qrcode("reader");
        
        const config = { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        );
        
        startScannerBtn.style.display = 'none';
        showStatus(scannerStatus, 'Scanner active. Point camera at barcode.', 'info');
    } catch (err) {
        showStatus(scannerStatus, `Error starting scanner: ${err}`, 'error');
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

// Order Functions
async function loadOrder(orderNumber) {
    try {
        showStatus(scannerStatus, 'Loading order...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/orders/${orderNumber}`);
        
        if (!response.ok) {
            throw new Error('Order not found');
        }
        
        currentOrder = await response.json();
        displayOrder(currentOrder);
        
        scannerSection.classList.add('hidden');
        orderSection.classList.remove('hidden');
        photoSection.classList.remove('hidden');
    } catch (err) {
        showStatus(scannerStatus, `Error: ${err.message}`, 'error');
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
            throw new Error('Failed to activate order');
        }
        
        currentOrder = await response.json();
        displayOrder(currentOrder);
    } catch (err) {
        alert(`Error: ${err.message}`);
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
    if (!currentOrder || selectedPhotos.length === 0) {
        showStatus(uploadStatus, 'Please select at least one photo.', 'error');
        return;
    }
    
    try {
        showStatus(uploadStatus, 'Uploading photos...', 'info');
        
        for (const photo of selectedPhotos) {
            const formData = new FormData();
            formData.append('photo', photo);
            
            const response = await fetch(`${API_BASE_URL}/orders/${currentOrder.orderNumber}/photos`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }
        }
        
        showStatus(uploadStatus, 'All photos uploaded successfully!', 'success');
        setTimeout(() => {
            resetToScanner();
        }, 2000);
    } catch (err) {
        showStatus(uploadStatus, `Error: ${err.message}`, 'error');
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
