import { config } from 'dotenv';
import { mkdir, writeFile } from 'fs/promises';
import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import { resolve } from 'path';
import { getEnv } from './utils/env.js';

config();

async function main() {
  const baseUrl = process.argv?.[2] ?? getEnv('BASE_URL');
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

  const dirname = resolve('.lighthouse');
  const filename = resolve(
    '.lighthouse',
    `${encodeURIComponent(
      new Date().toISOString().replaceAll(':', '')
    )}-${encodeURIComponent(baseUrl)}-lhreport.html`
  );

  await mkdir(dirname, { recursive: true });
  await writeFile(filename, reportHtml, {
    encoding: 'utf-8',
  });
  console.log(`Report saved to ${filename}`);

  // `.lhr` is the Lighthouse Result as a JS object
  console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
  console.log(
    'Performance score was',
    (runnerResult.lhr?.categories?.performance?.score || 0) * 100
  );

  chrome.kill();
}

main();
