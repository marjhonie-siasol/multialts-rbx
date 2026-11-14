#Requires -Version 5.1
<#
.SYNOPSIS
    MultiAlts RBX - Unified Controller & CLI
.DESCRIPTION
    Next-generation, lightweight manager to run multiple Roblox instances
    simultaneously without emulators.
.EXAMPLE
    .\multialts.ps1 start
    .\multialts.ps1 status
    .\multialts.ps1 stop
    .\multialts.ps1 unlock
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('start', 'stop', 'restart', 'status', 'unlock', 'watch', 'clean', 'kill-all', 'install', 'uninstall', 'help')]
    [string]$Command = 'status'
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DaemonScript = Join-Path $RootDir 'src\Daemon.ps1'
$EnginePath = Join-Path $RootDir 'src\MultiAltsEngine.cs'
$ConfigPath = Join-Path $RootDir 'config.json'
$AppDir = Join-Path $env:LOCALAPPDATA 'multialts-rbx'
$PidFile = Join-Path $AppDir 'daemon.pid'
$LogFile = Join-Path $AppDir 'daemon.log'

$port = 28491
if (Test-Path $ConfigPath) {
    try {
        $cfg = Get-Content -Raw $ConfigPath | ConvertFrom-Json
        if ($cfg.daemon.port) { $port = [int]$cfg.daemon.port }
    } catch {}
}

function Ensure-EngineLoaded {
    if (-not ('MultiAlts.Core.MultiAltsEngine' -as [type])) {
        if (Test-Path $EnginePath) {
            Add-Type -TypeDefinition (Get-Content -Raw -Path $EnginePath) -Language CSharp -ErrorAction Stop
        }
        else {
            Write-Error "MultiAltsEngine.cs not found at $EnginePath"
            exit 1
        }
    }
}

function Get-RunningDaemonProcess {
    if (Test-Path $PidFile) {
        $daemonPid = [int](Get-Content -Raw $PidFile -ErrorAction SilentlyContinue)
        if ($daemonPid -gt 0) {
            $proc = Get-Process -Id $daemonPid -ErrorAction SilentlyContinue
            if ($proc) { return $proc }
        }
    }
    return $null
}

function Show-Header {
    Write-Host ""
    Write-Host "  ========================================================" -ForegroundColor Cyan
    Write-Host "             MultiAlts RBX - Multi-Instance Manager       " -ForegroundColor Yellow
    Write-Host "  ========================================================" -ForegroundColor Cyan
    Write-Host ""
}

