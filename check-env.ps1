# Check system environment
Write-Host "=== System Information ==="
Write-Host "Computer Name: $env:COMPUTERNAME"
Write-Host "Username: $env:USERNAME"
Write-Host "OS: $([System.Environment]::OSVersion.VersionString)"
Write-Host "64-bit OS: $([Environment]::Is64BitOperatingSystem)"
Write-Host "Current Directory: $(Get-Location)"

# Check Node.js and npm versions
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "`n=== Node.js Environment ==="
    Write-Host "Node.js: $nodeVersion"
    Write-Host "npm: $npmVersion"
} catch {
    Write-Host "`n!!! Node.js or npm not found in PATH !!!" -ForegroundColor Red
}

# Check directories
Write-Host "`n=== Directory Structure ==="
Get-ChildItem -Path . -Force | Format-Table Name, LastWriteTime -AutoSize

# Write to a log file
$logContent = @"
=== Environment Check ===
Date: $(Get-Date)
Node.js: $($nodeVersion -replace 'v','')
npm: $npmVersion
OS: $([System.Environment]::OSVersion.VersionString)
Current Directory: $(Get-Location)
"@

$logContent | Out-File -FilePath ".\env-check.log" -Force
Write-Host "`nEnvironment check complete. See env-check.log for details."
