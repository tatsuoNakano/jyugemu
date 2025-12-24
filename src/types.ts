/**
 * Core type definitions for jyugemu command logging tool
 */

/**
 * Represents a single command execution record
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 */
export interface CommandRecord {
  /** ISO 8601 formatted timestamp of command execution */
  timestamp: string;

  /** Username of the user who executed the command */
  user: string;

  /** The command string that was executed */
  command: string;

  /** Exit code returned by the command */
  exit_code: number;

  /** Current working directory when command was executed */
  cwd: string;

  /** Optional note or metadata about the command */
  note?: string;
}

/**
 * Represents the structure of the jyugemu.json history file
 * Validates: Requirements 1.1, 1.2
 */
export interface HistoryFile {
  /** Array of command execution records */
  history: CommandRecord[];
}

/**
 * CLI command configuration
 */
export interface CLICommand {
  command: 'init' | 'start' | 'history' | 'help';
  options: {
    limit?: number;
    filter?: string;
    force?: boolean;
  };
}

/**
 * Session configuration for monitored PowerShell session
 */
export interface SessionConfig {
  sessionId: string;
  historyFilePath: string;
}
