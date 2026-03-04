import puppeteer from 'puppeteer';

export async function scrapeHackerEarth(username) {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: "new"
        });
        const page = await browser.newPage();

        // Optimize: Block resources for speed
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // Anti-bot headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Referer': 'https://www.google.com/'
        });

        const url = `https://www.hackerearth.com/@${username}`;
        // Go to page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Check if 403 or 404
        const title = await page.title();
        if (title.includes("403 Forbidden")) {
            throw new Error("Access Denied (403): HackerEarth blocked the scraper.");
        }

        // Check if 404
        const content = await page.content();
        if (content.includes("This link is broken") || content.includes("Page not found")) {
            throw new Error("User not found");
        }

        const data = await page.evaluate(() => {
            const stats = {
                rating: 0,
                solved: 0,
                badges: 0,
                activity: 0
            };

            // Rating: Look for specific class or text
            // Example structure: <div class="rating">1629</div>
            const ratingEl = document.querySelector('.rating-count') ||
                document.querySelector('.rating') ||
                Array.from(document.querySelectorAll('span')).find(el => el.textContent.includes('Rating'));

            if (ratingEl) {
                const text = ratingEl.innerText || ratingEl.textContent;
                const match = text.match(/(\d+)/);
                if (match) stats.rating = parseInt(match[0], 10);
            }

            // Solved: Look for "Problems Solved" text specifically
            // This is often in a profile-overview or similar section
            const solvedContainers = Array.from(document.querySelectorAll('div, span, p, td'));
            const solvedLabel = solvedContainers.find(el =>
                el.innerText && /Problems Solved/i.test(el.innerText) && el.innerText.length < 50
            );

            if (solvedLabel) {
                // The number is likely in the label text itself or a sibling/parent
                let text = solvedLabel.innerText;
                let match = text.match(/(\d+)/);

                // If not in the label text (e.g. "Problems Solved"), check nearby
                if (!match && solvedLabel.nextElementSibling) {
                    text = solvedLabel.nextElementSibling.innerText;
                    match = text.match(/(\d+)/);
                }

                if (match) stats.solved = parseInt(match[0], 10);
            }

            // Badges
            // Badges
            // Check for explicit count first
            const badgeCountEl = document.querySelector('.badges-count') ||
                Array.from(document.querySelectorAll('.value')).find(el => el.parentElement && el.parentElement.innerText.includes('Badges'));

            if (badgeCountEl) {
                stats.badges = parseInt(badgeCountEl.innerText, 10) || 0;
            } else {
                // Fallback to counting elements
                stats.badges = document.querySelectorAll('.badge, .badge-item').length;
            }

            // Recent Activity
            // Look for a number in an "Activity" tab or section
            const activityTab = Array.from(document.querySelectorAll('a, div, span')).find(el =>
                el.innerText && /Activity/i.test(el.innerText) && /\d+/.test(el.innerText)
            );

            if (activityTab) {
                const match = activityTab.innerText.match(/(\d+)/);
                if (match) stats.activity = parseInt(match[0], 10);
            } else {
                // Approximate by counting feed items if visible
                stats.activity = document.querySelectorAll('.activity-item, .feed-item, .timeline-item').length;
            }

            return stats;
        });

        return {
            platform: "HACKEREARTH",
            username,
            data: {
                ...data,
                status: "success"
            }
        };

    } catch (err) {
        if (err.message === "User not found") throw err;
        console.error("HackerEarth scraping error:", err);
        throw new Error("Failed to fetch HackerEarth data");
    } finally {
        if (browser) await browser.close();
    }
}
