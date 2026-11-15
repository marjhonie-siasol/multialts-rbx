#Requires -Version 5.1
<#
.SYNOPSIS
    MultiAlts RBX - Clean Complete Uninstaller
.DESCRIPTION
    Stops background daemon, removes Windows autostart registry keys,
    cleans up AppData runtime files and shortcuts, restoring default Roblox behavior.
#>

$port = 28491
$AppDir = Join-Path $env:LOCALAPPDATA 'multialts-rbx'
$PidFile = Join-Path $AppDir 'daemon.pid'

Write-Host ""
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host "             MultiAlts RBX - Complete Uninstaller         " -ForegroundColor Yellow
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host " [*] Stopping MultiAlts background engine..." -ForegroundColor Cyan

# 1. Attempt graceful shutdown via HTTP
try {
    $null = Invoke-RestMethod -Uri "http://localhost:${port}/stop" -Method Post -TimeoutSec 2 -ErrorAction SilentlyContinue
} catch { }

# 2. Terminate by stored PID if present
if (Test-Path $PidFile) {
    try {
        $pId = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($pId -and (Get-Process -Id $pId -ErrorAction SilentlyContinue)) {
            Stop-Process -Id $pId -Force -ErrorAction SilentlyContinue
        }
    } catch { }
}

# 3. Terminate any running Daemon.ps1 background processes
try {
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -match "Daemon\.ps1"
    } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
} catch { }

# 4. Remove Windows autostart entry from Registry
try {
    $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    Remove-ItemProperty -Path $runKey -Name "MultiAltsRBX" -ErrorAction SilentlyContinue
    Write-Host " [+] Windows startup entry removed." -ForegroundColor Green
} catch { }

# 5. Remove Desktop shortcut if created
$desktopPath = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktopPath "MultiAlts RBX.lnk"
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force -ErrorAction SilentlyContinue
    Write-Host " [+] Desktop shortcut removed." -ForegroundColor Green
}

# 6. Remove AppData directory
if (Test-Path $AppDir) {
    Remove-Item $AppDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host " [+] AppData files deleted ($AppDir)." -ForegroundColor Green
}

# 7. Optionally close lingering ghost crash handlers
Get-Process -Name "*RobloxCrashHandler*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host " [+] MultiAlts RBX has been completely removed." -ForegroundColor Green
Write-Host " [*] To finish, right-click the MultiAlts extension in your browser and select 'Remove from Chrome'." -ForegroundColor White
Write-Host " [*] Your system is now back to default single-instance Roblox." -ForegroundColor Gray
Write-Host ""
