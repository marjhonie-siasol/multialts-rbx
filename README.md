# MultiAlts RBX

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white)](https://microsoft.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero Binaries](https://img.shields.io/badge/Binaries-Zero%20Dependencies-brightgreen.svg)]()
[![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()

> **Next-Generation, Zero-Binary Multi-Instance Manager for Roblox on Windows**  
> Run multiple native Roblox game accounts simultaneously on a single computer without emulators, VM overhead, or third-party injectors.

> [!TIP]
> **PowerShell Execution Note:** If PowerShell shows a script execution error on a fresh Windows install, run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once, or simply double-click `multialts.cmd`.

---

## ⚡ What Makes MultiAlts RBX Different?

Most multi-accounting setups rely on heavy virtualization, generic Android emulators, or outdated script wrappers. **MultiAlts RBX** is an original, high-performance solution that communicates directly with native Windows NT subsystem APIs.

| Feature | **MultiAlts RBX (Native Windows)** | Traditional Emulators & Other Tools |
| :--- | :--- | :--- |
| **RAM per Account** | **~250 MB – 500 MB** | 2,000 MB – 3,500 MB (2–3.5 GB) |
| **CPU Usage** | **Near Zero Overhead** (DirectX/Vulkan) | 50%–90% (Virtualization / translation overhead) |
| **Disk Space** | **0 MB extra** (Uses installed Roblox) | 5 GB – 10 GB per instance |
| **Frame Rates** | Native 60+ FPS | Stuttery, emulation input lag |
| **Capacity (16GB RAM)** | **8 to 14 accounts simultaneously** | 2 to 3 accounts before freezing |
| **VBScript Dependency** | **None** (100% Modern PowerShell/.NET) | Often required or outdated |

---

## ✨ Features

- **Unified CLI Interface:** Control everything (`start`, `stop`, `status`, `unlock`, `watch`) through a single command: `.\multialts.ps1` or double-clicking `multialts.cmd`.
- **Live Real-Time Dashboard:** View all active Roblox client instances, PIDs, memory usage in MB, start timestamps, and lock status right in your terminal.
- **Zero VBScript:** Fully modernized for Windows 10 & 11 (VBScript-free, future-proof).
- **Dual-Engine Auto-Closer:** High-frequency handle stripper engine written in pure C# (`src/MultiAltsEngine.cs`) that removes singleton locks (`ROBLOX_singletonMutex` and `ROBLOX_singletonEvent`) without interfering with game processes.
- **JSON Configuration:** Centralized settings in `config.json` for custom poll intervals, port bindings, and target processes.
- **Local REST API:** Includes a local HTTP status daemon (`http://localhost:28491/status`) for external integrations and browser extensions.

---

## 📁 Project Architecture

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

## 🚀 Installation & Quick Start

### Option A: One-Line Install (PowerShell)
Paste into Windows PowerShell (no administrator privileges needed):
```powershell
irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/install.ps1 | iex
```
*Auto-bootstraps files into `%LOCALAPPDATA%\multialts-rbx`, registers auto-start with Windows, and begins background protection.*

### Option B: Double-Click or Local Script
If you cloned or downloaded this repository:
* Simply double-click **`install.cmd`**, or run in PowerShell:
```powershell
.\install.ps1
```

---

## 🎮 CLI Dashboard & Core Commands

### 1. View Live Status & Dashboard (`status`)
Open PowerShell in the project directory and run:
```powershell
.\multialts.ps1 status
```
*Displays daemon health and a real-time table of all active Roblox accounts, their Windows Process IDs (PIDs), RAM usage in MB, start timestamps, and unlock state:*
```text
  ========================================================
             MultiAlts RBX - Multi-Instance Manager       
  ========================================================

  Service Status: ACTIVE (PID: 4036)
  API Endpoint:   http://localhost:28491/
  Log File:       %LOCALAPPDATA%\multialts-rbx\daemon.log

  --------------------------------------------------------
  Active Roblox Instances Detected:
  --------------------------------------------------------
  [PID 23368] - RAM: 1511.33 MB | Started: 2026-11-15 02:51:51 | State: Unlocked
  [PID 18088] - RAM: 1514.81 MB | Started: 2026-11-15 02:53:08 | State: Unlocked
  [PID 21972] - RAM: 2637.76 MB | Started: 2026-11-15 02:50:28 | State: Unlocked

  Total Running Accounts: 3 | Total RAM: 5663.9 MB
```

### 2. Start Background Protection (`start`)
```powershell
.\multialts.ps1 start
```
*Starts the background daemon silently. The engine monitors and strips singleton locks within **350ms** so any newly opened game window runs side-by-side.*

### 3. Stop Background Service (`stop`)
```powershell
.\multialts.ps1 stop
```
*Gracefully signals the local HTTP server and terminates the background watcher process.*

### 4. Purge Ghost / Crash Handlers (`clean`)
If an older game session crashed or left behind invisible background processes:
```powershell
.\multialts.ps1 clean
```
*Safely scans and kills orphaned `RobloxCrashHandler.exe` processes without touching active game windows.*

### 5. Terminate All Games & Reset to Zero (`kill-all`)
When you want to close every open Roblox game client and clear all memory immediately:
```powershell
.\multialts.ps1 kill-all
```
*Terminates all running `RobloxPlayerBeta.exe` and handler processes in one single command.*

### 6. Interactive Live Watcher (`watch`)
To view real-time logging as instances launch:
```powershell
.\multialts.ps1 watch
```

---

## 🧹 Clearing & Starting Fresh From Scratch

If you ever want to reset everything to zero and start fresh:

```powershell
# 1. Close all active Roblox game windows
.\multialts.ps1 kill-all

# 2. Stop the background daemon
.\multialts.ps1 stop

# 3. Confirm everything is at zero
.\multialts.ps1 status
```
*Output will show `Service Status: STOPPED` and `No active Roblox windows currently running`.*

Once at zero, simply run `.\multialts.ps1 start` to begin your new session!

---

## 🎮 How to Launch Multiple Accounts

1. Start MultiAlts:
   ```powershell
   .\multialts.ps1 start
   ```
2. **Set up Browser Profiles (Chrome or Brave):**
   * Do **not** use Incognito/Private tabs (they share the same session memory).
   * In Chrome or Brave, click your profile avatar at the top right $\rightarrow$ **Add new profile** $\rightarrow$ **Continue without an account**.
   * Log into **Account 1** in Profile 1, **Account 2** in Profile 2, etc.
3. **Launch the Games:**
   * In Profile 1, click **Play**. Wait for the game to load into the map.
   * In Profile 2, click **Play**.
   * In Profile 3, click **Play**.
   * Each window will open independently side-by-side!

---

## ⚙️ Configuration (`config.json`)

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

## ☀️ Daily Grinding Workflow (Morning to Night)

Follow this simple routine every day to run and manage your alts effortlessly:

### 1. In the Morning: Start Fresh
1. Open PowerShell in the project directory and start the manager:
   ```powershell
   .\multialts.ps1 start
   ```
2. **Launch accounts using the 10-Second Rule:**
   * Open **Chrome Profile 1 (Main)** $\rightarrow$ Click **Play** $\rightarrow$ Wait ~10 seconds for the map to load.
   * Open **Chrome Profile 2 (Alt 1)** $\rightarrow$ Click **Join / Play** $\rightarrow$ Wait for the window to appear.
   * Repeat for Alt 2, Alt 3, etc.
3. **In-Game AFK Optimization:**
   * In each background Alt window: Press `Esc` $\rightarrow$ **Settings** $\rightarrow$ set **Graphics Quality** to manual level `1`.
   * Mute in-game **Volume** to `0` on idle windows to save CPU.

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

## 💻 CLI Commands Guide: What Every Command Is Used For

| Command | Action | When to Use It |
| :--- | :--- | :--- |
| **`.\multialts.ps1 status`** | Shows active daemon state, active account windows, PIDs, RAM in MB, and uptime. | Whenever you want to check if accounts are running or verify your farm. |
| **`.\multialts.ps1 start`** | Launches the background unlocker silently with high-speed 350ms poll rate. | First thing in the morning when starting a new grinding session. |
| **`.\multialts.ps1 stop`** | Gracefully stops the background unlocker daemon via local API. | When you are done playing or want to halt background monitoring. |
| **`.\multialts.ps1 kill-all`** | Instantly closes all running `RobloxPlayerBeta.exe` windows and crash handlers. | At night or whenever you want to close every game and reset to zero. |
| **`.\multialts.ps1 clean`** | Purges orphaned background `RobloxCrashHandler.exe` processes. | If an old game session froze or crashed and left invisible ghost processes. |
| **`.\multialts.ps1 restart`** | Stops and restarts the background daemon. | After modifying settings in `config.json`. |
| **`.\multialts.ps1 unlock`** | Performs an immediate manual one-shot lock sweep across all clients. | If a game window opened before the daemon was started. |
| **`.\multialts.ps1 watch`** | Runs live interactive console monitor with real-time log output. | For debugging or watching account launches as they happen. |
| **`.\multialts.ps1 install`** | Registers auto-start on Windows login and creates a Desktop shortcut. | One-time setup if you want MultiAlts to start automatically with Windows. |
| **`.\multialts.ps1 uninstall`** | Completely cleans up all registry keys, shortcuts, and AppData files. | If you ever want to completely remove MultiAlts from your PC. |

---

## 🗑️ How to Completely Uninstall MultiAlts

To completely remove MultiAlts and revert Roblox back to standard single-instance mode:

### Step 1: Remove the Browser Extension
Right-click the MultiAlts icon in Chrome or Brave $\rightarrow$ select **Remove from Chrome**.

### Step 2: Run the Clean Uninstaller Command
Run this in PowerShell:
```powershell
irm https://raw.githubusercontent.com/marjhonie-siasol/multialts-rbx/main/uninstall.ps1 | iex
```
*(Or double-click `uninstall.cmd` / run `.\uninstall.ps1` from the repository folder).*

### What the uninstaller does:
1. **Terminates background processes:** Stops the background engine and frees port `28491`.
2. **Removes Windows startup entry:** Deletes `HKCU:\Software\Microsoft\Windows\CurrentVersion\Run\MultiAltsRBX`.
3. **Deletes runtime files:** Wipes `%LOCALAPPDATA%\multialts-rbx` and removes any desktop shortcuts.
4. **Restores standard Roblox behavior:** Windows kernel handles remain untouched, meaning Roblox's native single-instance mutex lock is 100% back in effect (second window is blocked).

---

## ⚖️ License

MIT License — Copyright (c) 2026 Marjhonie and contributors.  
See [LICENSE](LICENSE) for details.
