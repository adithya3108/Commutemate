# MongoDB Setup Script for CommuteMate Backend
# PowerShell version - Run as Administrator

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "MongoDB CommuteMate Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if mongosh is installed
$mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $mongosh) {
    Write-Host "[ERROR] MongoDB (mongosh) is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please download and install MongoDB Community Edition from:" -ForegroundColor Yellow
    Write-Host "https://www.mongodb.com/try/download/community`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[✓] MongoDB CLI is installed" -ForegroundColor Green

# Check if MongoDB service exists and is running
Write-Host "`nChecking MongoDB service status..." -ForegroundColor Cyan
$service = Get-Service -Name MongoDB -ErrorAction SilentlyContinue

if ($null -eq $service) {
    Write-Host "[!] MongoDB service not found in Windows Services" -ForegroundColor Yellow
    Write-Host "MongoDB may still be running. Testing connection..." -ForegroundColor Yellow
} else {
    if ($service.Status -eq "Running") {
        Write-Host "[✓] MongoDB service is running" -ForegroundColor Green
    } else {
        Write-Host "[!] MongoDB service is stopped. Starting it..." -ForegroundColor Yellow
        Start-Service MongoDB
        Start-Sleep -Seconds 2
        Write-Host "[✓] MongoDB service started" -ForegroundColor Green
    }
}

# Test MongoDB connection
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "MongoDB Connection Test" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

try {
    $version = mongosh --eval "print(db.version())" --quiet 2>$null
    if ($?) {
        Write-Host "[✓] Successfully connected to MongoDB!" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "[ERROR] Could not connect to MongoDB" -ForegroundColor Red
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure MongoDB is running" -ForegroundColor Yellow
    Write-Host "2. Default connection: mongodb://localhost:27017" -ForegroundColor Yellow
    Write-Host "3. Check if port 27017 is in use" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install npm dependencies
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Installing Backend Dependencies" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

if (Test-Path "package.json") {
    npm install
    if ($?) {
        Write-Host "[✓] Dependencies installed successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "[ERROR] package.json not found" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Generate Prisma Client
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Generating Prisma Client" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

npm run prisma:generate
if ($?) {
    Write-Host "[✓] Prisma client generated successfully" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to generate Prisma client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup complete
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Green
Write-Host "1. Make sure MongoDB is running (check MongoDB Compass)" -ForegroundColor Green
Write-Host "2. Run: npm run dev" -ForegroundColor Green
Write-Host "3. Server will start on http://localhost:3000" -ForegroundColor Green
Write-Host "4. Open MongoDB Compass to view your database`n" -ForegroundColor Green

Write-Host "MongoDB Compass Connection:" -ForegroundColor Cyan
Write-Host "- Connection String: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host "- Database: commutemate`n" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
