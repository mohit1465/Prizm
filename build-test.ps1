# Test script to check environment and build
Write-Host "=== Build Test Script ==="
Write-Host "Current directory: $(Get-Location)"
Write-Host "Node.js version: $(node --version)"
Write-Host "npm version: $(npm --version)"

# Try a simple build with minimal configuration
Write-Host "`n=== Starting Build ==="
$env:DEBUG = 'electron-builder'
npx electron-builder --win --x64 --debug *>&1 | Tee-Object -FilePath build-output.log

Write-Host "`nBuild completed. Check build-output.log for details."
