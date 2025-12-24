"use strict";
/**
 * File Manager for jyugemu history file operations
 * Handles reading, writing, and managing the jyugemu.json history file
 * Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3, 4.4
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManager = void 0;
const fs = __importStar(require("fs"));
/**
 * FileManager class handles all file operations for jyugemu history
 * Provides atomic writes, corruption recovery, and concurrent write safety
 */
class FileManager {
    constructor(historyFilePath = 'jyugemu.json') {
        this.LOCK_TIMEOUT = 5000; // 5 seconds
        this.historyFilePath = historyFilePath;
        this.lockFilePath = `${historyFilePath}.lock`;
    }
    /**
     * Initialize a new history file with empty history array
     * Validates: Requirements 1.1, 1.2
     *
     * @throws Error if file already exists and force is false
     */
    async initializeHistoryFile(force = false) {
        // Check if file already exists
        if (fs.existsSync(this.historyFilePath) && !force) {
            throw new Error(`History file already exists at ${this.historyFilePath}. Use --force to overwrite.`);
        }
        // If file exists and force is true, backup the existing file
        if (fs.existsSync(this.historyFilePath) && force) {
            await this.backupCorruptedFile();
        }
        const initialHistory = {
            history: [],
        };
        // Write atomically using temp file + rename
        await this.atomicWrite(initialHistory);
    }
    /**
     * Append a command record to the history file atomically
     * Validates: Requirements 4.1, 4.2, 4.4
     *
     * @param record - The command record to append
     */
    async appendCommand(record) {
        // Acquire lock
        await this.acquireLock();
        try {
            // Read current history
            let historyFile;
            if (fs.existsSync(this.historyFilePath)) {
                const content = fs.readFileSync(this.historyFilePath, 'utf-8');
                historyFile = JSON.parse(content);
            }
            else {
                historyFile = { history: [] };
            }
            // Append new record
            historyFile.history.push(record);
            // Write atomically
            await this.atomicWrite(historyFile);
        }
        finally {
            // Release lock
            await this.releaseLock();
        }
    }
    /**
     * Read history from file with optional limit
     * Validates: Requirements 4.1, 4.2
     *
     * @param limit - Maximum number of records to return (from end)
     * @returns Array of command records
     */
    async readHistory(limit) {
        if (!fs.existsSync(this.historyFilePath)) {
            return [];
        }
        try {
            const content = fs.readFileSync(this.historyFilePath, 'utf-8');
            const historyFile = JSON.parse(content);
            if (limit && limit > 0) {
                return historyFile.history.slice(-limit);
            }
            return historyFile.history;
        }
        catch (error) {
            // File is corrupted
            throw new Error(`Failed to read history file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Backup a corrupted file and initialize a new one
     * Validates: Requirements 4.3
     */
    async backupCorruptedFile() {
        if (!fs.existsSync(this.historyFilePath)) {
            return;
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${this.historyFilePath}.backup.${timestamp}`;
        try {
            fs.copyFileSync(this.historyFilePath, backupPath);
            fs.unlinkSync(this.historyFilePath);
        }
        catch (error) {
            throw new Error(`Failed to backup corrupted file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Atomically write history file using temp file + rename pattern
     * Ensures data integrity even if process crashes during write
     * Validates: Requirements 4.2
     *
     * @param historyFile - The history file object to write
     */
    async atomicWrite(historyFile) {
        const tempPath = `${this.historyFilePath}.tmp`;
        try {
            // Write to temporary file
            const content = JSON.stringify(historyFile, null, 2);
            fs.writeFileSync(tempPath, content, 'utf-8');
            // Atomically rename temp file to actual file
            fs.renameSync(tempPath, this.historyFilePath);
        }
        catch (error) {
            // Clean up temp file if it exists
            if (fs.existsSync(tempPath)) {
                try {
                    fs.unlinkSync(tempPath);
                }
                catch {
                    // Ignore cleanup errors
                }
            }
            throw new Error(`Failed to write history file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Acquire a lock file to prevent concurrent writes
     * Validates: Requirements 4.4
     */
    async acquireLock() {
        const startTime = Date.now();
        while (fs.existsSync(this.lockFilePath)) {
            if (Date.now() - startTime > this.LOCK_TIMEOUT) {
                throw new Error('Failed to acquire lock: timeout');
            }
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 10));
        }
        // Create lock file
        try {
            fs.writeFileSync(this.lockFilePath, process.pid.toString(), 'utf-8');
        }
        catch (error) {
            throw new Error(`Failed to create lock file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Release the lock file
     * Validates: Requirements 4.4
     */
    async releaseLock() {
        try {
            if (fs.existsSync(this.lockFilePath)) {
                fs.unlinkSync(this.lockFilePath);
            }
        }
        catch (error) {
            // Log but don't throw - lock cleanup failure shouldn't break the operation
            console.warn(`Warning: Failed to release lock file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
exports.FileManager = FileManager;
//# sourceMappingURL=file-manager.js.map