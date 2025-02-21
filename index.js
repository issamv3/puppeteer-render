require("dotenv").config();
const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.use(express.json());

async function getDownloadLinkAndSize(url) {
  try {
      const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath:
      process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({
      'authority': 'www.mediafire.com',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      'cache-control': 'max-age=0',
      'cookie': 'g36FastPopSessionRequestNumber=4; g36FastPopSessionRequestNumber=5; ukey=mqb71pkx8o5whzm3fm5ehh4v8oaefq5p; 4a7p=1; _gid=GA1.2.1294298474.1740081202; accept-cookies=1; 4alv=1; 4anv=1; 4a53=1; 4alm=1; 4a98=1; conv_tracking_data-2=%7B%22mf_source%22%3A%22regular_download-61%22%2C%22mf_content%22%3A%22Free%22%2C%22mf_medium%22%3A%22unknown%5C%2FChrome%22%2C%22mf_campaign%22%3A%22h5qp0ubjwl9be6r%22%2C%22mf_term%22%3A%22590dc60500b2b0cd4191e2aca0652ac9%22%7D; __cf_bm=5CEkVqOTMTCloaMGyAZ_GFWe.nUyEw5qbsda.UwYaEg-1740127689-1.0.1.1-WeL_MGpmKKxheRlriGKnTD57eKJN_NkBL.ccyOd24W3SkfzBC4wh78rmmOek4wwX1qfP.Zey3lkYhsbfNYdGWg; cf_clearance=Kc1HEtmB7asd1tCGAHuWigQOZp81_pyVn3VQ44JehTc-1740127692-1.2.1.1-OHTUdiwRE5pFasz1qG_wE9.C2rWgceoiTG0VB110Ve_CUTlymYPSeMYNz5z6PTO8Xmpd5Ebj.3ZVRcAHDpHxGT.YnEdmscyqnQi3oYfBAqEqRujbJZtT8ThUc9BMxNAfCl0dI8vSeKNRsGDkMHdJgQbvJenu2y.Ilvv2rQO5TOzVhANFn8RehIn3SrxpfJcf81fCKVKbuS.lgmiZVqo5AjevnIgKnwU00.eWRz0WY20cl_MY9qGYfLYi8lSIrFtqSSnbPaFIvTB3pM09N7lPXJqVcb_ySz1jR_3bNf4pO6U; ad_count=1; click_download=h5qp0ubjwl9be6r; dr_h5qp0ubjwl9be6r=1; amp_28916b=VtSqB9LvsRjxoVumrJSa3I...1ikjr2hj5.1ikjrg4cv.0.16.16; _gat_gtag_UA_829541_1=1; _ga=GA1.1.2083535056.1739433598; _ga_K68XP6D85D=GS1.1.1740127686.3.1.1740128130.60.0.0',
      'referer': 'https://www.mediafire.com/download_repair.php',
      'save-data': 'on',
      'sec-ch-ua': '"Not A(Brand";v="24", "Chromium";v="110", "Microsoft Edge Simulate";v="110", "Lemur";v="110"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Linux; Android 11; WIKO T10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36'
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const pageContent = await page.content();

    const $ = cheerio.load(pageContent);
    const hasil = [];
    const link = $('a#downloadButton').attr('href');
    const size = $('a#downloadButton').text().replace('Download', '').replace('(', '').replace(')', '').replace('\n', '').replace('\n', '').replace('                         ', '').trim();
    const seplit = link.split('/');
    const name = decodeURIComponent(seplit[5]);
    const parts = name.split('.');
    const type = parts[parts.length - 1];
    hasil.push({ name, type, size, link });

    await browser.close();
    return hasil;
  } catch (error) {
    console.error('حدث خطأ:', error);
    throw error;
  }
}
app.get('/dl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.send("🦊")
  }

  try {
    const result = await getDownloadLinkAndSize(url);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب البيانات.' });
  }
});

app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
});
