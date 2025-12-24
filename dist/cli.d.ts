/**
 * CLI Command Parser for jyugemu
 * Validates: Requirements 1.1, 2.1, 5.1
 */
import { Command } from 'commander';
import { CLICommand } from './types';
/**
 * Creates and configures the CLI command parser
 * Validates: Requirements 1.1, 2.1, 5.1
 */
export declare function createCLIParser(): Command;
/**
 * Parses command line arguments and returns a CLICommand object
 * Validates: Requirements 1.1, 2.1, 5.1
 *
 * @param argv - Command line arguments (typically process.argv.slice(2))
 * @returns Parsed CLI command with options
 */
export declare function parseArgs(argv: string[]): CLICommand;
/**
 * Displays help information
 */
export declare function displayHelp(): void;
//# sourceMappingURL=cli.d.ts.map