require('dotenv').config();
const puppeteer = require('puppeteer');
const jsdom = require('jsdom');
const axios = require('axios');

const {
  SITE_ID, SITE_PASS, IMGUR_CLIENT_ID, DISCORD_WEBHOOK,
} = process.env;

const sleep = async (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const main = async () => {
  console.log('=====東京都市大学横浜キャンパス 学食教えてくれるくん Ver 1.0=====');

  // 1. 今日が平日かどうか判定する
  const date = new Date();
  const todayDate = `${date.getFullYear()}/${(`00${date.getMonth() + 1}`).slice(-2)}/${(`00${date.getDate()}`).slice(-2)}`;
  console.log(`${todayDate}の学食情報を取得します。`);
  // 休日のときは稼働させない
  if (date.getDay() === 0 || date.getDay() === 6) {
    console.error('本日は学食が販売されていないため、プログラムを終了します。');
    return;
  }

  const browser = await puppeteer.launch({
    defaultViewport: {
      width: 1200,
      height: 800,
    },
  });
  const page = await browser.newPage();

  let pageData;
  let pageScreenShot;

  try {
    // 2. サイトにログインする
    await page.goto('https://livexnet.jp/local/default.asp', { waitUntil: 'domcontentloaded' });
    await page.type('input[type="text"][name="id"]', SITE_ID);
    await page.type('input[type="password"][name="pw"]', SITE_PASS);
    await sleep(1000);
    page.click('input[type="submit"]');
    await page.waitForNavigation({ timeout: 5000, waitUntil: 'domcontentloaded' });

    // 3. 横浜キャンパスの学食の情報にアクセスする
    await page.goto('https://reporting.livexnet.jp/eiyouka/jump/CityUnivYok.asp?val=wekly&bcd=02320&wrd=jp&ink=z', { waitUntil: 'domcontentloaded' });
    await sleep(1000);

    // 4. 今日の学食の情報にアクセスする
    await page.goto(`https://reporting.livexnet.jp/eiyouka/menu.asp?val=daily&bcd=02320&str=${todayDate}&ink=z&col=`, { waitUntil: 'domcontentloaded' });
    pageData = await page.content();
    await sleep(1000);

    // 5. 印刷ページのスクショをとる
    await page.goto(`https://reporting.livexnet.jp/eiyouka/print.asp?val=daily&str=${todayDate}&bcd=02320&dip=0&ink=z&wrd=jp`, { waitUntil: 'domcontentloaded' });
    pageScreenShot = await page.screenshot({ encoding: 'base64' });

    await browser.close();
  } catch (e) {
    console.log('エラー: Webページのデータ取得中にエラーが発生しました。プログラムを終了します。');
    console.log(e);
    return;
  }

  // 6. 学食の情報を取り出す
  const dom = new jsdom.JSDOM(pageData);
  const menusDom = dom.window.document.getElementsByClassName('img_comment6');
  const menus = [];
  Array.prototype.forEach.call(menusDom, (item) => {
    menus.push(`・${item.innerHTML.replace('<br>', '')}\n`);
  });
  if (!menus[0]) {
    console.log('学食の情報を取得することが出来ませんでした。プログラムを終了します。');
    return;
  }

  // 7. スクリーンショットをimgurにアップロードする
  const uploadResult = await axios.post('https://api.imgur.com/3/image', pageScreenShot.replace(new RegExp('data.*base64,'), ''), {
    headers: {
      Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
    },
  }).catch((e) => {
    console.log('エラー: Imgurに画像アップロード中にエラーが発生しました。画像はDiscordに投稿されません。');
    console.log(e);
    return ''; // 画像URLが取得できなかった場合は空の文字列を返す
  });

  // 8. Discordに投稿する用の文章を作成
  let uploadTxt = `【${todayDate}の学食情報】\n`;
  if (pageData.indexOf('１００円朝食') !== -1) {
    uploadTxt += `100円朝食: \n${menus[0]}\n`;
    menus.shift();
    uploadTxt += `昼メニュー: \n${menus.join('')}\n`;
  } else {
    uploadTxt += `本日、100円朝食の提供はありません。\n\n昼メニュー:\n${menus.join('')}\n`;
  }
  uploadTxt += uploadResult.data.data.link;

  // 8. Discordに投稿する
  await axios.post(DISCORD_WEBHOOK, { content: uploadTxt }).catch((e) => {
    console.log('エラー: Discordに送信中にエラーが発生しました。');
    console.log(e);
  });

  console.log(uploadTxt);
};

main();
