import { config } from 'dotenv';

config();

import fs from 'fs/promises';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { resolve } from 'path';
import { getEnv } from './utils/env.js';

async function main() {
  const baseUrl = getEnv('BASE_URL');
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const runnerResult = await lighthouse(baseUrl, {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
  });

  if (!runnerResult?.report)
    throw new Error('Could not complete Lighthouse run');

  const reportHtml = Array.isArray(runnerResult.report)
    ? runnerResult.report.join()
    : runnerResult.report;

  await fs.mkdir(resolve('.lighthouse'), { recursive: true });
  await fs.writeFile(
    resolve(
      '.lighthouse',
      `${encodeURIComponent(
        new Date().toISOString().replaceAll(':', '')
      )}-${encodeURIComponent(baseUrl)}-lhreport.html`
    ),
    reportHtml,
    {
      encoding: 'utf-8',
    }
  );

  // `.lhr` is the Lighthouse Result as a JS object
  console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
  console.log(
    'Performance score was',
    (runnerResult.lhr?.categories?.performance?.score || 0) * 100
  );

  chrome.kill();
}

main();
