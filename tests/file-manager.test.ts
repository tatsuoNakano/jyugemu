/**
 * Unit tests for FileManager
 * Validates: Requirements 1.1, 1.2, 4.1, 4.2, 4.3, 4.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileManager } from '../src/file-manager';
import { CommandRecord, HistoryFile } from '../src/types';

describe('FileManager', () => {
  const testDir = path.join(__dirname, 'temp-test-files');
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
          // Ignore cleanup errors (e.g., lock files)
        }
      });
      try {
        fs.rmdirSync(testDir);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('initializeHistoryFile', () => {
    it('should create a new history file with empty history array', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      expect(fs.existsSync(testFilePath)).toBe(true);
      const content = fs.readFileSync(testFilePath, 'utf-8');
      const parsed: HistoryFile = JSON.parse(content);
      expect(parsed.history).toEqual([]);
    });

    it('should throw error if file already exists and force is false', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const manager2 = new FileManager(testFilePath);
      await expect(manager2.initializeHistoryFile(false)).rejects.toThrow(
        /History file already exists/
      );
    });

    it('should overwrite existing file when force is true', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      // Add some data
      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };
      await manager.appendCommand(record);

      // Reinitialize with force
      const manager2 = new FileManager(testFilePath);
      await manager2.initializeHistoryFile(true);

      const content = fs.readFileSync(testFilePath, 'utf-8');
      const parsed: HistoryFile = JSON.parse(content);
      expect(parsed.history).toEqual([]);
    });

    it('should create backup when overwriting with force', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const manager2 = new FileManager(testFilePath);
      await manager2.initializeHistoryFile(true);

      // Check that backup file was created
      const backupFiles = fs.readdirSync(testDir).filter((f) => f.includes('backup'));
      expect(backupFiles.length).toBeGreaterThan(0);
    });
  });

  describe('appendCommand', () => {
    it('should append a command record to history', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };

      await manager.appendCommand(record);

      const history = await manager.readHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(record);
    });

    it('should append multiple records in order', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const record1: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'user1',
        command: 'cmd1',
        exit_code: 0,
        cwd: '/test1',
      };

      const record2: CommandRecord = {
        timestamp: '2024-01-01T00:00:01Z',
        user: 'user2',
        command: 'cmd2',
        exit_code: 1,
        cwd: '/test2',
      };

      await manager.appendCommand(record1);
      await manager.appendCommand(record2);

      const history = await manager.readHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(record1);
      expect(history[1]).toEqual(record2);
    });

    it('should create history file if it does not exist', async () => {
      const manager = new FileManager(testFilePath);

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };

      await manager.appendCommand(record);

      expect(fs.existsSync(testFilePath)).toBe(true);
      const history = await manager.readHistory();
      expect(history).toHaveLength(1);
    });
  });

  describe('readHistory', () => {
    it('should return empty array if file does not exist', async () => {
      const manager = new FileManager(testFilePath);
      const history = await manager.readHistory();
      expect(history).toEqual([]);
    });

    it('should read all records from history file', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const records: CommandRecord[] = [
        {
          timestamp: '2024-01-01T00:00:00Z',
          user: 'user1',
          command: 'cmd1',
          exit_code: 0,
          cwd: '/test1',
        },
        {
          timestamp: '2024-01-01T00:00:01Z',
          user: 'user2',
          command: 'cmd2',
          exit_code: 1,
          cwd: '/test2',
        },
      ];

      for (const record of records) {
        await manager.appendCommand(record);
      }

      const history = await manager.readHistory();
      expect(history).toHaveLength(2);
      expect(history).toEqual(records);
    });

    it('should respect limit parameter', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      for (let i = 0; i < 5; i++) {
        const record: CommandRecord = {
          timestamp: `2024-01-01T00:00:0${i}Z`,
          user: `user${i}`,
          command: `cmd${i}`,
          exit_code: 0,
          cwd: `/test${i}`,
        };
        await manager.appendCommand(record);
      }

      const history = await manager.readHistory(2);
      expect(history).toHaveLength(2);
      // Should return the last 2 records
      expect(history[0].command).toBe('cmd3');
      expect(history[1].command).toBe('cmd4');
    });

    it('should throw error if file is corrupted', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      // Corrupt the file
      fs.writeFileSync(testFilePath, 'invalid json {', 'utf-8');

      await expect(manager.readHistory()).rejects.toThrow(/Failed to read history file/);
    });
  });

  describe('backupCorruptedFile', () => {
    it('should create a backup of existing file', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };
      await manager.appendCommand(record);

      await manager.backupCorruptedFile();

      // Original file should be deleted
      expect(fs.existsSync(testFilePath)).toBe(false);

      // Backup file should exist
      const backupFiles = fs.readdirSync(testDir).filter((f) => f.includes('backup'));
      expect(backupFiles.length).toBeGreaterThan(0);

      // Backup file should contain the original data
      const backupPath = path.join(testDir, backupFiles[0]);
      const content = fs.readFileSync(backupPath, 'utf-8');
      const parsed: HistoryFile = JSON.parse(content);
      expect(parsed.history).toHaveLength(1);
      expect(parsed.history[0]).toEqual(record);
    });

    it('should not throw error if file does not exist', async () => {
      const manager = new FileManager(testFilePath);
      await expect(manager.backupCorruptedFile()).resolves.not.toThrow();
    });
  });

  describe('atomic writes', () => {
    it('should write valid JSON that can be parsed', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };
      await manager.appendCommand(record);

      const content = fs.readFileSync(testFilePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should not leave temporary files after write', async () => {
      const manager = new FileManager(testFilePath);
      await manager.initializeHistoryFile();

      const record: CommandRecord = {
        timestamp: '2024-01-01T00:00:00Z',
        user: 'testuser',
        command: 'echo test',
        exit_code: 0,
        cwd: '/test',
      };
      await manager.appendCommand(record);

      const files = fs.readdirSync(testDir);
      const tmpFiles = files.filter((f) => f.includes('.tmp'));
      expect(tmpFiles).toHaveLength(0);
    });
  });
});
