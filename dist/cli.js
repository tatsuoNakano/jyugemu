"use strict";
/**
 * CLI Command Parser for jyugemu
 * Validates: Requirements 1.1, 2.1, 5.1
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCLIParser = createCLIParser;
exports.parseArgs = parseArgs;
exports.displayHelp = displayHelp;
const commander_1 = require("commander");
/**
 * Creates and configures the CLI command parser
 * Validates: Requirements 1.1, 2.1, 5.1
 */
function createCLIParser() {
    const program = new commander_1.Command();
    program
        .name('jyugemu')
        .description('Command logging tool for Windows PowerShell')
        .version('0.1.0');
    // jyugemu init command
    program
        .command('init')
        .description('Initialize a new command history file in the current directory')
        .option('-f, --force', 'Overwrite existing jyugemu.json without confirmation')
        .action(() => {
        // Action will be handled by executeCommand
    });
    // jyugemu start command
    program
        .command('start')
        .description('Start a monitored PowerShell session with command logging')
        .action(() => {
        // Action will be handled by executeCommand
    });
    // jyugemu history command
    program
        .command('history')
        .description('Display command history')
        .option('-l, --limit <number>', 'Limit the number of history entries to display', '50')
        .option('-f, --filter <string>', 'Filter history entries by command substring')
        .action(() => {
        // Action will be handled by executeCommand
    });
    return program;
}
/**
 * Parses command line arguments and returns a CLICommand object
 * Validates: Requirements 1.1, 2.1, 5.1
 *
 * @param argv - Command line arguments (typically process.argv.slice(2))
 * @returns Parsed CLI command with options
 */
function parseArgs(argv) {
    // Handle empty arguments
    if (argv.length === 0) {
        return {
            command: 'help',
            options: {},
        };
    }
    const commandName = argv[0];
    // Validate command name
    if (!['init', 'start', 'history', 'help'].includes(commandName)) {
        throw new Error(`Unknown command: ${commandName}`);
    }
    // Extract options based on command
    let options = {};
    if (commandName === 'init') {
        options.force = argv.includes('--force') || argv.includes('-f');
    }
    else if (commandName === 'history') {
        // Parse limit option
        const limitIndex = argv.indexOf('--limit') !== -1 ? argv.indexOf('--limit') : argv.indexOf('-l');
        if (limitIndex !== -1 && limitIndex + 1 < argv.length) {
            const limitValue = parseInt(argv[limitIndex + 1], 10);
            options.limit = isNaN(limitValue) ? 50 : limitValue;
        }
        else {
            options.limit = 50;
        }
        // Parse filter option
        const filterIndex = argv.indexOf('--filter') !== -1 ? argv.indexOf('--filter') : argv.indexOf('-f');
        if (filterIndex !== -1 && filterIndex + 1 < argv.length) {
            options.filter = argv[filterIndex + 1];
        }
    }
    return {
        command: commandName,
        options,
    };
}
/**
 * Displays help information
 */
function displayHelp() {
    const program = createCLIParser();
    program.outputHelp();
}
//# sourceMappingURL=cli.js.map