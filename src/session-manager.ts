/**
 * Session Manager for jyugemu PowerShell session monitoring
 * Handles PowerShell subprocess creation, PSReadLine hook setup, and command capture
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { spawn, ChildProcess } from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import dayjs from 'dayjs';
import { CommandRecord, SessionConfig } from './types';
import { FileManager } from './file-manager';

/**
 * SessionManager class handles PowerShell session monitoring and command capture
 * Provides methods to start monitored sessions, setup PSReadLine hooks, and capture commands
 */
export class SessionManager {
  private sessionId: string;
  private historyFilePath: string;
  private fileManager: FileManager;
  private psProcess: ChildProcess | null = null;
  private readonly PSREADLINE_HOOK_TIMEOUT = 5000; // 5 seconds

  constructor(config: SessionConfig) {
    this.sessionId = config.sessionId;
    this.historyFilePath = config.historyFilePath;
    this.fileManager = new FileManager(this.historyFilePath);
  }

  /**
   * Start a monitored PowerShell session with command logging
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   */
  async startMonitoredSession(): Promise<void> {
    try {
      await this.verifyPowerShellAvailable();

      const hookScript = this.generatePSReadLineHookScript(this.sessionId);
      const encodedScript = Buffer.from(hookScript, 'utf16le').toString('base64');

      this.psProcess = spawn('powershell.exe', [
        '-NoExit',
        '-NoProfile',
        '-ExecutionPolicy', 'Bypass',
        '-EncodedCommand', encodedScript
      ], {
        stdio: 'inherit',
        shell: false,
      });

      this.psProcess.on('error', (error) => {
        console.error(`PowerShell session error: ${error.message}`);
      });

      this.psProcess.on('exit', (code) => {
        console.log(`PowerShell session exited with code ${code}`);
      });

      await new Promise<void>((resolve) => {
        if (this.psProcess) {
          this.psProcess.on('exit', () => resolve());
        }
      });
    } catch (error) {
      throw new Error(
        `Failed to start monitored session: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Setup PSReadLine hook for command monitoring
   */
  async setupPSReadLineHook(sessionId: string): Promise<string> {
    try {
      const hookScript = this.generatePSReadLineHookScript(sessionId);
      const tempDir = os.tmpdir();
      const scriptPath = path.join(tempDir, `jyugemu-hook-${sessionId}.ps1`);
      fs.writeFileSync(scriptPath, hookScript, 'utf-8');
      this.storeScriptPath(scriptPath);
      return scriptPath;
    } catch (error) {
      throw new Error(
        `Failed to setup PSReadLine hook: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Capture command execution information
   */
  async captureCommand(command: string, exitCode: number, cwd: string): Promise<CommandRecord> {
    const record: CommandRecord = {
      timestamp: dayjs().toISOString(),
      user: os.userInfo().username,
      command: command,
      exit_code: exitCode,
      cwd: cwd,
    };
    this.validateCommandRecord(record);
    await this.fileManager.appendCommand(record);
    return record;
  }


  /**
   * Generate PSReadLine hook script for command monitoring
   */
  private generatePSReadLineHookScript(sessionId: string): string {
    const historyFilePath = this.historyFilePath.replace(/\\/g, '\\\\');

    return `
function Write-JyugemuLog {
    param([string]$Command, [int]$ExitCode, [string]$WorkingDirectory)
    if ([string]::IsNullOrWhiteSpace($Command)) { return }
    if ($Command -match 'Write-JyugemuLog') { return }
    $timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffZ')
    $user = [System.Environment]::UserName
    if ($null -eq $ExitCode) { $ExitCode = 0 }
    try {
        $historyFile = "${historyFilePath}"
        if (Test-Path $historyFile) {
            $content = Get-Content $historyFile -Raw -ErrorAction Stop | ConvertFrom-Json
        } else {
            $content = @{ history = @() }
        }
        $record = [PSCustomObject]@{
            timestamp = $timestamp
            user = $user
            command = $Command
            exit_code = $ExitCode
            cwd = $WorkingDirectory
        }
        $content.history += $record
        $content | ConvertTo-Json -Depth 10 | Set-Content $historyFile -Encoding UTF8
    } catch {
        Write-Warning "Failed to log command: $_"
    }
}

$global:JyugemuLastHistoryId = -1

function global:prompt {
    $currentExitCode = $LASTEXITCODE
    $lastCmd = Get-History -Count 1 -ErrorAction SilentlyContinue
    if ($lastCmd) {
        if ($lastCmd.Id -ne $global:JyugemuLastHistoryId) {
            $global:JyugemuLastHistoryId = $lastCmd.Id
            Write-JyugemuLog -Command $lastCmd.CommandLine -ExitCode $currentExitCode -WorkingDirectory (Get-Location).Path
        }
    }
    "PS $(Get-Location)> "
}

Write-Host "jyugemu command logging initialized for session ${sessionId}" -ForegroundColor Green
Write-Host "Commands will be logged to: ${historyFilePath}" -ForegroundColor Gray
`;
  }

  private async verifyPowerShellAvailable(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ps = spawn('powershell.exe', ['-Command', 'Write-Host "OK"'], {
        stdio: 'pipe',
        shell: true,
      });
      let hasError = false;
      ps.on('error', (error) => {
        hasError = true;
        reject(new Error(`PowerShell not found: ${error.message}`));
      });
      ps.on('exit', (code) => {
        if (!hasError && code === 0) resolve();
        else if (!hasError) reject(new Error(`PowerShell verification failed with code ${code}`));
      });
      setTimeout(() => {
        if (!hasError) {
          ps.kill();
          reject(new Error('PowerShell verification timeout'));
        }
      }, this.PSREADLINE_HOOK_TIMEOUT);
    });
  }

  private validateCommandRecord(record: CommandRecord): void {
    const requiredFields: (keyof CommandRecord)[] = ['timestamp', 'user', 'command', 'exit_code', 'cwd'];
    for (const field of requiredFields) {
      if (record[field] === undefined || record[field] === null) {
        throw new Error(`CommandRecord missing required field: ${String(field)}`);
      }
    }
    if (!this.isValidISO8601(record.timestamp)) {
      throw new Error(`Invalid timestamp format: ${record.timestamp}`);
    }
    if (typeof record.exit_code !== 'number') {
      throw new Error(`Exit code must be a number, got ${typeof record.exit_code}`);
    }
  }

  private isValidISO8601(timestamp: string): boolean {
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return iso8601Regex.test(timestamp);
  }

  private storeScriptPath(scriptPath: string): void {
    console.debug(`PSReadLine hook script created at: ${scriptPath}`);
  }

  async cleanup(): Promise<void> {
    if (this.psProcess) {
      this.psProcess.kill();
      this.psProcess = null;
    }
  }
}
