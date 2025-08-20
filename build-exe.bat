@echo off
echo ========================================
echo Building Windows Executable (.exe)
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
echo Cleaning previous builds...
if exist "dist" (
    rmdir /s /q "dist" 2>nul
    if exist "dist" (
        echo Warning: Could not remove dist folder completely.
        echo Please close any applications that might be using files in the dist folder.
        echo.
    )
)

echo.
echo Building Windows executable...
echo This may take a few minutes...
echo.

REM Build the executable
call npm run build:exe
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed. Trying alternative method...
    echo.
    call npm run build:portable
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to build executable.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Your executable files are located in:
echo - dist/win-unpacked/ (Portable version)
echo - dist/ (Installer .exe)
echo.
echo You can run the portable version directly from:
echo dist/win-unpacked/prizm.exe
echo.
pause
