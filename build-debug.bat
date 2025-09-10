@echo off
echo Starting build process...
node --version > build-debug.log 2>&1
npm --version >> build-debug.log 2>&1
npx electron-builder --win --debug >> build-debug.log 2>&1
echo Build process completed. Check build-debug.log for details.
