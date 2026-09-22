# 🍽️ mogu.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcpernot%2Fnotion-gourmet-map&env=NOTION_TOKEN,NOTION_DATABASE_ID&envDescription=Notion%E3%81%AE%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B0%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%88%E3%83%BC%E3%82%AF%E3%83%B3%E3%81%A8%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9ID%E3%82%92%E5%85%A5%E5%8A%9B%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82Google%20API%E3%82%AD%E3%83%BC%E3%81%AF%E5%85%B1%E6%9C%89%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%81%8C%E4%BD%BF%E7%94%A8%E3%81%95%E3%82%8C%E3%82%8B%E3%81%9F%E3%82%81%E7%A9%BA%E6%AC%84%E3%81%A7OK%E3%81%A7%E3%81%99%E3%80%82&project-name=my-mogu&repository-name=my-mogu)

Notionデータベースとリアルタイム連携し、蓄積されたカフェやレストランをインタラクティブな地図（Leaflet / OpenStreetMap）上に美しいベクターピンで表示するWebアプリケーションです。

Google Maps APIの有料JavaScript地図キーは不要（完全無料のOpenStreetMapを利用）。
外出先やスマホ（iPhone/Android）のブラウザから直接、**「Googleマップから店舗を検索 ➔ 星評価や感想メモを入力 ➔ Notionへ自動登録 ➔ 地図上に即時ピン表示」** までをワンストップで行えます。

---

## 🚀 3分で自分専用の mogu. を作る方法 (ワンクリックデプロイ)

プログラミングやPCでの黒い画面（コマンド操作）は一切不要です。ブラウザだけで完結します。

### ステップ 1: Notionでデータベースを作成する
1. Notionで新しいページを開きます。
2. **Notion AI（またはNotionのチャット）に以下のプロンプトをそのまま貼り付けて送信**してください。必要な列がすべて揃ったデータベースが自動生成されます。

<details>
<summary><b>🤖 Notion AI コピペ用プロンプト（クリックして展開）</b></summary>

```text
以下のプロパティ（列）を持つ「グルメログ」インラインデータベースを作成してください。プロパティ名と種類を完全に一致させてください：

1. 名前 (タイトル / Title)
2. ジャンル (セレクト / Select): カフェ, イタリアン, ラーメン, 和食, 居酒屋, 洋食, 中華, 焼肉, その他
3. 住所 (テキスト / Text)
4. 訪問日 (日付 / Date)
5. 評価 (セレクト / Select): ★5, ★4, ★3, ★2, ★1
6. マップ (URL)
7. photo_url (ファイル&メディア / Files & media)
8. 営業曜日 (マルチセレクト / Multi-select): 月, 火, 水, 木, 金, 土, 日
9. 時間帯 (マルチセレクト / Multi-select): 🌅 朝, 🥐 モーニング, ☀️ ランチ, ☕ カフェ, 🌙 ディナー, 🌃 深夜営業
10. 閉店時間 (数値 / Number)
11. 駐車場 (マルチセレクト / Multi-select): 無料駐車場あり, 有料駐車場あり, 無料屋内・立体駐車場あり, 有料屋内・立体駐車場あり
12. 食事対応 (マルチセレクト / Multi-select): 🌱 ビーガン対応あり, 🥗 ベジタリアン対応あり
13. ヴィーガン・ベジタリアン (セレクト / Select): 🌱 ビーガン対応, 🥗 ベジタリアン対応, 不明
14. Latitude (テキスト / Text)
15. Longitude (テキスト / Text)
```

</details>

### ステップ 2: Notion APIキーを取得して接続する
1. [Notion Developers - My Integrations](https://www.notion.so/profile/integrations) を開きます。
2. **「新しいインテグレーションを作成」** を押し、適当な名前（例: `グルメマップ`）を付けて保存します。
3. 表示された **「シークレット（`ntn_...`）」** をコピーします（これが `NOTION_TOKEN` です）。
4. 先ほど作ったNotionデータベースのページ右上の **「···」 ➔ 「接続先」** から、今作ったインテグレーションを追加します。
5. データベースのURLから **32文字の英数字**（これが `NOTION_DATABASE_ID` です）をメモします。
   - 例: `https://www.notion.so/workspace/`**`31220569f69942cd97953494197dd918`**`?v=...`

### ステップ 3: Vercelボタンを押してデプロイする
下のボタンをクリックします：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcpernot%2Fnotion-gourmet-map&env=NOTION_TOKEN,NOTION_DATABASE_ID&envDescription=Notion%E3%81%AE%E3%82%A4%E3%83%B3%E3%83%86%E3%82%B0%E3%83%AC%E3%83%BC%E3%82%B7%E3%83%A7%E3%83%B3%E3%83%88%E3%83%BC%E3%82%AF%E3%83%B3%E3%81%A8%E3%83%87%E3%83%BC%E3%82%BF%E3%83%99%E3%83%BC%E3%82%B9ID%E3%82%92%E5%85%A5%E5%8A%9B%E3%81%97%E3%81%A6%E3%81%8F%E3%81%A0%E3%81%95%E3%81%84%E3%80%82Google%20API%E3%82%AD%E3%83%BC%E3%81%AF%E5%85%B1%E6%9C%89%E3%82%B5%E3%83%BC%E3%83%90%E3%83%BC%E3%81%8C%E4%BD%BF%E7%94%A8%E3%81%95%E3%82%8C%E3%82%8B%E3%81%9F%E3%82%81%E7%A9%BA%E6%AC%84%E3%81%A7OK%E3%81%A7%E3%81%99%E3%80%82&project-name=my-gourmet-map&repository-name=my-gourmet-map)

