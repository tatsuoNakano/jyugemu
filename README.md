# jyugemu (じゅげむ)

Windows PowerShell用のコマンドロギングツール。プロジェクトごとにコマンド履歴を記録・管理できます。

## 特徴

- **プロジェクト単位の履歴管理**: 各プロジェクトに `jyugemu.json` を作成し、独立した履歴を保持
- **リアルタイム記録**: コマンド実行と同時に自動保存
- **メタデータ記録**: 実行日時、ユーザー名、作業ディレクトリ、終了コードを記録
- **環境を汚さない**: グローバルな設定ファイルを使わず、プロジェクトローカルで完結

## インストール

```powershell
# リポジトリをクローン
git clone https://github.com/your-username/jyugemu.git
cd jyugemu

# 依存関係をインストール
npm install

# ビルド
npm run build

# グローバルにリンク（どこからでも使えるようになる）
npm link
```

## 使い方

### 1. 初期化

プロジェクトのルートディレクトリで実行：

```powershell
jyugemu init
```

`jyugemu.json` が作成されます。既存のファイルを上書きする場合は `--force` オプションを使用：

```powershell
jyugemu init --force
```

### 2. 監視セッションの開始

```powershell
jyugemu start
```

新しいPowerShellセッションが起動し、以降のコマンドが自動的に記録されます。

### 3. コマンドの実行

通常通りコマンドを実行するだけで、すべて記録されます：

```powershell
PS C:\project> npm install
PS C:\project> npm run build
PS C:\project> git status
```

### 4. セッションの終了

```powershell
exit
```

### 5. 履歴の確認

```powershell
# 全履歴を表示
jyugemu history

# 最新20件を表示
jyugemu history --limit 20

# フィルタリング
jyugemu history --filter "npm"

# 組み合わせ
jyugemu history -l 10 -f "git"
```

## 記録されるデータ

```json
{
  "history": [
    {
      "timestamp": "2025-12-25T01:03:14.221Z",
      "user": "username",
      "command": "npm install",
      "exit_code": 0,
      "cwd": "C:\\Users\\username\\project"
    }
  ]
}
```

## .gitignore への追加

履歴をローカルのみに保持したい場合：

```
jyugemu.json
jyugemu.json.backup.*
```

チームで共有したい場合はコミットしてもOKです。

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `jyugemu init` | 履歴ファイルを初期化 |
| `jyugemu init --force` | 既存ファイルを上書き |
| `jyugemu start` | 監視セッションを開始 |
| `jyugemu history` | 履歴を表示 |
| `jyugemu history --limit N` | 最新N件を表示 |
| `jyugemu history --filter "text"` | テキストでフィルタ |
| `jyugemu help` | ヘルプを表示 |

## 開発

```powershell
# テスト実行
npm test

# ウォッチモードでビルド
npm run dev
```

## 技術スタック

- Node.js / TypeScript
- Commander.js (CLI)
- Day.js (日時処理)
- Jest / fast-check (テスト)

## ライセンス

MIT
