# 🗺️ グルメマップ (Gourmet Map for Notion)

Notionデータベースとリアルタイム連携し、蓄積されたカフェやレストランをインタラクティブな地図（Leaflet / OpenStreetMap）上に美しいベクターピンで表示するNext.js Webアプリケーションです。

Google Maps APIの有料JavaScript地図キーは不要（完全無料のOpenStreetMapを利用）。
外出先やiPhoneのブラウザから直接、**「Googleマップから店舗を検索 ➔ 星評価や感想メモを入力 ➔ Notionへ自動登録 ➔ 地図上に即時ピン表示」** までをワンストップで行えます。

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

## 📋 ゼロから動かすまでの完全セットアップ手順

新しい環境で本アプリを動かすためのステップです。

### 1. Notionデータベースの作成

Notionを開き、新規ページを作成します。
**Notion AI（またはNotionのチャット）に以下のプロンプトをそのままコピー＆ペースト**してください。自動的に必要な全列が整ったデータベースが作成されます。

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

> 💡 **手動で作成する場合**:
> 上記のリストの「プロパティ名」と「種類（型）」の通りに列を追加してください。

---

### 2. Notionインテグレーション（APIトークン）の発行

1. [Notion Developers - My Integrations](https://www.notion.so/profile/integrations) にアクセスします。
2. **「新しいインテグレーションを作成」** をクリックします。
3. 任意の名前（例: `Gourmet Map`）を入力し、対象のワークスペースを選択して「保存」します。
4. 発行された **「シークレット（内部インテグレーションシークレット）」** をコピーします（これが `NOTION_TOKEN` になります）。
5. 先ほど作成したNotionのデータベースページを開き、右上の **「···」 ➔ 「接続先 (Connect to)」** から、作成したインテグレーション（`Gourmet Map`）を追加・許可します。

> 🔑 **データベースIDの確認方法**:
> データベースページのURLを確認します:
> `https://www.notion.so/workspace/31220569f69942cd97953494197dd918?v=...`
> このURLの `workspace/` の後ろから `?` の手前までにある **32文字の英数字** が `NOTION_DATABASE_ID` です。

---

### 3. Google Places API キーの取得

店舗の検索および営業時間・写真・座標の自動取得に使用します。

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセスします。
2. プロジェクトを作成（または選択）し、**「Places API (New)」** を有効化します。
3. **「APIとサービス」 ➔ 「認証情報」** から APIキー を作成・取得します（これが `GOOGLE_PLACES_API_KEY` になります）。

---

### 4. リポジトリのクローン & ローカル起動

```bash
# 1. リポジトリをクローン
git clone https://github.com/cpernot/notion-gourmet-map.git
cd notion-gourmet-map

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数ファイルの作成
cp .env.example .env.local
```

`.env.local` をテキストエディタで開き、取得した3つのキーを設定します：

```env
NOTION_TOKEN=ntn_xxxxxxxxxxxxxxxxxxxx
NOTION_DATABASE_ID=31220569f69942cd97953494197dd918
GOOGLE_PLACES_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxx
```

```bash
# 4. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、マップと店舗データが表示されます！

---

## 🌐 Vercelへのデプロイ（iPhone・外出先から使う場合）

Vercel（無料枠）にデプロイすると、PCを閉じていてもいつでもiPhoneから専用URLでアクセスできます。

1. GitHubにリポジトリをプッシュします。
2. [Vercel](https://vercel.com) にログインし、**「Add New...」 ➔ 「Project」** を選択してリポジトリをインポートします。
3. **「Environment Variables」** に以下の3つを登録します：

| Key (キー名) | 説明 |
| :--- | :--- |
| **`NOTION_TOKEN`** | Notionインテグレーションシークレット (`ntn_...`) |
| **`NOTION_DATABASE_ID`** | NotionデータベースID（32文字の英数字） |
| **`GOOGLE_PLACES_API_KEY`** | Google Cloud Places API キー |

4. **「Deploy」** をクリックします。
5. デプロイ完了後、発行されたURL（例: `https://xxx.vercel.app`）をiPhoneのSafariで開き、共有メニューから **「ホーム画面に追加」** してください！

---

## 🛠️ 技術スタック

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Map Library**: Leaflet, react-leaflet, OpenStreetMap (Google Maps JS API有料課金不要)
- **Styling**: Tailwind CSS, Lucide Icons
- **Database & API**: Notion Official REST API, Google Places API (New)
- **Geocoding**: 国土地理院 API (GSI) & OpenStreetMap Nominatim フォールバック
- **Deployment**: Vercel
