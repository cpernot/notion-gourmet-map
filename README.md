# 🗺️ Notion Gourmet Map (Notion連携 グルメ・カフェマップ)

Notionデータベースに蓄積されたカフェやレストランの情報を取得し、インタラクティブな地図（Leaflet / OpenStreetMap）上にピン表示するモバイル対応・高速Next.js Webアプリケーションです。

Google Maps APIの有料課金キーは不要で、完全無料で動作します。Notion APIトークンはサーバーサイド（Route Handler）でのみ安全に取り扱われます。

---

## ✨ 主な機能

- **📍 無料地図表示 (OpenStreetMap / Leaflet)**:
  - ジャンル別アイコン（☕ カフェ、🍕 イタリアン、🍜 ラーメン 等）のピン表示
  - タップでカバー写真、評価、ジャンル、住所、営業時間帯、「Notionで開く」「Google Maps」ボタンを表示
- **🔍 リアルタイム条件フィルター**:
  - **① ジャンル**: カフェ、イタリアン、ラーメン等、登録データから自動抽出
  - **② 評価**: ★5のみ、★4以上、★3以上
  - **③ 営業曜日**: 月曜〜日曜
  - **④ 時間帯**: 🌅 朝 / 🥐 モーニング / ☀️ ランチ / ☕ カフェ / 🌙 ディナー / 🌃 深夜営業
  - **⑤ 食事対応**: 🌱 ヴィーガン限定
  - **⑥ 設備**: 🅿️ 駐車場あり限定
- **📱 モバイル最適化**:
  - iPhone/AndroidのSafariやChromeで快適に使えるアコーディオン式フィルター
  - ホーム画面に追加することでネイティブアプリのように全画面表示可能

---

## 🚀 ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定 (.env.local を作成)
cp .env.example .env.local
# NOTION_TOKEN と NOTION_DATABASE_ID を入力

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 🌐 Vercel へのデプロイ

1. このリポジトリを [Vercel](https://vercel.com) にインポートします。
2. **Settings > Environment Variables** に以下を登録します:
   - `NOTION_TOKEN`: お使いのNotion統合トークン
   - `NOTION_DATABASE_ID`: NotionデータベースID
3. デプロイ後、発行されたURLでiPhoneやPCからすぐに利用できます。
