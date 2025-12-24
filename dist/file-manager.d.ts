/**
 * File Manager for jyugemu history file operations
 * Handles reading, writing, and managing the jyugemu.json history file
 * Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3, 4.4
 */
import { CommandRecord } from './types';
/**
 * FileManager class handles all file operations for jyugemu history
 * Provides atomic writes, corruption recovery, and concurrent write safety
 */
export declare class FileManager {
    private historyFilePath;
    private lockFilePath;
    private readonly LOCK_TIMEOUT;
    constructor(historyFilePath?: string);
    /**
     * Initialize a new history file with empty history array
     * Validates: Requirements 1.1, 1.2
     *
     * @throws Error if file already exists and force is false
     */
    initializeHistoryFile(force?: boolean): Promise<void>;
    /**
     * Append a command record to the history file atomically
     * Validates: Requirements 4.1, 4.2, 4.4
     *
     * @param record - The command record to append
     */
    appendCommand(record: CommandRecord): Promise<void>;
    /**
     * Read history from file with optional limit
     * Validates: Requirements 4.1, 4.2
     *
     * @param limit - Maximum number of records to return (from end)
     * @returns Array of command records
     */
    readHistory(limit?: number): Promise<CommandRecord[]>;
    /**
     * Backup a corrupted file and initialize a new one
     * Validates: Requirements 4.3
     */
    backupCorruptedFile(): Promise<void>;
    /**
     * Atomically write history file using temp file + rename pattern
     * Ensures data integrity even if process crashes during write
     * Validates: Requirements 4.2
     *
     * @param historyFile - The history file object to write
     */
    private atomicWrite;
    /**
     * Acquire a lock file to prevent concurrent writes
     * Validates: Requirements 4.4
     */
    private acquireLock;
    /**
     * Release the lock file
     * Validates: Requirements 4.4
     */
    private releaseLock;
}
//# sourceMappingURL=file-manager.d.ts.map