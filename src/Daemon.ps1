#Requires -Version 5.1
<#
.SYNOPSIS
    MultiAlts RBX Background Daemon
.DESCRIPTION
    Runs the event-driven watcher and local REST endpoint to seamlessly unlock
    multiple native Roblox instances.
#>

$ScriptDir = $PSScriptRoot
if (-not $ScriptDir) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
$RootDir = Split-Path -Parent $ScriptDir
$ConfigPath = Join-Path $RootDir 'config.json'
$EnginePath = Join-Path $ScriptDir 'MultiAltsEngine.cs'

# AppData runtime directory
$AppDir = Join-Path $env:LOCALAPPDATA 'multialts-rbx'
if (-not (Test-Path $AppDir)) {
    New-Item -ItemType Directory -Path $AppDir -Force | Out-Null
}

$PidFile = Join-Path $AppDir 'daemon.pid'
$LogFile = Join-Path $AppDir 'daemon.log'

function Write-DaemonLog {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $entry = "[$timestamp] [$Level] $Message"
    Add-Content -Path $LogFile -Value $entry -Encoding UTF8 -ErrorAction SilentlyContinue
}

# Single instance enforcement
$mutexName = 'Local\MultiAlts_Daemon_Mutex'
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($false, $mutexName, [ref]$createdNew)
if (-not $createdNew) {
    Write-DaemonLog "Another daemon instance is already active. Exiting." "WARN"
    exit 0
}

Set-Content -Path $PidFile -Value $PID -Force

# Read configuration
$config = $null
if (Test-Path $ConfigPath) {
    try {
        $config = Get-Content -Raw $ConfigPath | ConvertFrom-Json
    }
    catch {
        Write-DaemonLog "Failed to parse config.json, using defaults." "WARN"
    }
}

$targetProc = if ($config.engine.targetProcess) { $config.engine.targetProcess } else { "RobloxPlayerBeta" }
$port = if ($config.daemon.port) { [int]$config.daemon.port } else { 28491 }
$pollInterval = if ($config.engine.pollIntervalMs) { [int]$config.engine.pollIntervalMs } else { 1500 }

# Compile/Load C# Engine
if (Test-Path $EnginePath) {
    if (-not ('MultiAlts.Core.MultiAltsEngine' -as [type])) {
        Add-Type -TypeDefinition (Get-Content -Raw -Path $EnginePath) -Language CSharp -ErrorAction Stop
    }
}
else {
    Write-DaemonLog "MultiAltsEngine.cs not found at $EnginePath!" "ERROR"
    exit 1
}

Write-DaemonLog "MultiAlts daemon started (PID: $PID). Target: $targetProc" "INFO"

# Start internal C# Auto Watcher thread
[MultiAlts.Core.MultiAltsEngine]::StartAutoWatcher($pollInterval, $targetProc)
Write-DaemonLog "Auto-unlocker thread active (${pollInterval}ms poll)." "INFO"

# Optional HTTP REST Listener
$listener = $null
$enableHttp = if ($null -ne $config.daemon.enableHttpApi) { [bool]$config.daemon.enableHttpApi } else { $true }

if ($enableHttp) {
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Add("http://127.0.0.1:${port}/")
        $listener.Prefixes.Add("http://localhost:${port}/")
        $listener.Start()
        Write-DaemonLog "REST server listening on http://localhost:${port}/" "INFO"
    }
    catch {
        Write-DaemonLog "HTTP listener start error: $($_.Exception.Message)" "WARN"
        $listener = $null
    }
}

$startTime = Get-Date

try {
    if ($listener -and $listener.IsListening) {
        while ($listener.IsListening) {
            try {
                $context = $listener.GetContext()
                $req = $context.Request
                $res = $context.Response

                $res.AddHeader("Access-Control-Allow-Origin", "*")
                $res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
                $res.ContentType = "application/json; charset=utf-8"

                if ($req.HttpMethod -eq 'OPTIONS') {
                    $res.StatusCode = 204
                    $res.Close()
                    continue
                }

                $path = $req.Url.AbsolutePath.ToLowerInvariant()

                if ($path -eq '/' -or $path -eq '/status' -or $path -eq '/api/status') {
                    $instances = [MultiAlts.Core.MultiAltsEngine]::GetActiveInstancesSummary($targetProc)
                    $statusObj = @{
                        service = "multialts-rbx"
                        status = "running"
                        version = "1.0.0"
                        pid = $PID
                        uptimeSeconds = [int]((Get-Date) - $startTime).TotalSeconds
                        port = $port
                        activeAccounts = if ($instances) { $instances.Count } else { 0 }
                        instances = $instances
                    }
                    $json = $statusObj | ConvertTo-Json -Depth 4
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                    $res.ContentLength64 = $buffer.Length
                    $res.OutputStream.Write($buffer, 0, $buffer.Length)
                    $res.StatusCode = 200
                    $res.Close()
                }
                elseif (($path -eq '/unlock' -or $path -eq '/api/unlock') -and ($req.HttpMethod -eq 'POST' -or $req.HttpMethod -eq 'GET')) {
                    $closed = [MultiAlts.Core.MultiAltsEngine]::UnlockAllInstances($targetProc)
                    $respObj = @{ success = $true; closedHandles = $closed }
                    $json = $respObj | ConvertTo-Json
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                    $res.ContentLength64 = $buffer.Length
                    $res.OutputStream.Write($buffer, 0, $buffer.Length)
                    $res.StatusCode = 200
                    $res.Close()
                }
                elseif ($path -eq '/stop' -and $req.HttpMethod -eq 'POST') {
                    $respObj = @{ success = $true; message = "Daemon stopping" }
                    $json = $respObj | ConvertTo-Json
                    $buffer = [System.Text.Encoding]::UTF8.GetBytes($json)
                    $res.ContentLength64 = $buffer.Length
                    $res.OutputStream.Write($buffer, 0, $buffer.Length)
                    $res.StatusCode = 200
                    $res.Close()
                    break
                }
                else {
                    $res.StatusCode = 404
                    $res.Close()
                }
            }
            catch {
                Write-DaemonLog "Request handle warning: $($_.Exception.Message)" "WARN"
            }
        }
    }
    else {
        # Loop if HTTP listener is disabled
        while ($true) {
            Start-Sleep -Seconds 2
        }
    }
}
finally {
    Write-DaemonLog "Stopping engine..." "INFO"
    [MultiAlts.Core.MultiAltsEngine]::StopAutoWatcher()
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
    if (Test-Path $PidFile) {
        Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
    }
    if ($mutex) {
        $mutex.ReleaseMutex()
        $mutex.Dispose()
    }
    Write-DaemonLog "Daemon stopped cleanly." "INFO"
}
