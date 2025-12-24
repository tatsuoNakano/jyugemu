/**
 * Session Manager for jyugemu PowerShell session monitoring
 * Handles PowerShell subprocess creation, PSReadLine hook setup, and command capture
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */
import { CommandRecord, SessionConfig } from './types';
/**
 * SessionManager class handles PowerShell session monitoring and command capture
 * Provides methods to start monitored sessions, setup PSReadLine hooks, and capture commands
 */
export declare class SessionManager {
    private sessionId;
    private historyFilePath;
    private fileManager;
    private psProcess;
    private readonly PSREADLINE_HOOK_TIMEOUT;
    constructor(config: SessionConfig);
    /**
     * Start a monitored PowerShell session with command logging
     * Validates: Requirements 2.1, 2.2, 2.3, 2.4
     */
    startMonitoredSession(): Promise<void>;
    /**
     * Setup PSReadLine hook for command monitoring
     */
    setupPSReadLineHook(sessionId: string): Promise<string>;
    /**
     * Capture command execution information
     */
    captureCommand(command: string, exitCode: number, cwd: string): Promise<CommandRecord>;
    /**
     * Generate PSReadLine hook script for command monitoring
     */
    private generatePSReadLineHookScript;
    private verifyPowerShellAvailable;
    private validateCommandRecord;
    private isValidISO8601;
    private storeScriptPath;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=session-manager.d.ts.map