switch ($Command.ToLower()) {

    'start' {
        Show-Header
        $existing = Get-RunningDaemonProcess
        if ($existing) {
            Write-Host " [!] Daemon is already active (PID: $($existing.Id))." -ForegroundColor Yellow
            return
        }

        Write-Host " [*] Starting MultiAlts background daemon..." -ForegroundColor Cyan

        # Launch detached hidden background process natively
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$DaemonScript`""
        $psi.WorkingDirectory = $RootDir
        $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $psi.CreateNoWindow = $true
        $psi.UseShellExecute = $true
        [System.Diagnostics.Process]::Start($psi) | Out-Null

        # Wait briefly for startup
        Start-Sleep -Milliseconds 1200
        $running = Get-RunningDaemonProcess
        if ($running) {
            Write-Host " [+] Daemon successfully started! (PID: $($running.Id))" -ForegroundColor Green
            Write-Host " [*] Active endpoint: http://localhost:${port}/" -ForegroundColor Gray
            Write-Host " [*] You can now launch accounts from separate browser profiles." -ForegroundColor White
        }
        else {
            Write-Host " [-] Failed to verify daemon startup. Check log at: $LogFile" -ForegroundColor Red
        }
    }

    'stop' {
        Show-Header
        Write-Host " [*] Stopping MultiAlts background daemon..." -ForegroundColor Cyan
        
        # Try graceful HTTP shutdown first
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:${port}/stop" -Method Post -TimeoutSec 2 -ErrorAction SilentlyContinue
        }
        catch { }

        $running = Get-RunningDaemonProcess
        if ($running) {
            Stop-Process -Id $running.Id -Force -ErrorAction SilentlyContinue
        }

        if (Test-Path $PidFile) {
            Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        }

        Write-Host " [+] Daemon has been stopped." -ForegroundColor Green
    }

    'restart' {
        & $MyInvocation.MyCommand.Path stop
        Start-Sleep -Milliseconds 800
        & $MyInvocation.MyCommand.Path start
    }

    'status' {
        Show-Header
        Ensure-EngineLoaded

        $daemon = Get-RunningDaemonProcess
        if ($daemon) {
            Write-Host "  Service Status: " -NoNewline
            Write-Host "ACTIVE (PID: $($daemon.Id))" -ForegroundColor Green
            Write-Host "  API Endpoint:   http://localhost:${port}/" -ForegroundColor Gray
            Write-Host "  Log File:       $LogFile" -ForegroundColor Gray
        }
        else {
            Write-Host "  Service Status: " -NoNewline
            Write-Host "STOPPED" -ForegroundColor Red
            Write-Host "  (Run '.\multialts.ps1 start' to begin background protection)" -ForegroundColor DarkGray
        }

        Write-Host ""
        Write-Host "  --------------------------------------------------------" -ForegroundColor DarkCyan
        Write-Host "  Active Roblox Instances Detected:" -ForegroundColor White
        Write-Host "  --------------------------------------------------------" -ForegroundColor DarkCyan

        $instances = [MultiAlts.Core.MultiAltsEngine]::GetActiveInstancesSummary()
        if (-not $instances -or $instances.Count -eq 0) {
            Write-Host "  No active Roblox windows currently running." -ForegroundColor DarkGray
        }
        else {
            $totalRAM = 0
            foreach ($inst in $instances) {
                $totalRAM += $inst.WorkingSetMB
                Write-Host "  [PID $($inst.ProcessId)]" -ForegroundColor Yellow -NoNewline
                Write-Host " - RAM: " -NoNewline
                Write-Host "$($inst.WorkingSetMB) MB" -ForegroundColor Cyan -NoNewline
                Write-Host " | Started: $($inst.StartTime) | State: " -NoNewline
                Write-Host "Unlocked" -ForegroundColor Green
            }
            Write-Host ""
            Write-Host "  Total Running Accounts: $($instances.Count) | Total RAM: $([Math]::Round($totalRAM, 1)) MB" -ForegroundColor Magenta
        }
        Write-Host ""
    }

    'unlock' {
        Show-Header
        Ensure-EngineLoaded
        Write-Host " [*] Performing immediate handle unlock sweep across all active instances..." -ForegroundColor Cyan
        $closed = [MultiAlts.Core.MultiAltsEngine]::UnlockAllInstances()
        Write-Host " [+] Complete! Stripped $closed lock handle(s)." -ForegroundColor Green
    }

    'watch' {
        Show-Header
        Ensure-EngineLoaded
        Write-Host " [*] Entering interactive foreground watch mode..." -ForegroundColor Cyan
        Write-Host " [*] Press [Ctrl+C] to exit." -ForegroundColor DarkGray
        Write-Host ""

        while ($true) {
            $closed = [MultiAlts.Core.MultiAltsEngine]::UnlockAllInstances()
            $instances = [MultiAlts.Core.MultiAltsEngine]::GetActiveInstancesSummary()
            $time = (Get-Date).ToString("HH:mm:ss")
            $count = if ($instances) { $instances.Count } else { 0 }
            Write-Host " [$time] Active Accounts: $count | Handles Stripped in Cycle: $closed" -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
    }

    'clean' {
        Show-Header
        Write-Host " [*] Scanning for unresponsive ghost Roblox processes..." -ForegroundColor Cyan
        $killed = 0
        Get-Process -Name "*RobloxCrashHandler*" -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $killed++
        }
        Write-Host " [+] Cleanup complete! Terminated $killed orphan handler(s)." -ForegroundColor Green
    }

    'kill-all' {
        Show-Header
        Write-Host " [*] Terminating all active Roblox game windows and crash handlers..." -ForegroundColor Yellow
        $killedGames = 0
        Get-Process -Name "*RobloxPlayerBeta*" -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $killedGames++
        }
        $killedHandlers = 0
        Get-Process -Name "*RobloxCrashHandler*" -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
            $killedHandlers++
        }
        Write-Host " [+] Reset complete: Closed $killedGames game instance(s) and $killedHandlers handler(s)." -ForegroundColor Green
    }

    'install' {
        Show-Header
        Write-Host " [*] Installing MultiAlts RBX..." -ForegroundColor Cyan

        # Copy runtime files to AppData
        if (-not (Test-Path $AppDir)) {
            New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
        }
        Copy-Item -Path $RootDir\* -Destination $AppDir -Recurse -Force

        # Configure autostart in HKCU Run if configured
        $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
        $autostartCmd = "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$AppDir\src\Daemon.ps1`""
        Set-ItemProperty -Path $runKey -Name "MultiAltsRBX" -Value $autostartCmd -Force

        # Create Desktop Launcher Shortcut
        $wsh = New-Object -ComObject WScript.Shell
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcut = $wsh.CreateShortcut((Join-Path $desktopPath "MultiAlts RBX.lnk"))
        $shortcut.TargetPath = "powershell.exe"
        $shortcut.Arguments = "-NoExit -ExecutionPolicy Bypass -File `"$AppDir\multialts.ps1`" status"
        $shortcut.WorkingDirectory = $AppDir
        $shortcut.Description = "Launch and inspect MultiAlts RBX Multi-Instance Manager"
        $shortcut.Save()

        Write-Host " [+] Installation complete!" -ForegroundColor Green
        Write-Host " [+] Auto-start on login registered." -ForegroundColor White
        Write-Host " [+] Desktop shortcut created: 'MultiAlts RBX'" -ForegroundColor White
    }

    'uninstall' {
        Show-Header
        Write-Host " [*] Uninstalling MultiAlts RBX..." -ForegroundColor Cyan

        # Stop daemon
        & $MyInvocation.MyCommand.Path stop

        # Remove autostart registry
        $runKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
        Remove-ItemProperty -Path $runKey -Name "MultiAltsRBX" -ErrorAction SilentlyContinue

        # Remove desktop shortcut
        $desktopPath = [Environment]::GetFolderPath("Desktop")
        $shortcutPath = Join-Path $desktopPath "MultiAlts RBX.lnk"
        if (Test-Path $shortcutPath) {
            Remove-Item $shortcutPath -Force -ErrorAction SilentlyContinue
        }

        # Remove AppData directory
        if (Test-Path $AppDir) {
            Remove-Item $AppDir -Recurse -Force -ErrorAction SilentlyContinue
        }

        Write-Host " [+] MultiAlts RBX has been completely removed." -ForegroundColor Green
    }

    default {
        Show-Header
        Write-Host " Available Commands:" -ForegroundColor White
        Write-Host "   .\multialts.ps1 start      - Launch background unlock daemon" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 stop       - Stop background unlock daemon" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 restart    - Restart the daemon" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 status     - View active Roblox instances & daemon health" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 unlock     - Run an instant one-shot lock sweep" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 watch      - Run live interactive foreground monitor" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 clean      - Clean stuck ghost Roblox/crash handler processes" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 kill-all   - Close all running Roblox games and reset to zero" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 install    - Install to AppData & setup autostart/shortcuts" -ForegroundColor Cyan
        Write-Host "   .\multialts.ps1 uninstall  - Remove all files, registry keys, and shortcuts" -ForegroundColor Cyan
        Write-Host ""
    }
}
