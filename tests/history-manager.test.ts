/**
 * Unit tests for HistoryManager
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { HistoryManager } from '../src/history-manager';
import { FileManager } from '../src/file-manager';
import { CommandRecord } from '../src/types';

describe('HistoryManager', () => {
  const testDir = path.join(__dirname, 'temp-history-test-files');
  const testFilePath = path.join(testDir, 'test-jyugemu.json');

  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
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

  describe('filterCommands', () => {
    it('should return all records when filter is empty', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'echo hello',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'ls -la',
          exit_code: 0,
          cwd: '/test2',
        },
      ];

      const filtered = manager.filterCommands(records, '');
      expect(filtered).toEqual(records);
    });

    it('should filter commands by substring match (case-insensitive)', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'echo hello',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'ls -la',
          exit_code: 0,
          cwd: '/test2',
        },
        {
          timestamp: '2024-01-01T00:00:02Z',
          user: 'user3',
          command: 'echo world',
          exit_code: 0,
          cwd: '/test3',
        },
      ];

      const filtered = manager.filterCommands(records, 'echo');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].command).toBe('echo hello');
      expect(filtered[1].command).toBe('echo world');
    });

    it('should perform case-insensitive filtering', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'Echo Hello',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'ls -la',
          exit_code: 0,
          cwd: '/test2',
        },
      ];

      const filtered = manager.filterCommands(records, 'ECHO');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].command).toBe('Echo Hello');
    });

    it('should return empty array when no matches found', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'echo hello',
          exit_code: 0,
          cwd: '/test1',
        },
      ];

      const filtered = manager.filterCommands(records, 'nonexistent');
      expect(filtered).toHaveLength(0);
    });
  });

  describe('formatForDisplay', () => {
    it('should return message for empty records', () => {
      const manager = new HistoryManager(testFilePath);
      const formatted = manager.formatForDisplay([]);
      expect(formatted).toBe('No command history found.');
    });

    it('should format single record correctly', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'testuser',
          command: 'echo test',
          exit_code: 0,
          cwd: '/home/user',
        },
      ];

      const formatted = manager.formatForDisplay(records);
      expect(formatted).toContain('Timestamp');
      expect(formatted).toContain('Command');
      expect(formatted).toContain('Exit Code');
      expect(formatted).toContain('Directory');
      expect(formatted).toContain('User');
      expect(formatted).toContain('2024-01-01T00:00:00Z');
      expect(formatted).toContain('echo test');
      expect(formatted).toContain('0');
      expect(formatted).toContain('/home/user');
      expect(formatted).toContain('testuser');
    });

    it('should format multiple records with proper alignment', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'echo hello',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'ls -la /very/long/path',
          exit_code: 1,
          cwd: '/very/long/directory/path',
        },
      ];

      const formatted = manager.formatForDisplay(records);
      const lines = formatted.split('\n');

      // Should have header, separator, and 2 data rows
      expect(lines.length).toBeGreaterThanOrEqual(4);

      // Check that all records are present
      expect(formatted).toContain('echo hello');
      expect(formatted).toContain('ls -la /very/long/path');
      expect(formatted).toContain('user1');
      expect(formatted).toContain('user2');
    });

    it('should include all required fields in output', () => {
      const manager = new HistoryManager(testFilePath);
      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T12:34:56Z',
          user: 'admin',
          command: 'Get-Process',
          exit_code: 0,
          cwd: 'C:\\Windows',
        },
      ];

      const formatted = manager.formatForDisplay(records);
      expect(formatted).toContain('2024-01-01T12:34:56Z');
      expect(formatted).toContain('Get-Process');
      expect(formatted).toContain('0');
      expect(formatted).toContain('C:\\Windows');
      expect(formatted).toContain('admin');
    });
  });

  describe('displayHistory', () => {
    it('should display history from file', async () => {
      const fileManager = new FileManager(testFilePath);
      await fileManager.initializeHistoryFile();

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };
      await fileManager.appendCommand(record);

      const manager = new HistoryManager(testFilePath);

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.displayHistory(50);

      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('echo test');
      expect(output).toContain('testuser');

      consoleSpy.mockRestore();
    });

    it('should apply limit when displaying history', async () => {
      const fileManager = new FileManager(testFilePath);
      await fileManager.initializeHistoryFile();

      // Add 5 records
      for (let i = 0; i < 5; i++) {
        const record: CommandRecord = {
          timestamp: `2024-01-01T00:00:0${i}Z`,
          user: `user${i}`,
          command: `cmd${i}`,
          exit_code: 0,
          cwd: `/test${i}`,
        };
        await fileManager.appendCommand(record);
      }

      const manager = new HistoryManager(testFilePath);

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.displayHistory(2);

      const output = consoleSpy.mock.calls[0][0];
      // Should only contain the last 2 commands
      expect(output).toContain('cmd3');
      expect(output).toContain('cmd4');
      expect(output).not.toContain('cmd0');
      expect(output).not.toContain('cmd1');

      consoleSpy.mockRestore();
    });

    it('should apply filter when displaying history', async () => {
      const fileManager = new FileManager(testFilePath);
      await fileManager.initializeHistoryFile();

      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'echo hello',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'ls -la',
          exit_code: 0,
          cwd: '/test2',
        },
        {
          timestamp: '2024-01-01T00:00:02Z',
          user: 'user3',
          command: 'echo world',
          exit_code: 0,
          cwd: '/test3',
        },
      ];

      for (const record of records) {
        await fileManager.appendCommand(record);
      }

      const manager = new HistoryManager(testFilePath);

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.displayHistory(50, 'echo');

      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('echo hello');
      expect(output).toContain('echo world');
      expect(output).not.toContain('ls -la');

      consoleSpy.mockRestore();
    });

    it('should display message when no history found', async () => {
      const manager = new HistoryManager(testFilePath);

      // Capture console output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await manager.displayHistory(50);

      expect(consoleSpy).toHaveBeenCalledWith('No command history found.');

      consoleSpy.mockRestore();
    });

    it('should throw error if file read fails', async () => {
      const manager = new HistoryManager(testFilePath);

      // Create a corrupted file
      fs.mkdirSync(testDir, { recursive: true });
      fs.writeFileSync(testFilePath, 'invalid json {', 'utf-8');

      await expect(manager.displayHistory(50)).rejects.toThrow(/Failed to display history/);
    });
  });
});
