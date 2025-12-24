# Requirements Document

## Introduction

jyugemu（じゅげむ）は、Windows環境（PowerShell）でのコマンド操作を記録・監視するためのCLIツールです。特にLLMエージェントによる自動操作の監査を目的とし、実行されたコマンドをリアルタイムで記録し、メタデータと共に保存します。

## Glossary

- **CLI_Tool**: jyugemuコマンドラインツール
- **PowerShell_Session**: jyugemuが起動するPowerShellサブシェル
- **Command_Logger**: コマンド実行を監視・記録するコンポーネント
- **History_File**: jyugemu.jsonファイル（コマンド履歴を保存）
- **PSReadLine**: PowerShellのコマンドライン編集機能

## Requirements

### Requirement 1

**User Story:** As a developer, I want to initialize a logging workspace, so that I can start tracking command execution in my project directory.

#### Acceptance Criteria

1. WHEN a user runs `jyugemu init`, THE CLI_Tool SHALL create a jyugemu.json file in the current directory
2. WHEN creating the initial file, THE CLI_Tool SHALL initialize it with an empty history array structure
3. IF a jyugemu.json file already exists, THEN THE CLI_Tool SHALL display a warning and ask for confirmation before overwriting
4. WHEN initialization completes successfully, THE CLI_Tool SHALL display a success message with usage instructions

### Requirement 2

**User Story:** As a developer, I want to start a monitored PowerShell session, so that all commands executed within it are automatically logged.

#### Acceptance Criteria

1. WHEN a user runs `jyugemu start`, THE CLI_Tool SHALL launch a new PowerShell subprocess
2. WHEN the PowerShell session starts, THE Command_Logger SHALL configure PSReadLine hooks for command monitoring
3. WHILE the monitored session is active, THE Command_Logger SHALL capture all executed commands in real-time
4. WHEN the user exits the monitored session, THE CLI_Tool SHALL return to the original shell

### Requirement 3

**User Story:** As a system administrator, I want comprehensive command metadata recorded, so that I can audit and analyze command execution patterns.

#### Acceptance Criteria

1. WHEN a command is executed in the monitored session, THE Command_Logger SHALL record the command string
2. WHEN recording a command, THE Command_Logger SHALL capture the execution timestamp in ISO 8601 format
3. WHEN recording a command, THE Command_Logger SHALL capture the current working directory
4. WHEN recording a command, THE Command_Logger SHALL capture the command exit code
5. WHEN recording a command, THE Command_Logger SHALL capture the current user name

### Requirement 4

**User Story:** As a developer, I want command history persisted reliably, so that no execution data is lost even if the system crashes.

#### Acceptance Criteria

1. WHEN a command completes execution, THE Command_Logger SHALL immediately append the record to jyugemu.json
2. WHEN writing to the history file, THE Command_Logger SHALL use atomic write operations to prevent corruption
3. IF the history file becomes corrupted, THEN THE CLI_Tool SHALL create a backup and initialize a new file
4. WHEN multiple commands execute rapidly, THE Command_Logger SHALL handle concurrent writes safely

### Requirement 5

**User Story:** As a developer, I want to view and analyze command history, so that I can understand execution patterns and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a user runs `jyugemu history`, THE CLI_Tool SHALL display recent command entries in a readable format
2. WHEN displaying history, THE CLI_Tool SHALL show timestamp, command, exit code, and working directory
3. WHERE a limit option is provided, THE CLI_Tool SHALL display only the specified number of recent entries
4. WHERE a filter option is provided, THE CLI_Tool SHALL display only commands matching the filter criteria

### Requirement 6

**User Story:** As a system integrator, I want the tool to work reliably on Windows 11 with PowerShell, so that it can be deployed in our standard development environment.

#### Acceptance Criteria

1. THE CLI_Tool SHALL be compatible with Windows 11 operating system
2. THE CLI_Tool SHALL work with PowerShell 5.1 and PowerShell 7+
3. WHEN PSReadLine is not available, THE CLI_Tool SHALL display an informative error message
4. THE CLI_Tool SHALL handle Windows file path conventions correctly
5. THE CLI_Tool SHALL respect Windows execution policies for PowerShell scripts