1. Vercel画面で `NOTION_TOKEN` と `NOTION_DATABASE_ID` を入力します。
   *(※ Google Places API キーは共有サーバーから提供されるため、**Google Cloudの登録は不要**です！)*
2. **「Deploy」** を押して1〜2分待つと、あなた専用のWebサイトURL（`https://xxx.vercel.app`）が完成します！
3. iPhoneのSafariで開き、**「ホーム画面に追加」** すればアプリとしていつでも使えます。

---

## ✨ 主な機能

- **📍 Apple / Google Maps 風の洗練されたSVGピン**:
  - 料理ジャンルに応じた専用カラー＆ベクターアイコン（☕ カフェ、🍕 イタリアン、🍜 ラーメン、🍣 寿司、🥩 焼肉 等）
  - ヴィーガンフレンドリーな店舗には右肩にグリーンのリーフバッジ（🌱）を表示
- **🔍 リアルタイム条件フィルター**:
  - **① ジャンル**: カフェ、イタリアン、ラーメン等、登録店舗から自動抽出
  - **② 評価**: ★5のみ、★4以上、★3以上
  - **③ 営業曜日**: 月曜〜日曜
  - **④ 時間帯**: 🌅 朝 (~10時) / 🥐 モーニング (10〜12時) / ☀️ ランチ (11〜14時) / ☕ カフェ (14〜17時) / 🌙 ディナー (17〜21時) / 🌃 深夜営業 (22時〜)
  - **⑤ 食事対応**: 🌱 ヴィーガン限定
  - **⑥ 設備**: 🅿️ 駐車場あり限定
- **✨ 店舗の直接検索・登録機能 (Google Places API & Notion連携)**:
  - 画面右下の「店舗を登録」ボタンから店舗名やエリアで検索
  - 営業時間、高解像度写真、緯度経度、駐車場、ヴィーガン対応を自動取得
  - あなたの評価・訪問日・感想メモを添えてNotionへ即座に登録
- **📱 モバイル最適化**:
  - iPhone/AndroidのSafariやChromeで快適に使えるボトムシート＆アコーディオンUI
  - Safariの「ホーム画面に追加」でネイティブアプリのように全画面利用可能

---

## 💻 開発者向けローカル実行手順

開発やカスタマイズを行う場合は、ローカルPC上で実行できます。

```bash
# 1. リポジトリをクローン
git clone https://github.com/cpernot/notion-gourmet-map.git
cd notion-gourmet-map

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数ファイルの作成
cp .env.example .env.local
```

`.env.local` に以下を設定します：

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=31220569f69942cd97953494197dd918

# 自前のGoogle APIキーを利用したい場合は設定（未設定の場合は共有プロキシが利用されます）
GOOGLE_PLACES_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx

# 店舗登録を管理者のみに制限するためのシークレットキー
ADMIN_SECRET_KEY=your_secret_admin_key
```

```bash
# 4. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと動作確認できます。

---

## 🔐 管理者（デプロイ者）と一般閲覧者の使い分け (方式 1)

`ADMIN_SECRET_KEY` を設定することで、**「店舗を登録」ボタンを管理者だけに限定**できます。

- **一般ユーザー（URLを共有された人）**:
  - `https://your-domain.vercel.app` にアクセスすると、登録ボタンのない安全な閲覧専用モードになります。
- **管理者（あなた）**:
  - `https://your-domain.vercel.app?admin=あなたのシークレットキー` にアクセスすると、管理者認証され「+ 店舗を登録」ボタンが表示されます。
  - 一度アクセスするとブラウザ（localStorage）に保存されるため、次回以降はキーの入力不要で利用できます（ホーム画面追加時も有効）。
  - 管理者を解除（ログアウト）したい場合は、`?admin=logout` でアクセスするか、画面右下の管理者バッジの解除アイコンを押します。

---

## 🛠️ 技術スタック

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Map Library**: Leaflet, react-leaflet, OpenStreetMap (Google Maps JS API有料課金不要)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & API**: Notion Official REST API, Google Places API (New)
- **Geocoding**: 国土地理院 API (GSI) & OpenStreetMap Nominatim フォールバック
- **Hosting**: Vercel (Edge / Tokyo hnd1 region)
