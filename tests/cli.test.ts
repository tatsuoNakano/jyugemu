/**
 * Unit tests for CLI command parser
 * Validates: Requirements 1.1, 2.1
 */

import { parseArgs, createCLIParser } from '../src/cli';

describe('CLI Command Parser', () => {
  describe('parseArgs', () => {
    it('should parse init command without options', () => {
      const result = parseArgs(['init']);
      expect(result.command).toBe('init');
      expect(result.options.force).toBe(false);
    });

    it('should parse init command with --force option', () => {
      const result = parseArgs(['init', '--force']);
      expect(result.command).toBe('init');
      expect(result.options.force).toBe(true);
    });

    it('should parse init command with -f short option', () => {
      const result = parseArgs(['init', '-f']);
      expect(result.command).toBe('init');
      expect(result.options.force).toBe(true);
    });

    it('should parse start command', () => {
      const result = parseArgs(['start']);
      expect(result.command).toBe('start');
    });

    it('should parse history command without options', () => {
      const result = parseArgs(['history']);
      expect(result.command).toBe('history');
      expect(result.options.limit).toBe(50);
      expect(result.options.filter).toBeUndefined();
    });

    it('should parse history command with --limit option', () => {
      const result = parseArgs(['history', '--limit', '100']);
      expect(result.command).toBe('history');
      expect(result.options.limit).toBe(100);
    });

    it('should parse history command with -l short option', () => {
      const result = parseArgs(['history', '-l', '25']);
      expect(result.command).toBe('history');
      expect(result.options.limit).toBe(25);
    });

    it('should parse history command with --filter option', () => {
      const result = parseArgs(['history', '--filter', 'npm']);
      expect(result.command).toBe('history');
      expect(result.options.filter).toBe('npm');
    });

    it('should parse history command with -f short option for filter', () => {
      const result = parseArgs(['history', '-f', 'test']);
      expect(result.command).toBe('history');
      expect(result.options.filter).toBe('test');
    });

    it('should parse history command with both limit and filter', () => {
      const result = parseArgs(['history', '--limit', '20', '--filter', 'build']);
      expect(result.command).toBe('history');
      expect(result.options.limit).toBe(20);
      expect(result.options.filter).toBe('build');
    });

    it('should default to help command when no command provided', () => {
      const result = parseArgs([]);
      expect(result.command).toBe('help');
    });

    it('should throw error for unknown command', () => {
      expect(() => parseArgs(['unknown'])).toThrow('Unknown command: unknown');
    });

    it('should parse limit as integer', () => {
      const result = parseArgs(['history', '--limit', '42']);
      expect(result.options.limit).toBe(42);
      expect(typeof result.options.limit).toBe('number');
    });

    it('should handle multiple options in any order', () => {
      const result = parseArgs(['history', '--filter', 'git', '--limit', '15']);
      expect(result.command).toBe('history');
      expect(result.options.limit).toBe(15);
      expect(result.options.filter).toBe('git');
    });
  });

  describe('createCLIParser', () => {
    it('should create a valid Command instance', () => {
      const program = createCLIParser();
      expect(program).toBeDefined();
      expect(program.name()).toBe('jyugemu');
    });

    it('should have init command defined', () => {
      const program = createCLIParser();
      const initCmd = program.commands.find((cmd) => cmd.name() === 'init');
      expect(initCmd).toBeDefined();
    });

    it('should have start command defined', () => {
      const program = createCLIParser();
      const startCmd = program.commands.find((cmd) => cmd.name() === 'start');
      expect(startCmd).toBeDefined();
    });

    it('should have history command defined', () => {
      const program = createCLIParser();
      const historyCmd = program.commands.find((cmd) => cmd.name() === 'history');
      expect(historyCmd).toBeDefined();
    });
  });
});
