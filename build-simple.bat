@echo off
echo ========================================
echo Building Simple Windows Executable (.exe)
echo ========================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
)

echo.
echo Installing electron-packager...
call npm install --save-dev electron-packager
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install electron-packager.
    pause
    exit /b 1
)

echo.
echo Cleaning previous builds...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
)

echo.
echo Building simple Windows executable...
echo This may take a few minutes...
echo.

REM Build using electron-packager
call npm run pack:win
if %ERRORLEVEL% NEQ 0 (
    echo Failed to build executable.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Your executable is located in:
echo dist/prizm-win32-x64/
echo.
echo You can run the application from:
echo dist/prizm-win32-x64/prizm.exe
echo.
pause
