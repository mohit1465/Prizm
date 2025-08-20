@echo off
echo Building Mobile Browser APK...
echo.

REM Check if Android SDK is available
if not exist "%ANDROID_HOME%" (
    echo Android SDK not found. Please install Android Studio or Android SDK.
    echo.
    echo To install Android Studio:
    echo 1. Download from: https://developer.android.com/studio
    echo 2. Install Android Studio
    echo 3. Open Android Studio and install Android SDK
    echo 4. Set ANDROID_HOME environment variable
    echo.
    pause
    exit /b 1
)

REM Sync Capacitor project first
echo Syncing Capacitor project...
call npx cap sync android
if %ERRORLEVEL% NEQ 0 (
    echo Failed to sync Capacitor project.
    pause
    exit /b 1
)

REM Navigate to Android project directory
cd android

REM Clean and build the APK
echo Cleaning previous build...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo Failed to clean project.
    pause
    exit /b 1
)

echo Building APK with Gradle...
call gradlew assembleDebug

if %ERRORLEVEL% EQU 0 (
    echo.
    echo APK built successfully!
    echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo You can now install this APK on your Android device.
    echo.
) else (
    echo.
    echo Build failed. Please check the error messages above.
    echo.
)

pause
