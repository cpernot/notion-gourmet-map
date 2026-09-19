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
- **✨ 店舗の直接検索・登録機能**:
  - 画面右下の「店舗を登録」ボタンから、Googleマップの店舗（店名・エリア等）を検索
  - 高画質写真、営業時間、緯度経度、駐車場、食事対応、Google評価を自動取得
  - あなたの評価・訪問日・感想メモを添えてNotionへ即座に1タップ登録
  - 登録完了後、画面を更新することなく新しいピンが地図上に出現＆自動フォーカス
- **📱 モバイル最適化**:
  - iPhone/AndroidのSafariやChromeで快適に使えるボトムシート＆アコーディオンUI
  - ホーム画面に追加することでネイティブアプリのように全画面表示可能

---

## 🚀 ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定 (.env.local を作成)
cp .env.example .env.local
# NOTION_TOKEN, NOTION_DATABASE_ID, GOOGLE_PLACES_API_KEY を入力

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

---

## 🌐 Vercel へのデプロイ

1. このリポジトリを [Vercel](https://vercel.com) にインポートします。
2. **Settings > Environment Variables** に以下を登録します:
   - `NOTION_TOKEN`: お使いのNotion統合トークン (`ntn_...`)
   - `NOTION_DATABASE_ID`: NotionデータベースID (`31220569f69942cd97953494197dd918`)
   - `GOOGLE_PLACES_API_KEY`: Google Cloud Consoleで発行したPlaces APIキー
3. デプロイ後、発行されたURLでiPhoneやPCからすぐに利用できます。
