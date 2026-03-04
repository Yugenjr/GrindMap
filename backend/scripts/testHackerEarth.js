import puppeteer from 'puppeteer';

async function testScraper(username) {
    console.log(`Testing HackerEarth scraper for user: ${username}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: "new"
        });
        const page = await browser.newPage();

        // Improved Anti-Bot Headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Referer': 'https://www.google.com/'
        });

        console.log('Browser launched with headers...');
        const url = `https://www.hackerearth.com/@${username}`;
        console.log(`Navigating to ${url}...`);

        // Wait slightly longer and wait for network idle
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

        const title = await page.title();
        console.log(`Page title: ${title}`);

        if (title.includes("403")) {
            console.error("STILL 403 Forbidden. Try running in non-headless mode locally if possible, or use a proxy.");
            return;
        }

        const data = await page.evaluate(() => {
            // debug: get all text to see if we loaded the right page
            const bodyText = document.body.innerText.slice(0, 500);

            const stats = {
                rating: 0,
                solved: 0,
                badges: 0
            };

            // Try finding rating
            const ratingEl = document.querySelector('.rating-count') ||
                document.querySelector('.user-details .rating') ||
                document.querySelector('.rating'); // generic

            // Try finding solved
            // Look for any element containing number followed by "Problems Solved"
            // or "Problems Solved" followed by number
            const allDivs = Array.from(document.querySelectorAll('div, span, p'));
            const solvedEl = allDivs.find(el => el.innerText && el.innerText.toLowerCase().includes('problems solved'));

            if (ratingEl) {
                stats.rating = parseInt(ratingEl.innerText.replace(/[^0-9]/g, ''), 10) || 0;
            }

            if (solvedEl) {
                const match = solvedEl.innerText.match(/(\d+)/);
                if (match) stats.solved = parseInt(match[0], 10);
            }

            return {
                stats,
                debug: {
                    ratingFound: !!ratingEl,
                    ratingText: ratingEl ? ratingEl.innerText : null,
                    solvedFound: !!solvedEl,
                    solvedText: solvedEl ? solvedEl.innerText : null,
                    excerpt: bodyText
                }
            };
        });

        console.log('Scraping Result:', JSON.stringify(data, null, 2));

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        if (browser) await browser.close();
    }
}

const user = process.argv[2] || 'tourist'; // Default to tourist if no arg
testScraper(user);
