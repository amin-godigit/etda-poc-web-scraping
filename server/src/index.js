const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const app = express();
const PORT = process.env.PORT || 3001;

const jobs = new Map();
const results = new Map();
const categoriesMap = new Map();

app.use(cors());
app.use(express.json());

app.get("/api/categories", async (req, res) => {
  try {
    const categories = await fetchCategories();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      error: "Unable to fetch categories",
      message: error.message,
    });
  }
});

app.post("/api/scrape", async (req, res) => {
  try {
    const { categoryId, categoryUrl, limit = 50 } = req.body;

    if (!categoryId || !categoryUrl) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        message: "Category ID and categoryUrl are required",
      });
    }

    const jobId = `job_${uuidv4()}`;

    jobs.set(jobId, {
      id: jobId,
      categoryId,
      limit,
      status: "scraping",
      progress: 0,
      startedAt: new Date().toISOString(),
      error: null,
      completedAt: null,
      products: [],
    });

    scrapeCategory(
      jobId,
      categoryId,
      categoryUrl,
      limit,
      (progress, status, error) => {
        const job = jobs.get(jobId);
        if (job) {
          job.progress = progress;
          job.status = status;
          if (error) {
            job.error = error;
          }
          if (status === "completed") {
            job.completedAt = new Date().toISOString();
          }
          jobs.set(jobId, job);
        }
      }
    ).catch((error) => {
      console.error("TEST: Scrape error", error);
      const job = jobs.get(jobId);
      if (job) {
        job.status = "error";
        job.error = error.message;
        jobs.set(jobId, job);
      }
    });

    res.json({
      success: true,
      message: "Scraping initiated",
      jobId,
      estimatedTime: `${Math.ceil(limit / 10)} seconds`,
    });
  } catch (error) {
    console.error("Error starting scrape:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate scraping",
      message: error.message,
    });
  }
});

app.get("/api/status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: "Job not found",
      message: "No job with the specified ID exists",
    });
  }

  res.json({
    success: true,
    status: job.status,
    progress: Math.round(job.progress),
    message:
      job.status === "error"
        ? job.error
        : `${job.progress} out of ${job.limit} products scraped`,
    completedAt: job.completedAt,
    scrapedItems: job.products.length,
  });
});

app.get("/api/results/:jobId", (req, res) => {
  const { jobId } = req.params;

  const job = jobs.get(jobId);
  if (!job) {
    return res.status(404).json({
      success: false,
      error: "Job not found",
      message: "No job with the specified ID exists",
    });
  }

  if (job.status === "scraping") {
    return res.status(400).json({
      success: false,
      error: "Results not available",
      message: "The job is still running. Please wait until it completes.",
      partialData: job.products,
    });
  }

  if (job.status === "error") {
    return res.status(400).json({
      success: false,
      error: "Results not available",
      message: `The job has failed: ${job.error || "Unknown error"}`,
      partialData: job.products,
    });
  }

  const result = results.get(jobId);

  if (!result) {
    return res.status(500).json({
      success: false,
      error: "Results not available",
      message:
        "The job completed but no results were found. This may be a server error.",
      partialData: job.products,
    });
  }

  res.json({
    success: true,
    ...result,
  });
});

