# KRET1

Mobile Order Scanner with ASP.NET Backend

## Overview

This project consists of two main parts:
1. **Mobile Web Site** - A responsive web application that allows users to scan order barcodes, view order details, and upload photos
2. **ASP.NET Backend** - A Web API server that handles order management and photo uploads

## Features

### Mobile Web Site
- 📷 Live barcode/QR code scanning using smartphone camera
- 📋 Display order details after scanning
- ✅ Activate orders
- 📸 Take photos using camera
- 🖼️ Upload images from gallery
- 📤 Submit photos with or without activating orders

### Backend API
- RESTful API endpoints for order management
- Order activation
- Photo upload handling
- CORS enabled for cross-origin requests
- Sample orders pre-loaded for testing

## Getting Started

### Prerequisites
- .NET 8.0 SDK or later
- A web server to serve the mobile web site (e.g., Python's http.server, Node.js http-server, or Live Server extension in VS Code)
- A smartphone or device with camera for barcode scanning

### Running the Backend

1. Navigate to the backend directory:
```bash
cd OrderBackend
```

2. Run the ASP.NET application:
```bash
dotnet run
```

The backend will start on `http://localhost:5000` by default.

### Running the Mobile Web Site

1. Navigate to the mobile web site directory:
```bash
cd MobileWebSite
```

2. Start a local web server. Choose one of the following options:

   **Option 1: Python**
   ```bash
   python3 -m http.server 8080
   ```

   **Option 2: Node.js (if http-server is installed)**
   ```bash
   npx http-server -p 8080
   ```

   **Option 3: VS Code Live Server extension**
   - Open the MobileWebSite folder in VS Code
   - Right-click on index.html and select "Open with Live Server"

3. Open your browser and navigate to `http://localhost:8080` (or the port you specified)

### Testing the Application

1. Make sure the backend is running on `http://localhost:5000`
2. Open the mobile web site on your smartphone or device
3. Click "Start Scanner" to activate the camera
4. Scan one of the pre-loaded order numbers:
   - `ORD12345` - Laptop Computer order
   - `ORD67890` - Wireless Mouse and Keyboard order
5. Upload photos (with or without activating the order)

**Note:** For barcode scanning to work, you'll need to:
- Access the site over HTTPS (or localhost)
- Grant camera permissions when prompted
- Generate a barcode/QR code for the order numbers (e.g., using an online QR code generator)

## API Endpoints

- `GET /api/orders` - Get all orders
- `GET /api/orders/{orderNumber}` - Get specific order details
- `POST /api/orders/{orderNumber}/activate` - Activate an order
- `POST /api/orders/{orderNumber}/photos` - Upload a photo (multipart/form-data)

## Project Structure

```
KRET1/
├── OrderBackend/           # ASP.NET Core Web API
│   ├── Models/            # Data models
│   ├── Services/          # Business logic
│   ├── Program.cs         # Application entry point
│   └── wwwroot/uploads/   # Photo storage (created at runtime)
└── MobileWebSite/         # Mobile web application
    ├── index.html         # Main HTML page
    ├── styles.css         # Responsive styles
    └── app.js            # Application logic
```

## Technologies Used

### Backend
- ASP.NET Core 8.0
- Minimal APIs
- In-memory data storage

### Frontend
- HTML5
- CSS3 (Responsive Design)
- JavaScript (ES6+)
- html5-qrcode library for barcode scanning

## Security Notes

This is a demonstration application with the following considerations:
- CORS is configured to allow all origins (suitable for development only)
- No authentication/authorization implemented
- In-memory storage (data is lost on restart)
- File uploads are not validated beyond basic checks

For production use, implement proper:
- Authentication and authorization
- Database storage
- File validation and size limits
- HTTPS/SSL certificates
- Restricted CORS policies