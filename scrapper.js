import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import { parse } from 'json2csv';
import fs from 'fs';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract company data from the HTML
function extractCompanyData(html) {
  const $ = cheerio.load(html);
  const hasMainTable = $('th:contains("Entity Type")').length > 0;

  if (!hasMainTable) {
    return { error: '❌ Record not found or table missing' };
  }

  const data = {};

  $('tr').each((_, row) => {
    const th = $(row).find('th').first().text().trim();
    const tds = $(row).find('td');

    const value = tds.first().text().trim();

    if (th.includes('Entity Type')) data['Entity Type'] = value;
    if (th.includes('MC/MX/FF Number')) data['MC/MX/FF Number(s)'] = value;
    if (th.includes('Legal Name')) data['Legal Name'] = value;
    if (th.includes('Physical Address')) {
      data['Physical Address'] = value.replace(/\s+/g, ' ').trim();
    }
    if (th.includes('Phone')) data['Phone'] = value;
    if (th.includes('Operating Authority Status')) {
      data['Operating Authority Status'] = value.replace(/For Licensing.*$/i, '').trim();
      data['Operating Authority Status'] = data['Operating Authority Status'].replace(/\s+/g, ' ').trim();
    }
    if (th.includes('Power Units')) {
      data['Power Units'] = tds.eq(0).text().trim();
      data['Drivers'] = tds.eq(1).text().trim();
    }
  });
  return data;
}

// Worker thread code
if (!isMainThread) {
  // This code only runs in worker threads
  parentPort.on('message', (html) => {
    const data = extractCompanyData(html);
    parentPort.postMessage(data);
  });
} else {
  // Main thread code - only runs in the main thread
  async function main() {
    // Set up readline for user input
    const rl = readline.createInterface({ input, output });

    const startMC = parseInt(await rl.question("Enter starting MC/MX Number: "), 10);
    const count = parseInt(await rl.question("Enter how many MC/MX Number's to scrape: "), 10);
    // Ask for concurrency limit with a reasonable default
    const concurrencyLimit = parseInt(await rl.question("Enter concurrency limit (recommended: 5): "), 10) || 5;
    rl.close();

    console.log(`🚀 Starting scraper with concurrency limit of ${concurrencyLimit}`);
    console.log(`🔄 Will process all ${count} MC/MX numbers in batches of ${concurrencyLimit}`);

    // Function to fetch HTML for a given MC number
    async function fetchMCHtml(MCNumber) {
      const url = `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${MCNumber}`;
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`❌ Failed to fetch MC/MX Number ${MCNumber}`);
        return null;
      }
      return await res.text();
    }

    // Function to handle fetching HTML and processing it with worker threads
    function processHtmlWithWorker(html) {
      return new Promise((resolve, reject) => {
        const worker = new Worker(__filename, {
          workerData: { currentFile: __filename }
        });
        worker.on('message', (data) => {
          resolve(data);
          worker.terminate(); // Terminate worker after getting the data
        });
        worker.on('error', reject);
        worker.on('exit', (code) => {
          if (code !== 0) reject(new Error(`Worker stopped with exit code ${code}`));
        });
        worker.postMessage(html);
      });
    }

    // Function to handle fetching and processing all MC Numbers with concurrency limit
    const allData = [];
    const startTime = Date.now();

    async function fetchAndProcessMCData() {
      // Create an array of all MC numbers to process
      const mcNumbers = [];
      for (let i = 0; i < count; i++) {
        mcNumbers.push(startMC + i);
      }
      
      // Process MC numbers with controlled concurrency
      const batchCount = Math.ceil(mcNumbers.length / concurrencyLimit);
      console.log(`📋 Processing in ${batchCount} batches...`);
      
      let processed = 0;
      let successful = 0;
      
      // Process MC numbers in parallel with limited concurrency
      for (let i = 0; i < mcNumbers.length; i += concurrencyLimit) {
        // Get the current batch
        const batch = mcNumbers.slice(i, i + concurrencyLimit);
        console.log(`\n🔄 Starting batch ${Math.floor(i/concurrencyLimit) + 1} of ${batchCount}...`);
        
        // Process each MC number in the current batch concurrently
        const batchPromises = batch.map(async (mcNumber) => {
          console.log(`🔍 Scraping MC/MX Number: ${mcNumber} (${++processed}/${count})`);
          
          try {
            const html = await fetchMCHtml(mcNumber);
            if (html) {
              const data = await processHtmlWithWorker(html);
              if (data.error) {
                console.log(`${mcNumber}: ${data.error}`);
                return null;
              } else {
                console.log(`✅ Successfully scraped MC/MX Number: ${mcNumber}`);
                successful++;
                return data;
              }
            }
          } catch (error) {
            console.log(`❌ Error processing MC/MX Number ${mcNumber}: ${error.message}`);
            return null;
          }
          return null;
        });
        
        // Wait for all promises in this batch to resolve
        const batchResults = await Promise.all(batchPromises);
        
        // Add successful results to allData
        batchResults.forEach(result => {
          if (result) allData.push(result);
        });
        
        console.log(`✅ Completed batch ${Math.floor(i/concurrencyLimit) + 1}: processed ${batch.length} MC numbers`);
      }
      
      console.log(`\n🏁 Finished processing all ${count} MC numbers (${successful} successful)`);
    }

    // Run the fetch and process operation
    await fetchAndProcessMCData();

    // Convert the collected data to CSV
    if (allData.length > 0) {
      console.log('✅ Data scraped successfully!');
      console.log(`📊 Total records scraped: ${allData.length}`);
      const csv = parse(allData);
      fs.writeFileSync('scraped_data.csv', csv);
      console.log('✅ Data exported to scraped_data.csv');
    } else {
      console.log('❌ No data to export.');
    }

    console.log(`⏱️ Execution time: ${(Date.now() - startTime) / 1000} seconds`);
    
    // Explicitly exit the process
    process.exit(0);
  }

  // Run the main function
  main().catch(console.error);
}
