@echo off
REM MongoDB Setup Script for CommuteMate Backend
REM This script helps set up MongoDB locally

echo.
echo ================================
echo MongoDB CommuteMate Setup
echo ================================
echo.

REM Check if mongosh is installed
where mongosh >nul 2>nul
if errorlevel 1 (
    echo [ERROR] MongoDB (mongosh) is not installed or not in PATH
    echo Please download and install MongoDB Community Edition from:
    echo https://www.mongodb.com/try/download/community
    echo.
    pause
    exit /b 1
)

echo [✓] MongoDB is installed
echo.

REM Check if MongoDB service is running
echo Checking MongoDB service status...
sc query MongoDB >nul 2>nul
if errorlevel 1 (
    echo [!] MongoDB service not found
    echo Starting MongoDB...
    net start MongoDB
    timeout /t 2 >nul
) else (
    echo [✓] MongoDB service is running
)

echo.
echo ================================
echo MongoDB Connection Test
echo ================================
echo.

REM Test MongoDB connection
mongosh --eval "db.version()" --quiet
if errorlevel 0 (
    echo [✓] Successfully connected to MongoDB!
) else (
    echo [ERROR] Could not connect to MongoDB
    echo Make sure MongoDB is running on localhost:27017
    pause
    exit /b 1
)

echo.
echo ================================
echo Installing Backend Dependencies
echo ================================
echo.

REM Install npm dependencies
if exist package.json (
    npm install
    if errorlevel 0 (
        echo [✓] Dependencies installed successfully
    ) else (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [ERROR] package.json not found
    pause
    exit /b 1
)

echo.
echo ================================
echo Generating Prisma Client
echo ================================
echo.

npm run prisma:generate
if errorlevel 0 (
    echo [✓] Prisma client generated successfully
) else (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo ================================
echo Setup Complete!
echo ================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running (check MongoDB Compass)
echo 2. Run: npm run dev
echo 3. Server will start on http://localhost:3000
echo 4. Open MongoDB Compass to view your database
echo.
pause
