/**
 * History Manager for jyugemu command history display and filtering
 * Handles displaying, filtering, and formatting command history
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import { CommandRecord } from './types';
import { FileManager } from './file-manager';

/**
 * HistoryManager class handles history display, filtering, and formatting
 * Provides methods to display history with optional filtering and limiting
 */
export class HistoryManager {
  private fileManager: FileManager;

  constructor(historyFilePath: string = 'jyugemu.json') {
    this.fileManager = new FileManager(historyFilePath);
  }

  /**
   * Display command history with optional filtering and limiting
   * Validates: Requirements 5.1, 5.2, 5.3, 5.4
   *
   * @param limit - Maximum number of entries to display (default: 50)
   * @param filter - Optional filter string to match against commands
   */
  async displayHistory(limit: number = 50, filter?: string): Promise<void> {
    try {
      // Read all history from file
      const allRecords = await this.fileManager.readHistory();

      // Apply filter if provided
      let records = filter ? this.filterCommands(allRecords, filter) : allRecords;

      // Apply limit (get last N records)
      if (limit > 0 && records.length > limit) {
        records = records.slice(-limit);
      }

      // Format and display
      const formatted = this.formatForDisplay(records);
      console.log(formatted);
    } catch (error) {
      throw new Error(
        `Failed to display history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Filter command records by a search string
   * Validates: Requirements 5.3, 5.4
   *
   * @param records - Array of command records to filter
   * @param filter - Filter string to match against command field (case-insensitive)
   * @returns Filtered array of command records
   */
  filterCommands(records: CommandRecord[], filter: string): CommandRecord[] {
    if (!filter || filter.trim().length === 0) {
      return records;
    }

    const lowerFilter = filter.toLowerCase();
    return records.filter((record) => record.command.toLowerCase().includes(lowerFilter));
  }

  /**
   * Format command records for display
   * Validates: Requirements 5.1, 5.2
   *
   * @param records - Array of command records to format
   * @returns Formatted string for display
   */
  formatForDisplay(records: CommandRecord[]): string {
    if (records.length === 0) {
      return 'No command history found.';
    }

    // Calculate column widths for alignment
    const maxTimestampLen = Math.max(
      ...records.map((r) => r.timestamp.length),
      'Timestamp'.length
    );
    const maxCommandLen = Math.max(
      ...records.map((r) => r.command.length),
      'Command'.length
    );
    const maxExitCodeLen = Math.max(
      ...records.map((r) => r.exit_code.toString().length),
      'Exit Code'.length
    );
    const maxCwdLen = Math.max(...records.map((r) => r.cwd.length), 'Directory'.length);

    // Build header
    const header = [
      'Timestamp'.padEnd(maxTimestampLen),
      'Command'.padEnd(maxCommandLen),
      'Exit Code'.padEnd(maxExitCodeLen),
      'Directory'.padEnd(maxCwdLen),
      'User',
    ].join(' | ');

    // Build separator
    const separator = [
      '-'.repeat(maxTimestampLen),
      '-'.repeat(maxCommandLen),
      '-'.repeat(maxExitCodeLen),
      '-'.repeat(maxCwdLen),
      '-'.repeat(4), // "User" length
    ].join('-+-');

    // Build rows
    const rows = records.map((record) => {
      return [
        record.timestamp.padEnd(maxTimestampLen),
        record.command.padEnd(maxCommandLen),
        record.exit_code.toString().padEnd(maxExitCodeLen),
        record.cwd.padEnd(maxCwdLen),
        record.user,
      ].join(' | ');
    });

    // Combine all parts
    return [header, separator, ...rows].join('\n');
  }
}
