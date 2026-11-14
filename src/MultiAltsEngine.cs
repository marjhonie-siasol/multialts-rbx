using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace MultiAlts.Core
{
    public struct InstanceInfo
    {
        public int ProcessId;
        public string ProcessName;
        public double WorkingSetMB;
        public string StartTime;
        public bool IsLocked;
    }

    public static class MultiAltsEngine
    {
        private const uint PROCESS_DUP_HANDLE = 0x0040;
        private const uint PROCESS_QUERY_INFORMATION = 0x0400;
        private const uint PROCESS_VM_READ = 0x0010;

        private const uint DUPLICATE_CLOSE_SOURCE = 0x00000001;
        private const uint DUPLICATE_SAME_ACCESS = 0x00000002;

        private const int SystemHandleInformationEx = 64;
        private const int ObjectNameInformation = 1;
        private const int ObjectTypeInformation = 2;

        private static Thread _watcherThread;
        private static volatile bool _keepRunning;

        [StructLayout(LayoutKind.Sequential)]
        private struct SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX
        {
            public IntPtr Object;
            public IntPtr UniqueProcessId;
            public IntPtr HandleValue;
            public uint GrantedAccess;
            public ushort CreatorBackTraceIndex;
            public ushort ObjectTypeIndex;
            public uint HandleAttributes;
            public uint Reserved;
        }

        [DllImport("ntdll.dll")]
        private static extern int NtQuerySystemInformation(
            int SystemInformationClass,
            IntPtr SystemInformation,
            uint SystemInformationLength,
            out uint ReturnLength);

        [DllImport("ntdll.dll")]
        private static extern int NtQueryObject(
            IntPtr ObjectHandle,
            int ObjectInformationClass,
            IntPtr ObjectInformation,
            uint ObjectInformationLength,
            out uint ReturnLength);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern IntPtr OpenProcess(
            uint dwDesiredAccess,
            bool bInheritHandle,
            uint dwProcessId);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool CloseHandle(IntPtr hObject);

        [DllImport("kernel32.dll", SetLastError = true)]
        private static extern bool DuplicateHandle(
            IntPtr hSourceProcessHandle,
            IntPtr hSourceHandle,
            IntPtr hTargetProcessHandle,
            out IntPtr lpTargetHandle,
            uint dwDesiredAccess,
            bool bInheritHandle,
            uint dwOptions);

        [DllImport("kernel32.dll")]
        private static extern IntPtr GetCurrentProcess();

        public static List<uint> FindTargetPids(string processName = "RobloxPlayerBeta")
        {
            var pids = new List<uint>();
            try
            {
                var procs = Process.GetProcessesByName(processName);
                for (int i = 0; i < procs.Length; i++)
                {
                    try
                    {
                        if (!procs[i].HasExited)
                        {
                            pids.Add((uint)procs[i].Id);
                        }
                    }
                    catch { }
                    finally
                    {
                        procs[i].Dispose();
                    }
                }
            }
            catch { }
            return pids;
        }

        public static int StripProcessLocks(uint pid)
        {
            var handleValues = GetProcessHandleList(pid);
            if (handleValues.Count == 0) return 0;

            uint access = PROCESS_DUP_HANDLE | PROCESS_QUERY_INFORMATION | PROCESS_VM_READ;
            IntPtr hProcess = OpenProcess(access, false, pid);
            if (hProcess == IntPtr.Zero) return 0;

            IntPtr hCurrent = GetCurrentProcess();
            int stripped = 0;

            try
            {
                for (int i = 0; i < handleValues.Count; i++)
                {
                    IntPtr hSource = handleValues[i];
                    IntPtr hDup;

                    if (!DuplicateHandle(hProcess, hSource, hCurrent, out hDup, 0, false, DUPLICATE_SAME_ACCESS))
                    {
                        continue;
                    }

                    try
                    {
                        string type = ReadObjectInfoString(hDup, ObjectTypeInformation);
                        if (type != "Event" && type != "Mutant")
                        {
                            continue;
                        }

                        string name = ReadObjectInfoString(hDup, ObjectNameInformation);
                        if (string.IsNullOrEmpty(name))
                        {
                            continue;
                        }

                        bool isLock = false;
                        if (type == "Event" && name.IndexOf("ROBLOX_singletonEvent", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            isLock = true;
                        }
                        else if (type == "Mutant" && name.IndexOf("ROBLOX_singletonMutex", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            isLock = true;
                        }

                        if (isLock)
                        {
                            IntPtr dummy;
                            if (DuplicateHandle(hProcess, hSource, IntPtr.Zero, out dummy, 0, false, DUPLICATE_CLOSE_SOURCE | DUPLICATE_SAME_ACCESS))
                            {
                                stripped++;
                            }
                        }
                    }
                    finally
                    {
                        CloseHandle(hDup);
                    }
                }
            }
            finally
            {
                CloseHandle(hProcess);
            }

            return stripped;
        }

        public static int UnlockAllInstances(string processName = "RobloxPlayerBeta")
        {
            int total = 0;
            var pids = FindTargetPids(processName);
            for (int i = 0; i < pids.Count; i++)
            {
                total += StripProcessLocks(pids[i]);
            }
            return total;
        }

        public static InstanceInfo[] GetActiveInstancesSummary(string processName = "RobloxPlayerBeta")
        {
            var list = new List<InstanceInfo>();
            try
            {
                var procs = Process.GetProcessesByName(processName);
                for (int i = 0; i < procs.Length; i++)
                {
                    try
                    {
                        if (!procs[i].HasExited)
                        {
                            var info = new InstanceInfo
                            {
                                ProcessId = procs[i].Id,
                                ProcessName = procs[i].ProcessName,
                                WorkingSetMB = Math.Round((double)procs[i].WorkingSet64 / (1024 * 1024), 2),
                                StartTime = procs[i].StartTime.ToString("yyyy-MM-dd HH:mm:ss"),
                                IsLocked = false
                            };
                            list.Add(info);
                        }
                    }
                    catch { }
                    finally
                    {
                        procs[i].Dispose();
                    }
                }
            }
            catch { }
            return list.ToArray();
        }

        public static void StartAutoWatcher(int pollIntervalMs = 1500, string processName = "RobloxPlayerBeta")
        {
            if (_keepRunning && _watcherThread != null && _watcherThread.IsAlive)
            {
                return;
            }

            _keepRunning = true;
            _watcherThread = new Thread(() =>
            {
                while (_keepRunning)
                {
                    try
                    {
                        UnlockAllInstances(processName);
                    }
                    catch { }

                    Thread.Sleep(pollIntervalMs);
                }
            })
            {
                IsBackground = true,
                Name = "MultiAltsEngineWatcher"
            };

            _watcherThread.Start();
        }

        public static void StopAutoWatcher()
        {
            _keepRunning = false;
            if (_watcherThread != null && _watcherThread.IsAlive)
            {
                _watcherThread.Join(600);
            }
        }

        private static List<IntPtr> GetProcessHandleList(uint targetPid)
        {
            var results = new List<IntPtr>();
            uint size = 0x10000;

            while (true)
            {
                IntPtr buffer = Marshal.AllocHGlobal((int)size);
                uint returnLength;
                int status = NtQuerySystemInformation(SystemHandleInformationEx, buffer, size, out returnLength);

                if (status == 0)
                {
                    try
                    {
                        long count = Marshal.ReadInt64(buffer, 0);
                        int entrySize = Marshal.SizeOf(typeof(SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX));
                        int offset = IntPtr.Size * 2;

                        for (long i = 0; i < count; i++)
                        {
                            IntPtr entryPtr = new IntPtr(buffer.ToInt64() + offset + (i * entrySize));
                            var entry = (SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX)Marshal.PtrToStructure(entryPtr, typeof(SYSTEM_HANDLE_TABLE_ENTRY_INFO_EX));

                            if (entry.UniqueProcessId.ToInt64() == targetPid)
                            {
                                results.Add(entry.HandleValue);
                            }
                        }
                    }
                    finally
                    {
                        Marshal.FreeHGlobal(buffer);
                    }
                    break;
                }

                Marshal.FreeHGlobal(buffer);
                if (returnLength <= size)
                {
                    break;
                }
                size = returnLength + 0x1000;
            }

            return results;
        }

        private static string ReadObjectInfoString(IntPtr handle, int infoClass)
        {
            uint size = 0x1000;
            while (true)
            {
                IntPtr buffer = Marshal.AllocHGlobal((int)size);
                uint returnLength;
                int status = NtQueryObject(handle, infoClass, buffer, size, out returnLength);

                if (status == 0)
                {
                    try
                    {
                        int strBufferOffset = IntPtr.Size == 8 ? 8 : 4;
                        IntPtr strPtr = Marshal.ReadIntPtr(buffer, strBufferOffset);
                        if (strPtr != IntPtr.Zero)
                        {
                            return Marshal.PtrToStringUni(strPtr);
                        }
                    }
                    finally
                    {
                        Marshal.FreeHGlobal(buffer);
                    }
                    return null;
                }

                Marshal.FreeHGlobal(buffer);
                if (returnLength <= size)
                {
                    break;
                }
                size = returnLength + 0x100;
            }

            return null;
        }
    }
}
