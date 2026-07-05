# KISEKI ✦ 最後の習慣化アプリ

毎日の積み重ねを、軌跡に。シンプルで高機能な習慣トラッカー。

## 特長

- ◎○△×の5段階マークによる柔軟な記録(Excel風のセル操作・コピペ・Undo対応)
- ⚡ Quick Check — 今日のタスクをワンタップで記録
- ストリーク・スコア・ヒートマップなどの統計ダッシュボード
- 5色のアクセントテーマ(Forest / Ocean / Violet / Ember / Rose)× ライト/ダーク
- PWA対応 — ホーム画面に追加してオフラインでも動作
- データはブラウザ内(IndexedDB + localStorage)に保存。JSONバックアップ/復元機能つき
- Gemini APIによるAI振り返りコメント(任意)

## 公開方法(GitHub Pages)

1. このリポジトリをGitHubにpush
2. リポジトリの **Settings → Pages** を開く
3. **Source: Deploy from a branch**、**Branch: main / (root)** を選択して Save
4. 数分後に `https://<ユーザー名>.github.io/Daily-Tracker/` で公開されます

PWA(ホーム画面追加・オフライン動作)はHTTPS配信時に自動で有効になります。

## ローカルで動かす

```bash
npx serve .
# または
python3 -m http.server 8000
```

`index.html` を直接開いても動作します(Service Workerのみ無効)。
