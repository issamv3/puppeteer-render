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
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ],
      executablePath: process.env.NODE_ENV === "production"
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.setCacheEnabled(true);
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font', 'media', 'script'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    let responseHeaders = {};
    page.on('response', async (response) => {
      if (response.url().includes('mediafire.com')) {
        responseHeaders = response.headers();
      }
    });
    
    await page.setExtraHTTPHeaders({
      'authority': 'www.mediafire.com',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
      'cookie': '_ga_K68XP6D85D=GS1.1.1740328939.6.1.1740329504.60.0.0',
      'sec-ch-ua': '"Not A(Brand";v="24", "Chromium";v="110", "Microsoft Edge Simulate";v="110", "Lemur";v="110"',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'none',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Linux; Android 11; WIKO T10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Mobile Safari/537.36'
    });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const pageContent = await page.content();
    const $ = cheerio.load(pageContent);
    const link = $('a#downloadButton').attr('href');
    const sizeText = $('a#downloadButton').text().replace('Download', '').replace(/[()]/g, '').trim();

    if (!link) {
      throw new Error('لم يتم العثور على زر التحميل.');
    }

    const fileName = decodeURIComponent(link.split('/').pop());
    const fileType = fileName.split('.').pop();

    const fileInfo = {
      name: fileName,
      type: fileType,
      size: sizeText,
      link: link
    };

    await browser.close();

    return { file: fileInfo, headers: responseHeaders };
  } catch (error) {
    console.error('حدث خطأ:', error);
    throw error;
  }
}

app.get('/dl', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, error: "يرجى تقديم رابط صحيح." });
  }

  try {
    const result = await getDownloadLinkAndSize(url);
    res.json({ success: true, data: result.file, headers: result.headers });
  } catch (error) {
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب البيانات.' });
  }
});

app.listen(port, () => {
  console.log(`الخادم يعمل على http://localhost:${port}`);
});
