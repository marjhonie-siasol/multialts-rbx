#Requires -Version 5.1
<#
.SYNOPSIS
    MultiAlts RBX - Installer & Service Launcher
.DESCRIPTION
    Installs MultiAlts background engine components into LocalAppData,
    configures Windows auto-start on boot, and starts the daemon listener.
#>

$port = 28491
$AppDir = Join-Path $env:LOCALAPPDATA 'multialts-rbx'
$AppSrcDir = Join-Path $AppDir 'src'
$PidFile = Join-Path $AppDir 'daemon.pid'
$LogFile = Join-Path $AppDir 'daemon.log'
$DaemonScript = Join-Path $AppSrcDir 'Daemon.ps1'
$EnginePath = Join-Path $AppSrcDir 'MultiAltsEngine.cs'

Write-Host ""
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host "             MultiAlts RBX - Installer & Service          " -ForegroundColor Yellow
Write-Host "  ========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if already running
$existingPid = $null
if (Test-Path $PidFile) {
    try {
        $p = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($p -and (Get-Process -Id $p -ErrorAction SilentlyContinue)) {
            $existingPid = $p
        }
    } catch { }
}

if ($existingPid) {
    Write-Host " [!] MultiAlts background engine is already running (PID: $existingPid)." -ForegroundColor Yellow
    Write-Host " [*] Active endpoint: http://localhost:${port}/" -ForegroundColor Gray
    Write-Host " [*] You are ready to launch multiple accounts." -ForegroundColor White
    Write-Host ""
    return
}

# Ensure AppData directory exists
if (-not (Test-Path $AppSrcDir)) {
    New-Item -ItemType Directory -Path $AppSrcDir -Force | Out-Null
}

# Check for local files in current folder or parent
$localSrc = $null
if (Test-Path ".\src\Daemon.ps1") {
    $localSrc = ".\src"
} elseif (Test-Path "$PSScriptRoot\src\Daemon.ps1") {
    $localSrc = "$PSScriptRoot\src"
}

if ($localSrc) {
    Copy-Item -Path "$localSrc\*" -Destination $AppSrcDir -Force -Recurse
    if (Test-Path ".\config.json") { Copy-Item -Path ".\config.json" -Destination $AppDir -Force }
    if (Test-Path ".\multialts.ps1") { Copy-Item -Path ".\multialts.ps1" -Destination $AppDir -Force }
} else {
    Write-Host " [*] Downloading MultiAlts engine components..." -ForegroundColor Cyan
    $rawBase = "https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main"
    try {
        Invoke-WebRequest -Uri "$rawBase/src/Daemon.ps1" -OutFile $DaemonScript -UseBasicParsing -TimeoutSec 15
        Invoke-WebRequest -Uri "$rawBase/src/MultiAltsEngine.cs" -OutFile $EnginePath -UseBasicParsing -TimeoutSec 15
        if (-not (Test-Path (Join-Path $AppDir 'config.json'))) {
            Invoke-WebRequest -Uri "$rawBase/config.json" -OutFile (Join-Path $AppDir 'config.json') -UseBasicParsing -ErrorAction SilentlyContinue
        }
        if (-not (Test-Path (Join-Path $AppDir 'multialts.ps1'))) {
            Invoke-WebRequest -Uri "$rawBase/multialts.ps1" -OutFile (Join-Path $AppDir 'multialts.ps1') -UseBasicParsing -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host " [-] Download failed: $($_.Exception.Message)" -ForegroundColor Red
        return
    }
}

Write-Host " [*] Registering Windows auto-start on login..." -ForegroundColor Cyan
try {
    $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
    $autostartCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$DaemonScript`""
    Set-ItemProperty -Path $runKey -Name "MultiAltsRBX" -Value $autostartCmd -Force -ErrorAction SilentlyContinue
} catch { }

Write-Host " [*] Starting MultiAlts background daemon..." -ForegroundColor Cyan

# Launch detached hidden background process natively
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "powershell.exe"
$psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$DaemonScript`""
$psi.WorkingDirectory = $AppDir
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$psi.CreateNoWindow = [bool]$true
$psi.UseShellExecute = [bool]$true
[System.Diagnostics.Process]::Start($psi) | Out-Null

# Wait briefly for startup
Start-Sleep -Milliseconds 1200

# Verify startup
$running = $null
if (Test-Path $PidFile) {
    try {
        $p = Get-Content $PidFile -ErrorAction SilentlyContinue
        if ($p) { $running = Get-Process -Id $p -ErrorAction SilentlyContinue }
    } catch { }
}

if ($running) {
    Write-Host " [+] Daemon successfully started! (PID: $($running.Id))" -ForegroundColor Green
    Write-Host " [*] Active endpoint: http://localhost:${port}/" -ForegroundColor Gray
    Write-Host " [*] MultiAlts is now active and will automatically start with Windows." -ForegroundColor White
    Write-Host " [*] You can now use the Chrome extension to switch accounts and play." -ForegroundColor White
} else {
    Write-Host " [!] Daemon launched. Verify status in extension or run .\multialts.ps1 status." -ForegroundColor Yellow
}
Write-Host ""
