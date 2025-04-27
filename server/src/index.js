const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const {
  getAllCategories,
  getAllDailyProductsWithCategory,
} = require("./services");
const rateLimit = require("express-rate-limit");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

const jobs = new Map();
const results = new Map();
const categoriesMap = new Map();
const activeScrapeJobs = new Map();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: "Too many requests",
    message: "You have exceeded the 60 requests in 1 minute limit",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

function limitOneScrapeJobPerIp(req, res, next) {
  const ip = req.ip;

  if (req.path === "/api/scrape" && req.method === "POST") {
    if (activeScrapeJobs.has(ip)) {
      return res.status(429).json({
        success: false,
        error: "Too many scrape jobs",
        message: `You already have an active scraping job (jobId: ${activeScrapeJobs.get(
          ip
        )}). Please wait until it finishes.`,
      });
    }
  }
  next();
}

app.use(limitOneScrapeJobPerIp);

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
    const { categoryId, limit = 50 } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters",
        message: "Category ID is required",
      });
    }

    const jobId = `job_${uuidv4()}`;

    const ip = req.ip;

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

    activeScrapeJobs.set(ip, jobId);

    scrapeCategory(jobId, categoryId, limit, (progress, status, error) => {
      const job = jobs.get(jobId);
      if (job) {
        job.progress = progress;
        job.status = status;
        if (error) {
          job.error = error;
        }
        if (status === "completed") {
          job.completedAt = new Date().toISOString();
          if (activeScrapeJobs.get(ip) === jobId) {
            activeScrapeJobs.delete(ip);
          }
        }
        jobs.set(jobId, job);
      }
    }).catch((error) => {
      console.error("Scrape error", error);
      const job = jobs.get(jobId);
      if (job) {
        job.status = "error";
        job.error = error.message;
        jobs.set(jobId, job);
        if (activeScrapeJobs.get(ip) === jobId) {
          activeScrapeJobs.delete(ip);
        }
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
    const categories = await getAllCategories();
    if (categories?.data?.category_list?.length) {
      for (const category of categories.data.category_list) {
        const { catid, parent_catid, children, ...rest } = category;
        const isMain = category.level === 1 || parent_catid === 0;
        const newCategory = {
          id: catid,
          isMain,
          parentId: isMain ? null : parent_catid,
          ...rest,
        };
        categoriesMap.set(newCategory.id, newCategory);

        if (children?.length) {
          for (const subCategory of children) {
            const {
              catid: subCatId,
              parent_catid: subParentCatId,
              ...subRest
            } = subCategory;
            const newSubCategory = {
              id: subCatId,
              isMain: false,
              parentId: catid,
              ...subRest,
            };
            categoriesMap.set(newSubCategory.id, newSubCategory);
          }
        }
      }
    }

    return (
      categories?.data?.category_list
        .filter((cat) => cat.level === 1)
        .map(({ catid, children, ...rest }) => ({
          id: catid,
          ...rest,
        })) || []
    );
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn("Categories file not found");
      return [];
    } else {
      console.error("Error reading categories:", error);
      throw error;
    }
  }
};

const scrapeCategory = async (jobId, categoryId, limit, callback) => {
  const job = jobs.get(jobId);
  if (!job) {
    const error = `Job ${jobId} not found`;
    callback(0, "error", error);
    throw new Error(error);
  }

  const category = categoriesMap.get(categoryId);
  if (!category) {
    const error = `Main category with ID ${categoryId} not found`;
    callback(job.progress, "error", error);
    throw new Error(error);
  }

  try {
    let products = [];
    let currentPage = 1;
    const baseDelay = 1000;

    while (products.length < limit) {
      try {
        const productsParsed = await getAllDailyProductsWithCategory(
          categoryId,
          currentPage
        );
        if (Array.isArray(productsParsed)) {
          if (productsParsed.length === 0) {
            console.warn(
              `No data available for page ${currentPage}, stopping.`
            );
            break;
          }

          for (const product of productsParsed) {
            if (products.length >= limit) break;
            if (
              product?.item_card?.item?.itemid ||
              product?.ads_item_card?.ads?.itemid
            ) {
              products.push({
                id:
                  product?.item_card?.item?.itemid ||
                  product?.ads_item_card?.ads?.itemid ||
                  "",
                name:
                  product?.item_card?.item?.name ||
                  product?.ads_item_card?.ads?.name ||
                  "",
                price:
                  (product?.item_card?.item?.price ||
                    product?.ads_item_card?.ads?.price ||
                    0) / 10000,
                rating:
                  product?.item_card?.item?.item_rating?.rating_star ||
                  product?.ads_item_card?.ads?.item_rating?.rating_star ||
                  0,
                reviews:
                  (product?.item_card?.item?.item_rating?.rcount_with_context ||
                    0) +
                    (product?.item_card?.item?.item_rating?.rcount_with_image ||
                      0) ||
                  (product?.ads_item_card?.ads?.item_rating
                    ?.rcount_with_context || 0) +
                    (product?.ads_item_card?.ads?.item_rating
                      ?.rcount_with_image || 0),
                sold:
                  product?.item_card?.item?.sold ||
                  product?.ads_item_card?.ads?.sold ||
                  0,
                seller: {
                  id:
                    product?.item_card?.item?.shopid ||
                    product?.ads_item_card?.ads?.shopid ||
                    "",
                  name:
                    product?.item_card?.item?.shop_name ||
                    product?.ads_item_card?.ads?.shop_name ||
                    "",
                  rating: null,
                  verified:
                    product?.item_card?.item?.shopee_verified ||
                    product?.ads_item_card?.ads?.shopee_verified ||
                    false,
                  isOfficial:
                    product?.item_card?.item?.is_official_shop ||
                    product?.ads_item_card?.ads?.is_official_shop ||
                    false,
                },
                imageUrl: `https://down-th.img.susercontent.com/file/${
                  product?.item_card?.item?.image ||
                  product?.ads_item_card?.ads?.image ||
                  ""
                }`,
                url: "",
              });
            }

            const progress = (products.length / limit) * 100;
            callback(progress, "scraping", null);
          }
        } else {
          console.warn(
            `Data for page ${currentPage} is not an array, stopping.`
          );
          break;
        }
      } catch (err) {
        if (err.code === "ENOENT") {
          console.warn(`Data for page ${currentPage} not found, stopping.`);
          break;
        } else {
          console.error(`Error fetching page ${currentPage}:`, err);
          throw err;
        }
      }

      if (products.length < limit) {
        await new Promise((resolve) => setTimeout(resolve, baseDelay));
      }

      currentPage++;
    }

    if (products.length < limit) {
      console.log(
        `Warning: Only ${products.length} products found, but limit is ${limit}`
      );
    }

    job.products = products;
    jobs.set(jobId, job);

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
        totalItems: job.products?.length || 0,
        scrapedAt: new Date().toISOString(),
        data: job.products || [],
      });
    }
    callback(job?.progress || 0, "error", errorMessage);
    throw error;
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
