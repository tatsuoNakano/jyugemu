/**
 * Property-Based Tests for HistoryManager
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { HistoryManager } from '../src/history-manager';
import { CommandRecord } from '../src/types';

describe('HistoryManager - Property-Based Tests', () => {
  const testDir = path.join(__dirname, 'temp-history-pbt-files');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      files.forEach((file) => {
        const filePath = path.join(testDir, file);
        try {
          fs.unlinkSync(filePath);
        } catch {
          // Ignore cleanup errors
        }
      });
      try {
        fs.rmdirSync(testDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  /**
   * Property 6: History Display Filtering
   * For any filter string and history records, filtered results SHALL only include records
   * where the command field contains the filter string (case-insensitive)
   * Validates: Requirements 5.3, 5.4
   * Feature: command-logging, Property 6: History Display Filtering
   */
  it('Property 6: History Display Filtering', async () => {
    const commandRecordArbitrary = fc.record({
      timestamp: fc.string().map(() => new Date().toISOString()),
      user: fc.string({ minLength: 1, maxLength: 50 }),
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(commandRecordArbitrary, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (records: CommandRecord[], filterString: string) => {
          const manager = new HistoryManager();

          // Filter the records
          const filtered = manager.filterCommands(records, filterString);

          // Verify all filtered records contain the filter string (case-insensitive)
          const lowerFilter = filterString.toLowerCase();
          for (const record of filtered) {
            expect(record.command.toLowerCase()).toContain(lowerFilter);
          }

          // Verify no records are missing that should match
          for (const record of records) {
            if (record.command.toLowerCase().includes(lowerFilter)) {
              expect(filtered).toContainEqual(record);
            } else {
              expect(filtered).not.toContainEqual(record);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6b: Empty Filter Returns All Records
   * For any set of records, filtering with empty string SHALL return all records unchanged
   * Validates: Requirements 5.3, 5.4
   * Feature: command-logging, Property 6b: Empty Filter Returns All Records
   */
  it('Property 6b: Empty Filter Returns All Records', async () => {
    const commandRecordArbitrary = fc.record({
      timestamp: fc.string().map(() => new Date().toISOString()),
      user: fc.string({ minLength: 1, maxLength: 50 }),
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(commandRecordArbitrary, { minLength: 0, maxLength: 20 }),
        async (records: CommandRecord[]) => {
          const manager = new HistoryManager();

          // Filter with empty string
          const filtered = manager.filterCommands(records, '');

          // Should return all records
          expect(filtered).toEqual(records);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6c: Filter is Case-Insensitive
   * For any records and filter string, filtering SHALL be case-insensitive
   * Validates: Requirements 5.3, 5.4
   * Feature: command-logging, Property 6c: Filter is Case-Insensitive
   */
  it('Property 6c: Filter is Case-Insensitive', async () => {
    const commandRecordArbitrary = fc.record({
      timestamp: fc.string().map(() => new Date().toISOString()),
      user: fc.string({ minLength: 1, maxLength: 50 }),
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(commandRecordArbitrary, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (records: CommandRecord[], filterString: string) => {
          const manager = new HistoryManager();

          // Filter with original case
          const filtered1 = manager.filterCommands(records, filterString);

          // Filter with uppercase
          const filtered2 = manager.filterCommands(records, filterString.toUpperCase());

          // Filter with lowercase
          const filtered3 = manager.filterCommands(records, filterString.toLowerCase());

          // All should return the same results
          expect(filtered1).toEqual(filtered2);
          expect(filtered1).toEqual(filtered3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Format Output Contains All Required Fields
   * For any set of records, formatted output SHALL contain all required fields
   * (timestamp, command, exit_code, cwd, user)
   * Validates: Requirements 5.1, 5.2
   * Feature: command-logging, Property 7: Format Output Contains All Required Fields
   */
  it('Property 7: Format Output Contains All Required Fields', async () => {
    const commandRecordArbitrary = fc.record({
      timestamp: fc.string().map(() => new Date().toISOString()),
      user: fc.string({ minLength: 1, maxLength: 50 }),
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        fc.array(commandRecordArbitrary, { minLength: 1, maxLength: 10 }),
        async (records: CommandRecord[]) => {
          const manager = new HistoryManager();

          const formatted = manager.formatForDisplay(records);

          // Verify all required field names are in the output
          expect(formatted).toContain('Timestamp');
          expect(formatted).toContain('Command');
          expect(formatted).toContain('Exit Code');
          expect(formatted).toContain('Directory');
          expect(formatted).toContain('User');

          // Verify all record data is in the output
          for (const record of records) {
            expect(formatted).toContain(record.timestamp);
            expect(formatted).toContain(record.command);
            expect(formatted).toContain(record.exit_code.toString());
            expect(formatted).toContain(record.cwd);
            expect(formatted).toContain(record.user);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Empty Records Format Correctly
   * For empty record array, formatForDisplay SHALL return appropriate message
   * Validates: Requirements 5.1, 5.2
   * Feature: command-logging, Property 8: Empty Records Format Correctly
   */
  it('Property 8: Empty Records Format Correctly', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constant(null), async () => {
        const manager = new HistoryManager();

        const formatted = manager.formatForDisplay([]);

        expect(formatted).toBe('No command history found.');
      }),
      { numRuns: 100 }
    );
  });
});
