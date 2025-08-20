@echo off
echo Cleaning up previous build...
if exist "dist" rmdir /s /q dist
if exist "node_modules\dist" rmdir /s /q "node_modules\dist"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo Installing dependencies...
npm install

echo Building application...
call npm run build:exe

if exist "dist\win-unpacked\Prizm.exe" (
    echo Build successful! The application is in the dist\win-unpacked folder.
    echo The executable should now show the Prizm icon.
) else (
    echo Build failed. Please check the error messages above.
)

pause
