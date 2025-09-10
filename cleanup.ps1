# Clean up build artifacts
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue dist
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules\.cache
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue node_modules\.bin
Remove-Item -Recurse -Force -ErrorAction SilentlyContinue .\build
Remove-Item -Force -ErrorAction SilentlyContinue .\yarn.lock
Remove-Item -Force -ErrorAction SilentlyContinue .\package-lock.json

Write-Host "Cleanup completed. Please run 'npm install' to reinstall dependencies."
