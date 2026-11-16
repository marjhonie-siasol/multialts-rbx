# MultiAlts RBX

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white)](https://microsoft.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Binaries](https://img.shields.io/badge/Binaries-Zero%20Dependencies-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()

> **Next-Generation, Zero-Binary Multi-Instance Manager for Roblox on Windows**  
> Run multiple native Roblox game accounts simultaneously on a single computer without emulators, VM overhead, or third-party injectors.

> [!TIP]
> **PowerShell Execution Note:** If PowerShell shows a script execution error on a fresh Windows install, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or double-click `multialts.cmd`.

---

## What Makes MultiAlts RBX Different?

Most multi-accounting setups rely on heavy virtualization, generic Android emulators, or outdated script wrappers. **MultiAlts RBX** is an original, high-performance solution that communicates directly with native Windows NT subsystem APIs.

| Feature | **MultiAlts RBX (Native Windows)** | Traditional Emulators & Other Tools |
| :--- | :--- | :--- |
| **RAM per Account** | **~250 MB - 500 MB** | 2,000 MB - 3,500 MB (2 - 3.5 GB) |
| **CPU Usage** | **Near Zero Overhead** (DirectX/Vulkan) | 50% - 90% (Virtualization / translation overhead) |
| **Disk Space** | **0 MB extra** (Uses installed Roblox) | 5 GB - 10 GB per instance |
| **Frame Rates** | Native 60+ FPS | Stuttery, emulation input lag |
| **Capacity (16GB RAM)** | **8 to 14 accounts simultaneously** | 2 to 3 accounts before freezing |
| **VBScript Dependency** | **None** (100% Modern PowerShell/.NET) | Often required or outdated |

---

## Features

- **Unified CLI Interface:** Control everything (`start`, `stop`, `status`, `unlock`, `watch`, `clean`, `kill-all`) through a single command: `.\multialts.ps1` or double-clicking `install.cmd` / `uninstall.cmd`.
- **Auto-Account Detection:** The browser extension automatically detects your logged-in Roblox account and alts, adding them to your vault silently without manual input.
- **Real-Time Presence Badges & Emerald Rings:** Live `Playing`, `Online`, and `Offline` badges with glowing emerald avatar profile rings displayed across all concurrent game windows simultaneously.
- **Live Real-Time Dashboard:** View all active Roblox client instances, PIDs, memory usage in MB, start timestamps, and lock status right in your terminal.
- **Zero VBScript:** Fully modernized for Windows 10 & 11 (VBScript-free, future-proof).
- **Dual-Engine Auto-Closer:** High-frequency handle stripper engine written in pure C# (`src/MultiAltsEngine.cs`) that removes singleton locks (`ROBLOX_singletonMutex` and `ROBLOX_singletonEvent`) without interfering with game processes.
- **JSON Configuration:** Centralized settings in `config.json` for custom poll intervals, port bindings, and target processes.
- **Local REST API:** Includes a local HTTP status daemon (`http://localhost:28491/status`) for external integrations and browser extensions.

---

## Project Architecture

```
multialts-rbx/
├── install.cmd            # Double-click to install & start engine
├── install.ps1            # One-line installer & background service launcher
├── uninstall.cmd          # Double-click to completely stop & remove engine
├── uninstall.ps1          # Clean uninstaller (restores single-instance Roblox)
├── multialts.cmd          # CLI launcher shortcut
├── multialts.ps1          # Unified Master CLI controller (status, kill-all, watch)
├── config.json            # Centralized settings & engine parameters
├── docs/                  # Official documentation & landing page website
├── extension/             # Chromium browser extension source
├── src/
│   ├── MultiAltsEngine.cs # High-performance Win32 NT handle stripping engine
│   └── Daemon.ps1         # Lean background service & local HTTP REST server
├── README.md              # Project documentation
├── LICENSE                # MIT License
└── .gitignore             # Git ignore definitions
```

---

## Do You Need the Extension? (PowerShell Engine vs. Extension)

A common question is: *"Do I need to install the Chrome extension, or can I just run the PowerShell command?"*

The answer depends on how many accounts you play and how you switch between them:

| Requirement / Scenario | **Option A: PowerShell Engine Only** | **Option B: Engine + Chrome Extension** |
| :--- | :--- | :--- |
| **Number of Accounts** | Best for **2 to 3 accounts** | Recommended for **5, 10, or 20+ accounts** |
| **Account Switching Method** | Roblox's built-in switcher or browser profiles | 1-click switching directly in your toolbar |
| **Roblox 5-Account Limit** | Subject to Roblox's hard 5-account limit | **Bypasses the limit** (unlimited accounts saved locally) |
| **Need Extension Installed?** | **No extension required at all!** | Yes, load `multialts-extension.zip` in Chrome/Brave |
| **Need PowerShell Installed?** | **Yes, required** (removes Windows mutex) | **Yes, required** (removes Windows mutex) |
| **Live In-Game Presence** | Via terminal (`.\multialts.ps1 status`) | Live presence badges + emerald avatar rings in popup |
| **Password / 2FA Typing** | Needed if you switch past 5 accounts | Never re-enter passwords or 2FA codes |

### When to choose Option A (PowerShell Engine Only):
If you only run 2 or 3 alts and switch them via Roblox's website or separate browser profiles, **you do not need the extension**. Just install the engine (`install.ps1` or `install.cmd`), and you can immediately launch multiple Roblox windows side-by-side.

### When to choose Option B (Engine + Extension):
If you manage a large alt farm (5 to 20+ accounts), switching through the Roblox website hits their 5-account restriction. The extension acts as an offline local vault that allows 1-click swapping between unlimited accounts with zero accidental logouts.

---

## How to Set Up

### Part 1: Browser Extension Setup (When Managing 5+ Accounts)

Follow these 4 simple steps to install the MultiAlts extension on Chrome, Brave, or Edge:

1. **Download the Extension:**
   Visit the website and download the `multialts-extension.zip` archive.
2. **Open Extensions in Browser:**
   Click the browser menu (three dots) in the top-right corner, navigate to **Extensions**, and select **Manage Extensions** (or go directly to `chrome://extensions`).
3. **Enable Developer Mode & Install:**
   Turn on the **Developer mode** toggle in the top-right corner of the Extensions page, then drag and drop the downloaded `.zip` folder into the window (or extract the folder and click **Load unpacked**).
4. **Add Accounts & Start Switching:**
   Open the MultiAlts popup from your browser toolbar. Click **+ Add Roblox Account** for each alt you want to store. Switch between accounts in one click without re-typing passwords.

---

### Part 2: PowerShell Engine Setup (Unlocking Multi-Instance)

Follow these 3 quick steps to enable simultaneous multi-window Roblox on Windows:

1. **Copy the Install Command:**
   Copy the one-line command from the website or repository:
   ```powershell
   irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/install.ps1 | iex
   ```
2. **Paste and Run in PowerShell:**
   Open Windows PowerShell normally (no administrator privileges needed), paste the command, and press **Enter**.
3. **Launch Multiple Game Windows:**
   Start launching Roblox accounts side-by-side using Roblox's built-in account switcher (for up to 5 accounts) or the MultiAlts extension (for 5+ accounts). Each window opens independently without closing earlier windows.

> [!NOTE]
> **Gameplay Examples & Game Credits:**
> The multi-window gameplay previews demonstrate MultiAlts running concurrently across popular Roblox community titles:
> - *Cliffbound: Rock Climbing*
> - *Dig to Escape*
> - *Steal a Balut*
> - *Steal a Superpower*

---

## Uninstallation & Verification

### Engine Uninstallation

To revert back to standard single-instance Roblox and remove all background files:

1. **Copy the Uninstall Command:**
   ```powershell
   irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 | iex
   ```
2. **Paste & Run in PowerShell:**
   Open Windows PowerShell normally, paste the command, and press **Enter**. The script cleanly stops the background daemon, deletes `%LOCALAPPDATA%\multialts-rbx`, removes Windows startup keys, closes open game clients to reset mutex locks, and restores default single-instance mode.

### Status Verification

To verify whether the engine is active or completely uninstalled, run this status check in PowerShell:

```powershell
[PSCustomObject]@{
    EngineRunning = [bool](Get-NetTCPConnection -LocalPort 28491 -ErrorAction SilentlyContinue)
    FilesExist    = (Test-Path "$env:LOCALAPPDATA\multialts-rbx")
    AutoStartKey  = [bool](Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "MultiAltsRBX" -ErrorAction SilentlyContinue)
}
```

- **Active Engine Output:**
  ```text
  EngineRunning FilesExist AutoStartKey
  ------------- ---------- ------------
           True       True         True
  ```
  *When active, all three properties return `True` (port 28491 open, files present, startup registered).*

- **Cleanly Removed Output:**
  ```text
  EngineRunning FilesExist AutoStartKey
  ------------- ---------- ------------
          False      False        False
  ```
  *After running the uninstaller, all three return `False`, confirming complete cleanup.*

---

## Commands Overview & Reference

### Quick-Start One-Liners (Web & Terminal)

| Action | One-Line Command | Description |
| :--- | :--- | :--- |
| **Install & Start** | `irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/install.ps1 \| iex` | Bootstraps engine to AppData, registers boot startup, and launches daemon. |
| **Verify Status** | *See Status Verification snippet above* | Checks port 28491, AppData directory, and registry keys (`True` or `False`). |
| **Uninstall** | `irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 \| iex` | Stops service, purges AppData files, removes startup keys, resets single-window mode. |

### Unified CLI Reference (`.\multialts.ps1 <command>`)

When working directly in the project directory or via the desktop launcher:

| Command | Action & Function | When to Use It |
| :--- | :--- | :--- |
| **`.\multialts.ps1 status`** | Displays daemon health, active port, and a table of running Roblox instances with PIDs, RAM usage, and unlock state. | Whenever you want to check farm health or inspect memory usage. |
| **`.\multialts.ps1 start`** | Launches the background unlocker service silently with high-frequency 350ms lock-clearing. | At the beginning of a gaming session. |
| **`.\multialts.ps1 stop`** | Gracefully signals HTTP shutdown and terminates the background watcher process. | When finished playing or halting background monitoring. |
| **`.\multialts.ps1 restart`** | Stops and restarts the background daemon. | After modifying settings in `config.json`. |
| **`.\multialts.ps1 unlock`** | Performs an immediate manual one-shot mutex handle sweep across all active instances. | If a window opened before the daemon started. |
| **`.\multialts.ps1 watch`** | Runs an interactive foreground live watcher showing active instances and handle strip cycles every 2 seconds. | For live console monitoring or troubleshooting. |
| **`.\multialts.ps1 clean`** | Safely scans and terminates orphaned ghost `RobloxCrashHandler.exe` processes. | If a previous game crashed and left background ghost tasks. |
| **`.\multialts.ps1 kill-all`** | Force-closes all running `RobloxPlayerBeta.exe` game clients and crash handlers immediately. | At night or when resetting all game instances to zero. |
| **`.\multialts.ps1 install`** | Copies runtime files to AppData, sets up Windows boot auto-start, and creates a desktop shortcut. | For permanent local system installation. |
| **`.\multialts.ps1 uninstall`** | Removes all files, startup registry entries, shortcuts, and restores default single-window Roblox. | To completely purge MultiAlts from your PC. |

---

## Daily Grinding Workflow (Morning to Night)

Follow this simple routine every day to run and manage your alts effortlessly:

### 1. In the Morning: Start Fresh
1. Open PowerShell in the project directory and start the manager:
   ```powershell
   .\multialts.ps1 start
   ```
2. **Launch accounts using the 10-Second Rule:**
   - Open **Chrome Profile 1 (Main)** -> Click **Play** -> Wait ~10 seconds for the map to load.
   - Open **Chrome Profile 2 (Alt 1)** -> Click **Join / Play** -> Wait for the window to appear.
   - Repeat for Alt 2, Alt 3, etc.
3. **In-Game AFK Optimization:**
   - In each background Alt window: Press `Esc` -> **Settings** -> set **Graphics Quality** to manual level `1`.
   - Mute in-game **Volume** to `0` on idle windows to save CPU.

### 2. Mid-Day: Sanity Check
Check on your farm anytime without opening every window:
```powershell
.\multialts.ps1 status
```
*Gives you an instant overview of total RAM used and verifies all accounts are active and unlocked.*

### 3. End of the Day: Wrap Up in 3 Seconds
When you're finished grinding:
```powershell
# Closes all open Roblox windows instantly
.\multialts.ps1 kill-all

# Stops the background manager
.\multialts.ps1 stop
```
*Everything is cleared from RAM and ready for the next morning.*

---

## Configuration (`config.json`)

You can customize the daemon and engine behavior by editing `config.json`:

```json
{
  "version": "1.0.0",
  "name": "multialts-rbx",
  "daemon": {
    "port": 28491,
    "enableHttpApi": true,
    "autoStartOnLogin": true,
    "bindAddress": "127.0.0.1"
  },
  "engine": {
    "targetProcess": "RobloxPlayerBeta",
    "lockPatterns": [
      "ROBLOX_singletonMutex",
      "ROBLOX_singletonEvent"
    ],
    "pollIntervalMs": 350
  }
}
```

---

## Frequently Asked Questions

#### Will my Roblox account get banned?
No. MultiAlts does not inject cheats, scripts, or modify game memory. It only clears a Windows operating system mutex handle so Windows allows a second window to open.

#### Do I have to install the Chrome extension?
No. If you only play 2 or 3 accounts, running the PowerShell command is sufficient. The extension is only needed if you want to store more than 5 accounts and switch between them with one click.

#### How many accounts can I run at once?
As many as your computer hardware can handle. Modern gaming PCs typically handle 5 to 10 game instances simultaneously without issue.

#### Do I need to keep PowerShell open?
No. Once the command completes, the unlocker runs quietly in the background as a Windows service. You can close PowerShell immediately.

---

## License

MIT License - Copyright (c) 2026 Marjhonie and contributors.  
See [LICENSE](LICENSE) for details.
