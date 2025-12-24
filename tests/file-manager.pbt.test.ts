/**
 * Property-Based Tests for FileManager
 * Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { FileManager } from '../src/file-manager';
import { CommandRecord } from '../src/types';

describe('FileManager - Property-Based Tests', () => {
  const testDir = path.join(__dirname, 'temp-pbt-files');

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
   * Property 1: Initialization Creates Valid Structure
   * For any call to initialize, the resulting file SHALL contain valid JSON with empty history array
   * Validates: Requirements 1.1, 1.2
   * Feature: command-logging, Property 1: Initialization Creates Valid Structure
   */
  it('Property 1: Initialization Creates Valid Structure', async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 100 }), async (seed: number) => {
        const testFilePath = path.join(testDir, `test-init-${seed}.json`);
        const manager = new FileManager(testFilePath);

        await manager.initializeHistoryFile();

        // Verify file exists
        expect(fs.existsSync(testFilePath)).toBe(true);

        // Verify content is valid JSON
        const content = fs.readFileSync(testFilePath, 'utf-8');
        const parsed = JSON.parse(content);

        // Verify structure
        expect(parsed).toHaveProperty('history');
        expect(Array.isArray(parsed.history)).toBe(true);
        expect(parsed.history).toHaveLength(0);

        // Cleanup
        fs.unlinkSync(testFilePath);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: History File Append Idempotence
   * For any sequence of commands, appending each and reading back SHALL return all records in order
   * Validates: Requirements 4.1, 4.2
   * Feature: command-logging, Property 4: History File Append Idempotence
   */
  it('Property 4: History File Append Idempotence', async () => {
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
        fc.integer({ min: 0, max: 1000 }),
        async (records: CommandRecord[], seed: number) => {
          const testFilePath = path.join(testDir, `test-append-${seed}.json`);
          
          // Cleanup any existing file first
          if (fs.existsSync(testFilePath)) {
            fs.unlinkSync(testFilePath);
          }
          
          const manager = new FileManager(testFilePath);

          await manager.initializeHistoryFile(true);

          // Append all records
          for (const record of records) {
            await manager.appendCommand(record);
          }

          // Read back all records
          const readRecords = await manager.readHistory();

          // Verify all records are present in order
          expect(readRecords).toHaveLength(records.length);
          for (let i = 0; i < records.length; i++) {
            expect(readRecords[i]).toEqual(records[i]);
          }

          // Cleanup
          fs.unlinkSync(testFilePath);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: File Corruption Recovery
   * For any corrupted file, backup and reinitialize SHALL create a valid new file
   * Validates: Requirements 4.3
   * Feature: command-logging, Property 5: File Corruption Recovery
   */
  it('Property 5: File Corruption Recovery', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.integer({ min: 0, max: 1000 })
        ),
        async ([corruptedContent, seed]: [string, number]) => {
          const testFilePath = path.join(testDir, `test-corrupt-${seed}.json`);
          const manager = new FileManager(testFilePath);

          // Create a file with corrupted content
          fs.writeFileSync(testFilePath, corruptedContent, 'utf-8');

          // Backup the corrupted file
          await manager.backupCorruptedFile();

          // Verify original file is gone
          expect(fs.existsSync(testFilePath)).toBe(false);

          // Verify backup exists
          const backupFiles = fs.readdirSync(testDir).filter((f) => f.includes('backup'));
          expect(backupFiles.length).toBeGreaterThan(0);

          // Initialize new file
          await manager.initializeHistoryFile();

          // Verify new file is valid
          expect(fs.existsSync(testFilePath)).toBe(true);
          const content = fs.readFileSync(testFilePath, 'utf-8');
          const parsed = JSON.parse(content);
          expect(parsed.history).toEqual([]);

          // Cleanup
          fs.unlinkSync(testFilePath);
          const backupPath = path.join(testDir, backupFiles[0]);
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
