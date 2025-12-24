/**
 * History Manager for jyugemu command history display and filtering
 * Handles displaying, filtering, and formatting command history
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */
import { CommandRecord } from './types';
/**
 * HistoryManager class handles history display, filtering, and formatting
 * Provides methods to display history with optional filtering and limiting
 */
export declare class HistoryManager {
    private fileManager;
    constructor(historyFilePath?: string);
    /**
     * Display command history with optional filtering and limiting
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4
     *
     * @param limit - Maximum number of entries to display (default: 50)
     * @param filter - Optional filter string to match against commands
     */
    displayHistory(limit?: number, filter?: string): Promise<void>;
    /**
     * Filter command records by a search string
     * Validates: Requirements 5.3, 5.4
     *
     * @param records - Array of command records to filter
     * @param filter - Filter string to match against command field (case-insensitive)
     * @returns Filtered array of command records
     */
    filterCommands(records: CommandRecord[], filter: string): CommandRecord[];
    /**
     * Format command records for display
     * Validates: Requirements 5.1, 5.2
     *
     * @param records - Array of command records to format
     * @returns Formatted string for display
     */
    formatForDisplay(records: CommandRecord[]): string;
}
//# sourceMappingURL=history-manager.d.ts.map