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

## クラウド同期(Firebase)のセットアップ

ログインすると記録がFirestoreに保存され、端末をまたいで同期されます。設定しない場合はローカル保存のみで動作します。

1. [Firebaseコンソール](https://console.firebase.google.com/) で対象プロジェクトを開く
2. **Authentication → Sign-in method → Google** を有効化
3. **Authentication → Settings → 承認済みドメイン** に `hiroaki-sato1117.github.io` を追加
4. **Firestore Database → データベースを作成**(本番モード)し、「ルール」タブに以下を貼り付けて公開:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

5. **プロジェクトの設定 → マイアプリ(Web)→ SDK設定と構成** の `firebaseConfig` の値を `index.html` 冒頭の `window.FIREBASE_CONFIG` に貼り付け
6. commit & push

データは `users/{あなたのUID}/tracker/main` に保存され、本人以外は読み書きできません。