const fetchCategories = async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    await page.goto("https://www.lazada.co.th/#hp-categories", {
      waitUntil: "networkidle2",
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const content = await page.content();
    const $ = cheerio.load(content);

    const categories = [];

    categoriesMap.clear();

    $(".card-categories-ul > div").each((index, element) => {
      const title = $(element).find("p").text().trim();
      const url = $(element).find("a").attr("href") || "";
      const category = {
        name: title,
        url: url.replace(/^\/\//, "https://"),
        id: index.toString(),
      };
      categories.push(category);
      categoriesMap.set(category.id, category);
    });

    await browser.close();

    return categories || [];
  } catch (error) {
    console.error("Error during fetching categories:", error);
    throw error;
  }
};

const scrapeCategory = async (
  jobId,
  categoryId,
  categoryUrl,
  limit,
  callback
) => {
  const job = jobs.get(jobId);
  if (!job) {
    const error = `Job ${jobId} not found`;
    callback(0, "error", error);
    throw new Error(error);
  }

  if (!categoryUrl || !categoryId) {
    const error = `Category with ID ${categoryId} - ${categoryUrl} not found`;
    callback(job.progress, "error", error);
    throw new Error(error);
  }

  const category = categoriesMap.get(categoryId);
  if (!category) {
    const error = `Category with ID ${categoryId} not found in categories`;
    callback(job.progress, "error", error);
    throw new Error(error);
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    let products = [];
    let currentPage = 1;

    while (products.length < limit) {
      console.log(`Scraping page ${currentPage}: ${categoryUrl}`);
      await page.goto(categoryUrl, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });

      await page.waitForSelector('div[data-qa-locator="general-products"]', {
        timeout: 10000,
      });

      const scrollToBottom = async () => {
        const scrollStep = 500;
        const delayBetweenSteps = 500;
        const maxSteps = 50;

        const stepCount = await page.evaluate(
          async (step, delay, maxSteps) => {
            let currentPosition = 0;
            let maxHeight = document.body.scrollHeight;
            let stepCount = 0;

            while (currentPosition < maxHeight && stepCount < maxSteps) {
              currentPosition += step;
              window.scrollTo(0, currentPosition);

              maxHeight = document.body.scrollHeight;
              stepCount++;

              await new Promise((resolve) => setTimeout(resolve, delay));
            }

            return stepCount;
          },
          scrollStep,
          delayBetweenSteps,
          maxSteps
        );

        if (stepCount >= maxSteps) {
          console.log(
            `Page ${currentPage}: Reached max scroll steps (${maxSteps}), stopping scroll.`
          );
        }
      };

      await scrollToBottom();
      const waitForImagesToLoad = async (maxRetries = 3, retryDelay = 2000) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            await page.waitForSelector(
              'div[data-qa-locator="general-products"] div > div > div > div > div > a > div > img',
              {
                timeout: 5000,
              }
            );

            const allImagesLoaded = await page.evaluate(() => {
              const images = document.querySelectorAll(
                'div[data-qa-locator="general-products"] div > div > div > div > div > a > div > img'
              );
              return Array.from(images).every((img) => {
                const src = img.getAttribute("src");
                return src && !src.startsWith("data:image");
              });
            });

            if (allImagesLoaded) {
              console.log(
                `Page ${currentPage}: All images loaded successfully.`
              );
              return true;
            } else {
              console.log(
                `Page ${currentPage}: Some images not loaded yet, retrying (${attempt}/${maxRetries})...`
              );
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
            }
          } catch (error) {
            console.error(
              `Page ${currentPage}: Error waiting for images (attempt ${attempt}/${maxRetries}):`,
              error
            );
            if (attempt === maxRetries) {
              console.log(
                `Page ${currentPage}: Max retries reached, proceeding with scraping.`
              );
              return false;
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
        return false;
      };

      await waitForImagesToLoad();

      const content = await page.content();
      const $ = cheerio.load(content);

      const elements = $(
        'div[data-qa-locator="general-products"] > div'
      ).toArray();
      console.log(
        `Page ${currentPage} - Total elements found: ${elements.length}`
      );

      for (const [index, element] of elements.entries()) {
        if (products.length >= limit) {
          break;
        }

        const name = $(element).find("a").text().trim();
        const price = $(element)
          .find("div > div > div > div:nth-child(2) > div:nth-child(3) > span")
          .text()
          .trim()
          .replace(/฿|,/g, "");
        const sold =
          $(element)
            .find(
              "div > div > div > div:nth-child(2) > div:nth-child(5) > span > span"
            )
            .text()
            .trim()
            .replace(/ชิ้น/g, "") || "0";
        const url =
          $(element).find("div > div > div > div > a").attr("href") || "";
        let image = $(element)
          .find("div > div > div > div > a > div > img")
          .attr("src");

        if (image) {
          if (image.startsWith("data:image")) {
            image = "";
          }
        } else {
          image = "No image found";
        }

        const data = {
          name,
          price: parseFloat(price) || 0,
          sold: parseInt(sold) || 0,
          image,
          url: url.replace(/^\/\//, "https://"),
        };

        products.push(data);
        job.products = products;
        jobs.set(jobId, job);

        const progress = (products.length / limit) * 100;
        callback(progress, "scraping", null);

        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const nextPageButton = await page.$('li[title="Next Page"] > button');
      if (!nextPageButton || products.length >= limit) {
        break;
      }

      const isDisabled = await page.evaluate(
        (button) => button.hasAttribute("disabled"),
        nextPageButton
      );
      if (isDisabled) {
        console.log(
          `Page ${currentPage}: Next Page button is disabled, stopping pagination.`
        );
        break;
      }

      await Promise.all([
        nextPageButton.click(),
        page.waitForSelector('div[data-qa-locator="general-products"]', {
          timeout: 60000,
        }),
      ]);
      await new Promise((resolve) => setTimeout(resolve, 2000));

      currentPage++;
    }

    if (products.length < limit) {
      console.log(
        `Warning: Only ${products.length} products found, but limit is ${limit}`
      );
    }

    results.set(jobId, {
      jobId,
      category: {
        id: categoryId,
        name: category.name,
      },
      totalItems: products.length,
      scrapedAt: new Date().toISOString(),
      data: products,
    });
    callback(100, "completed", null);

    await browser.close();
    return products;
  } catch (error) {
    console.error(`Scraping error for job ${jobId}:`, error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    const job = jobs.get(jobId);
    if (job) {
      results.set(jobId, {
        jobId,
        category: {
          id: categoryId,
          name: category.name,
        },
        totalItems: job.products.length,
        scrapedAt: new Date().toISOString(),
        data: job.products,
      });
    }
    callback(job?.progress || 0, "error", errorMessage);
    if (browser) await browser.close();
    throw error;
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
