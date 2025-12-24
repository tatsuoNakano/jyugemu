# Implementation Plan: Command Logging

## Overview

jyugemuをTypeScriptで実装します。Node.jsベースのCLIツールとして、以下の段階で開発を進めます：

1. プロジェクト構造とコア型定義の設定
2. CLIコマンドパーサーの実装
3. ファイル管理機能の実装
4. PowerShellセッション管理の実装
5. 履歴表示機能の実装
6. 統合とテスト

## Tasks

- [x] 1. プロジェクト構造とコア型定義の設定
  - package.jsonを作成し、必要な依存関係（commander, dayjs, fast-check）をインストール
  - TypeScript設定ファイル（tsconfig.json）を作成
  - ディレクトリ構造を作成（src/、dist/、tests/）
  - コア型定義ファイル（src/types.ts）を作成し、CommandRecord、HistoryFileインターフェースを定義
  - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. CLIコマンドパーサーの実装
  - [x] 2.1 CLIコマンドパーサーを実装
    - commanderライブラリを使用してCLIインターフェースを構築
    - `jyugemu init`、`jyugemu start`、`jyugemu history`コマンドを定義
    - コマンドラインオプション（--limit、--filter、--force）を実装
    - _Requirements: 1.1, 2.1, 5.1_

  - [ ]* 2.2 CLIパーサーのユニットテストを作成
    - 各コマンドの引数解析をテスト
    - オプション処理をテスト
    - _Requirements: 1.1, 2.1_

- [x] 3. ファイル管理機能の実装
  - [x] 3.1 FileManagerクラスを実装
    - `initializeHistoryFile()`メソッド：新しいjyugemu.jsonを作成
    - `appendCommand()`メソッド：コマンド記録を原子的に追記
    - `readHistory()`メソッド：履歴ファイルを読み込み
    - `backupCorruptedFile()`メソッド：破損ファイルをバックアップ
    - ファイルロック機構を実装して並行書き込みを安全に処理
    - _Requirements: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4_

  - [x]* 3.2 FileManagerのプロパティテストを作成
    - **Property 1: Initialization Creates Valid Structure**
    - **Validates: Requirements 1.1, 1.2**
    - 初期化後のファイル構造が有効なJSONであることを検証

  - [x]* 3.3 FileManagerのプロパティテストを作成
    - **Property 4: History File Append Idempotence**
    - **Validates: Requirements 4.1, 4.2**
    - コマンド記録の追記と読み込みが順序を保つことを検証

  - [x]* 3.4 FileManagerのユニットテストを作成
    - ファイル初期化のテスト
    - ファイル破損時のバックアップと復旧テスト
    - 権限エラーハンドリングのテスト
    - _Requirements: 1.1, 1.2, 4.3_

- [-] 4. PowerShellセッション管理の実装
  - [x] 4.1 SessionManagerクラスを実装
    - `startMonitoredSession()`メソッド：監視付きPowerShellサブシェルを起動
    - `setupPSReadLineHook()`メソッド：PSReadLineフックを設定
    - `captureCommand()`メソッド：コマンド実行情報をキャプチャ
    - PowerShellプロセスの生成と管理
    - PSReadLineフックスクリプトの生成と実行
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [-] 4.2 SessionManagerのプロパティテストを作成

    - **Property 2: Command Record Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - 記録されたコマンドレコードがすべての必須フィールドを含むことを検証

  - [ ] 4.3 SessionManagerのプロパティテストを作成

    - **Property 3: Timestamp Format Consistency**
    - **Validates: Requirements 3.2**
    - すべてのタイムスタンプがISO 8601形式であることを検証


  - [ ]* 4.4 SessionManagerのプロパティテストを作成
    - **Property 7: Exit Code Accuracy**
    - **Validates: Requirements 3.4**
    - 記録された終了コードが実際のPowerShell終了コードと一致することを検証

  - [ ] 4.5 SessionManagerのユニットテストを作成

    - PowerShellプロセス起動のテスト
    - PSReadLineフック設定のテスト
    - エラーハンドリング（PSReadLine未利用時）のテスト
    - _Requirements: 2.1, 2.2, 6.3_

- [ ] 5. 履歴表示機能の実装
  - [x] 5.1 HistoryManagerクラスを実装
    - `displayHistory()`メソッド：履歴を表示
    - `filterCommands()`メソッド：フィルタリング処理
    - `formatForDisplay()`メソッド：表示用フォーマット
    - タイムスタンプ、コマンド、終了コード、ディレクトリを表示
    - --limitオプションで表示件数を制限
    - --filterオプションでコマンドをフィルタリング
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 5.2 HistoryManagerのプロパティテストを作成
    - **Property 6: History Display Filtering**
    - **Validates: Requirements 5.3, 5.4**
    - フィルタリング結果がフィルタ条件に一致することを検証

  - [ ]* 5.3 HistoryManagerのプロパティテストを作成
    - **Property 5: File Corruption Recovery**
    - **Validates: Requirements 4.3**
    - 破損ファイルの復旧プロセスを検証

  - [ ]* 5.4 HistoryManagerのユニットテストを作成
    - 履歴表示のテスト
    - フィルタリング機能のテスト
    - 空の履歴の処理テスト
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. メイン実行ロジックと統合
  - [x] 6.1 メインエントリーポイント（src/index.ts）を実装
    - CLIパーサーとコマンドハンドラーを統合
    - `jyugemu init`コマンドの実装
    - `jyugemu start`コマンドの実装
    - `jyugemu history`コマンドの実装
    - エラーハンドリングとユーザーメッセージの実装
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2_

  - [ ]* 6.2 統合テストを作成
    - `jyugemu init`の完全なフロー
    - `jyugemu start`でのコマンド記録フロー
    - `jyugemu history`の表示フロー
    - エラーシナリオのテスト
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2_

- [x] 7. ビルドと実行可能ファイルの準備
  - TypeScriptをJavaScriptにコンパイル
  - package.jsonにbinフィールドを追加してCLIコマンドを登録
  - `npm install -g`でグローバルインストール可能にする
  - _Requirements: 1.1, 2.1, 5.1_

- [x] 8. チェックポイント - すべてのテストが成功することを確認
  - すべてのユニットテストが成功することを確認
  - すべてのプロパティテストが成功することを確認
  - 統合テストが成功することを確認
  - ユーザーに質問がないか確認

## Notes

- タスク内の`*`マークは、より高速なMVP開発のためのオプションタスクです
- 各タスクは特定の要件を参照しており、トレーサビリティが確保されています
- プロパティテストはfast-checkライブラリを使用して実装します
- 最小100回の反復でプロパティテストを実行します
- ファイル操作は原子性を保証するため、一時ファイルと名前変更を使用します
- PowerShellとの相互作用はNode.jsの`child_process`モジュールを使用します