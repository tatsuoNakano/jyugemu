#!/usr/bin/env node
"use strict";
/**
 * Main entry point for jyugemu CLI tool
 * Integrates CLI parser, file manager, session manager, and history manager
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const readline = __importStar(require("readline"));
const cli_1 = require("./cli");
const file_manager_1 = require("./file-manager");
const session_manager_1 = require("./session-manager");
const history_manager_1 = require("./history-manager");
/**
 * Main application class that orchestrates all components
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2
 */
class JyugemuApp {
    constructor(historyFilePath = 'jyugemu.json') {
        this.historyFilePath = path.resolve(historyFilePath);
    }
    /**
     * Handle the 'init' command
     * Validates: Requirements 1.1, 1.2, 1.3, 1.4
     *
     * @param force - Whether to force overwrite existing file
     */
    async handleInit(force = false) {
        const fileManager = new file_manager_1.FileManager(this.historyFilePath);
        try {
            // Check if file already exists
            if (fs.existsSync(this.historyFilePath) && !force) {
                // Prompt user for confirmation
                const confirmed = await this.promptUserConfirmation(`History file already exists at ${this.historyFilePath}. Overwrite? (y/n): `);
                if (!confirmed) {
                    console.log('Initialization cancelled.');
                    return;
                }
            }
            // Initialize the history file
            await fileManager.initializeHistoryFile(force || true);
            console.log(`✓ History file initialized at ${this.historyFilePath}`);
            console.log('\nUsage:');
            console.log('  jyugemu start    - Start a monitored PowerShell session');
            console.log('  jyugemu history  - Display command history');
            console.log('  jyugemu history --limit 20 --filter "npm"  - Filter history');
        }
        catch (error) {
            console.error(`✗ Failed to initialize history file: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    /**
     * Handle the 'start' command
     * Validates: Requirements 2.1, 2.2, 2.3, 2.4
     */
    async handleStart() {
        // Check if history file exists
        if (!fs.existsSync(this.historyFilePath)) {
            console.error(`✗ History file not found at ${this.historyFilePath}. Run 'jyugemu init' first.`);
            process.exit(1);
        }
        try {
            // Generate a unique session ID
            const sessionId = this.generateSessionId();
            console.log(`Starting monitored PowerShell session (ID: ${sessionId})`);
            console.log('Type "exit" to end the session and return to the original shell.\n');
            // Create session manager
            const sessionManager = new session_manager_1.SessionManager({
                sessionId,
                historyFilePath: this.historyFilePath,
            });
            // Start the monitored session
            await sessionManager.startMonitoredSession();
            // Cleanup on exit
            await sessionManager.cleanup();
            console.log('\nMonitored session ended.');
        }
        catch (error) {
            console.error(`✗ Failed to start monitored session: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    /**
     * Handle the 'history' command
     * Validates: Requirements 5.1, 5.2, 5.3, 5.4
     *
     * @param limit - Maximum number of entries to display
     * @param filter - Optional filter string
     */
    async handleHistory(limit = 50, filter) {
        // Check if history file exists
        if (!fs.existsSync(this.historyFilePath)) {
            console.error(`✗ History file not found at ${this.historyFilePath}. Run 'jyugemu init' first.`);
            process.exit(1);
        }
        try {
            const historyManager = new history_manager_1.HistoryManager(this.historyFilePath);
            await historyManager.displayHistory(limit, filter);
        }
        catch (error) {
            console.error(`✗ Failed to display history: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
    /**
     * Display help information
     * Validates: Requirements 1.1
     */
    handleHelp() {
        console.log('jyugemu - Command logging tool for Windows PowerShell\n');
        console.log('Usage:');
        console.log('  jyugemu init                              Initialize a new history file');
        console.log('  jyugemu init --force                      Force overwrite existing file');
        console.log('  jyugemu start                             Start a monitored PowerShell session');
        console.log('  jyugemu history                           Display command history');
        console.log('  jyugemu history --limit 20                Display last 20 commands');
        console.log('  jyugemu history --filter "npm"            Filter history by command');
        console.log('  jyugemu history -l 20 -f "npm"            Short options');
        console.log('\nOptions:');
        console.log('  -l, --limit <number>    Limit number of history entries (default: 50)');
        console.log('  -f, --filter <string>   Filter history by command substring');
        console.log('  --force                 Force overwrite without confirmation');
        console.log('\nExamples:');
        console.log('  jyugemu init');
        console.log('  jyugemu start');
        console.log('  jyugemu history');
        console.log('  jyugemu history --limit 100 --filter "git"');
    }
    /**
     * Prompt user for confirmation
     * Validates: Requirements 1.3
     *
     * @param question - The question to ask
     * @returns true if user confirms, false otherwise
     */
    async promptUserConfirmation(question) {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question(question, (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
            });
        });
    }
    /**
     * Generate a unique session ID
     * Validates: Requirements 2.1
     *
     * @returns A unique session identifier
     */
    generateSessionId() {
        // Use timestamp + random suffix for session ID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `${timestamp}-${random}`;
    }
}
/**
 * Main entry point
 * Parses command line arguments and executes appropriate command
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2
 */
async function main() {
    try {
        // Parse command line arguments
        const args = process.argv.slice(2);
        const parsedCommand = (0, cli_1.parseArgs)(args);
        // Create app instance
        const app = new JyugemuApp();
        // Execute appropriate command
        switch (parsedCommand.command) {
            case 'init':
                await app.handleInit(parsedCommand.options.force);
                break;
            case 'start':
                await app.handleStart();
                break;
            case 'history':
                await app.handleHistory(parsedCommand.options.limit, parsedCommand.options.filter);
                break;
            case 'help':
            default:
                app.handleHelp();
                break;
        }
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}
// Run main function
main().catch((error) => {
    console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map