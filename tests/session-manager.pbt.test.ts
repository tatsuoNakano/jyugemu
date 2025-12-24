/**
 * Property-Based Tests for SessionManager
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5
 */

import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import dayjs from 'dayjs';
import { SessionManager } from '../src/session-manager';

describe('SessionManager - Property-Based Tests', () => {
  const testDir = path.join(__dirname, 'temp-session-pbt-files');

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
   * Property 2: Command Record Completeness
   * For any command executed, the recorded CommandRecord SHALL contain all required fields
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
   * Feature: command-logging, Property 2: Command Record Completeness
   */
  it('Property 2: Command Record Completeness', async () => {
    const commandArbitrary = fc.record({
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        commandArbitrary,
        fc.integer({ min: 0, max: 1000 }),
        async (cmdData, seed) => {
          const historyFilePath = path.join(testDir, `history-${seed}.json`);
          const sessionConfig = {
            sessionId: `test-session-${seed}`,
            historyFilePath: historyFilePath,
          };

          const manager = new SessionManager(sessionConfig);

          // Cleanup any existing file first
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }

          // Initialize history file
          const fileManager = require('../src/file-manager').FileManager;
          const fm = new fileManager(historyFilePath);
          await fm.initializeHistoryFile(true);

          // Capture a command
          const record = await manager.captureCommand(
            cmdData.command,
            cmdData.exit_code,
            cmdData.cwd
          );

          // Verify all required fields are present
          expect(record).toHaveProperty('timestamp');
          expect(record).toHaveProperty('user');
          expect(record).toHaveProperty('command');
          expect(record).toHaveProperty('exit_code');
          expect(record).toHaveProperty('cwd');

          // Verify no field is undefined or null
          expect(record.timestamp).toBeDefined();
          expect(record.user).toBeDefined();
          expect(record.command).toBeDefined();
          expect(record.exit_code).toBeDefined();
          expect(record.cwd).toBeDefined();

          // Verify field values match input
          expect(record.command).toBe(cmdData.command);
          expect(record.exit_code).toBe(cmdData.exit_code);
          expect(record.cwd).toBe(cmdData.cwd);

          // Cleanup
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 3: Timestamp Format Consistency
   * For any CommandRecord, the timestamp field SHALL be in valid ISO 8601 format
   * Validates: Requirements 3.2
   * Feature: command-logging, Property 3: Timestamp Format Consistency
   */
  it('Property 3: Timestamp Format Consistency', async () => {
    const commandArbitrary = fc.record({
      command: fc.string({ minLength: 1, maxLength: 200 }),
      exit_code: fc.integer({ min: 0, max: 255 }),
      cwd: fc.string({ minLength: 1, maxLength: 100 }),
    });

    await fc.assert(
      fc.asyncProperty(
        commandArbitrary,
        fc.integer({ min: 0, max: 1000 }),
        async (cmdData, seed) => {
          const historyFilePath = path.join(testDir, `history-ts-${seed}.json`);
          const sessionConfig = {
            sessionId: `test-session-ts-${seed}`,
            historyFilePath: historyFilePath,
          };

          const manager = new SessionManager(sessionConfig);

          // Cleanup any existing file first
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }

          // Initialize history file
          const fileManager = require('../src/file-manager').FileManager;
          const fm = new fileManager(historyFilePath);
          await fm.initializeHistoryFile(true);

          // Capture a command
          const record = await manager.captureCommand(
            cmdData.command,
            cmdData.exit_code,
            cmdData.cwd
          );

          // Verify timestamp is in ISO 8601 format
          const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
          expect(iso8601Regex.test(record.timestamp)).toBe(true);

          // Verify timestamp can be parsed by dayjs
          const parsed = dayjs(record.timestamp);
          expect(parsed.isValid()).toBe(true);

          // Cleanup
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Exit Code Accuracy
   * For any command with a specific exit code, the recorded exit_code SHALL match the input
   * Validates: Requirements 3.4
   * Feature: command-logging, Property 7: Exit Code Accuracy
   */
  it('Property 7: Exit Code Accuracy', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.integer({ min: 0, max: 255 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.integer({ min: 0, max: 1000 }),
        async (command, exitCode, cwd, seed) => {
          const historyFilePath = path.join(testDir, `history-exit-${seed}.json`);
          const sessionConfig = {
            sessionId: `test-session-exit-${seed}`,
            historyFilePath: historyFilePath,
          };

          const manager = new SessionManager(sessionConfig);

          // Cleanup any existing file first
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }

          // Initialize history file
          const fileManager = require('../src/file-manager').FileManager;
          const fm = new fileManager(historyFilePath);
          await fm.initializeHistoryFile(true);

          // Capture a command with specific exit code
          const record = await manager.captureCommand(command, exitCode, cwd);

          // Verify exit code matches
          expect(record.exit_code).toBe(exitCode);

          // Cleanup
          if (fs.existsSync(historyFilePath)) {
            fs.unlinkSync(historyFilePath);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
