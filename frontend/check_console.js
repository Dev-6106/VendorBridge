const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure().errorText));

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2' });
  
  // Fill login
  await page.type('input[type="email"]', 'admin@erpro.com');
  await page.type('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(e => console.log('Nav error:', e.message));
  
  console.log('Current URL after login:', page.url());
  
  // Wait a bit to catch errors
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
