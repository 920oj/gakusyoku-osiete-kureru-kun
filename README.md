# 学食教えてくれるくん(東京都市大学横浜キャンパス専用)

都市大YCのその日の学食を取得して、指定したDiscordのWebhook宛に送信します。

## 使い方

1. `.env` を作成し、必要な情報をセットする
2. `npm install` でパッケージのインストール
3. `node ./index.js` で実行

## `.env` ファイルについて
このプログラムを動かすには、以下の情報をセットする必要があります。

- 学食のサイトのID `SITE_ID`
- 学食のサイトパスワード `SITE_PASS`
- ImgurのクライアントID `IMGUR_CLIENT_ID`
- DiscordのWebhook URL `DISCORD_WEBHOOK`

### `.env` ファイルの記述例

```
SITE_ID=xxxxxxxxxx
SITE_PASS=xxxxxxxxxx
IMGUR_CLIENT_ID=xxxxxxxxxx
DISCORD_WEBHOOK=https://discord.com/api/webhooks/xxxxxxxxx/xxxxxxxxxxx
```

## LICENSE
MIT License
