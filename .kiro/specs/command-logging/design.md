# Design Document: Command Logging

## Overview

jyugemuは、Windows環境でPowerShellコマンドの実行を監視・記録するCLIツールです。Node.jsで実装され、以下の主要機能を提供します：

- **初期化機能**: `jyugemu init`でプロジェクトの履歴ファイルを初期化
- **監視セッション**: `jyugemu start`で監視付きPowerShellサブシェルを起動
- **リアルタイムロギング**: PSReadLineフックを使用してコマンド実行をキャプチャ
- **メタデータ記録**: タイムスタンプ、ユーザー、ディレクトリ、終了コードを記録
- **履歴表示**: `jyugemu history`で記録されたコマンドを表示・フィルタリング

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    jyugemu CLI Tool                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Command    │  │   Session    │  │   History    │     │
│  │   Parser     │  │   Manager    │  │   Manager    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                    ┌───────▼────────┐                       │
│                    │  File Manager  │                       │
│                    │ (jyugemu.json) │                       │
│                    └────────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌─────────────────────────┐
                │  PowerShell Subprocess  │
                │  (PSReadLine Hooks)     │
                └─────────────────────────┘
```

## Components and Interfaces

### 1. CLI Command Parser
**責務**: コマンドライン引数を解析し、適切なアクションを実行

**インターフェース**:
```typescript
interface CLICommand {
  command: 'init' | 'start' | 'history' | 'help';
  options: {
    limit?: number;
    filter?: string;
    force?: boolean;
  };
}
```

**主要メソッド**:
- `parseArgs(argv: string[]): CLICommand`
- `executeCommand(cmd: CLICommand): Promise<void>`

### 2. Session Manager
**責務**: PowerShellサブシェルの起動・管理、PSReadLineフックの設定

**インターフェース**:
```typescript
interface SessionManager {
  startMonitoredSession(): Promise<void>;
  setupPSReadLineHook(sessionId: string): Promise<void>;
  captureCommand(command: string): Promise<CommandRecord>;
}
```

**主要メソッド**:
- `startMonitoredSession(): Promise<void>` - 監視付きPowerShellセッションを起動
- `setupPSReadLineHook(sessionId: string): Promise<void>` - PSReadLineフックを設定
- `captureCommand(command: string): Promise<CommandRecord>` - コマンド実行情報をキャプチャ

### 3. File Manager
**責務**: jyugemu.jsonファイルの読み書き、原子的な操作を保証

**インターフェース**:
```typescript
interface FileManager {
  initializeHistoryFile(): Promise<void>;
  appendCommand(record: CommandRecord): Promise<void>;
  readHistory(limit?: number): Promise<CommandRecord[]>;
  backupCorruptedFile(): Promise<void>;
}
```

**主要メソッド**:
- `initializeHistoryFile(): Promise<void>` - 新しいjyugemu.jsonを作成
- `appendCommand(record: CommandRecord): Promise<void>` - コマンド記録を追記
- `readHistory(limit?: number): Promise<CommandRecord[]>` - 履歴を読み込み
- `backupCorruptedFile(): Promise<void>` - 破損ファイルをバックアップ

### 4. History Manager
**責務**: 履歴データの表示・フィルタリング・分析

**インターフェース**:
```typescript
interface HistoryManager {
  displayHistory(limit: number, filter?: string): Promise<void>;
  filterCommands(records: CommandRecord[], filter: string): CommandRecord[];
  formatForDisplay(records: CommandRecord[]): string;
}
```

**主要メソッド**:
- `displayHistory(limit: number, filter?: string): Promise<void>` - 履歴を表示
- `filterCommands(records: CommandRecord[], filter: string): CommandRecord[]` - フィルタリング
- `formatForDisplay(records: CommandRecord[]): string` - 表示用にフォーマット

## Data Models

### CommandRecord
```typescript
interface CommandRecord {
  timestamp: string;        // ISO 8601形式
  user: string;            // 実行ユーザー名
  command: string;         // 実行されたコマンド
  exit_code: number;       // 終了コード
  cwd: string;             // 実行時のカレントディレクトリ
  note?: string;           // オプションのメモ
}
```

### HistoryFile
```typescript
interface HistoryFile {
  history: CommandRecord[];
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Initialization Creates Valid Structure
**For any** call to `jyugemu init`, the resulting jyugemu.json file SHALL contain a valid JSON structure with an empty history array.
**Validates: Requirements 1.1, 1.2**

### Property 2: Command Record Completeness
**For any** command executed in a monitored session, the recorded CommandRecord SHALL contain all required fields: timestamp, user, command, exit_code, and cwd.
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Timestamp Format Consistency
**For any** CommandRecord in the history file, the timestamp field SHALL be in valid ISO 8601 format and parseable by standard date parsing functions.
**Validates: Requirements 3.2**

### Property 4: History File Append Idempotence
**For any** sequence of commands executed, appending each command record to jyugemu.json and then reading the file SHALL return all records in the order they were appended.
**Validates: Requirements 4.1, 4.2**

### Property 5: File Corruption Recovery
**For any** corrupted jyugemu.json file, calling `jyugemu init` SHALL create a backup of the corrupted file and initialize a new valid history file.
**Validates: Requirements 4.3**

### Property 6: History Display Filtering
**For any** filter string and history records, the filtered results SHALL only include records where the command field contains the filter string (case-insensitive).
**Validates: Requirements 5.3, 5.4**

### Property 7: Exit Code Accuracy
**For any** command executed in the monitored session, the recorded exit_code SHALL match the actual PowerShell exit code ($LASTEXITCODE).
**Validates: Requirements 3.4**

## Error Handling

### Initialization Errors
- **File Already Exists**: Display warning and prompt for confirmation before overwriting
- **Permission Denied**: Display error message indicating insufficient permissions
- **Invalid Path**: Validate path before attempting to create file

### Session Errors
- **PowerShell Not Found**: Display error indicating PowerShell is not available
- **PSReadLine Hook Failure**: Log error and continue without hook (degraded mode)
- **Session Termination**: Gracefully handle unexpected session closure

### File Operation Errors
- **Concurrent Write Conflicts**: Use file locking mechanisms to prevent corruption
- **Disk Full**: Display error and suggest cleanup
- **File Corruption**: Automatically backup and reinitialize

### History Display Errors
- **Empty History**: Display informative message
- **Invalid Filter**: Display error and suggest valid filter syntax
- **File Read Failure**: Display error and suggest troubleshooting steps

## Testing Strategy

### Unit Tests
- Test CLI argument parsing with various input combinations
- Test CommandRecord validation and completeness
- Test timestamp format validation
- Test history filtering logic with various filter patterns
- Test file initialization and backup logic
- Test error handling for missing files and permissions

### Property-Based Tests
- **Property 1**: Generate random init calls and verify JSON structure validity
- **Property 2**: Generate random command records and verify all required fields are present
- **Property 3**: Generate random timestamps and verify ISO 8601 format compliance
- **Property 4**: Generate sequences of commands, append to file, read back, and verify order preservation
- **Property 5**: Generate corrupted JSON files and verify recovery process
- **Property 6**: Generate random filter strings and command records, verify filtering accuracy
- **Property 7**: Generate commands with various exit codes and verify accuracy

### Testing Framework
- **Unit Tests**: Jest (TypeScript/Node.js standard)
- **Property-Based Tests**: fast-check (JavaScript/TypeScript PBT library)
- **Minimum Iterations**: 100 per property test
- **Test Configuration**: Each property test tagged with feature name and property number