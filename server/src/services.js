const path = require("path");
const fs = require("fs/promises");

const BASE_URL = "https://shopee.co.th/api/v4";

const getAllCategories = async () => {
  try {
    const categoriesResponse = await fetch(
      `${BASE_URL}/pages/get_homepage_category_list`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      }
    );

    console.log("Fetching categories...");

    if (!categoriesResponse.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await categoriesResponse.json();
    return data;
  } catch (error) {
    console.error("Error fetching categories:", error);

    try {
      const filePath = path.resolve(
        __dirname,
        "./data/sp_categories_tree.json"
      );
      const categoriesData = await fs.readFile(filePath, "utf-8");
      return JSON.parse(categoriesData);
    } catch (fileError) {
      console.error("Error reading local category file:", fileError);
      throw new Error(
        "Unable to fetch categories from both API and local file"
      );
    }
  }
};

const getAllDailyProductsWithCategory = async (offset) => {
  try {
    const response = await fetch(
      `${BASE_URL}/homepage/get_daily_discover?bundle=daily_discover_main&limit=100&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
        },
      }
    );

    console.log("Fetching daily products with category...");

    if (!response.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await response.json();
    return data.data?.feeds;
  } catch (error) {
    console.error("Error fetching categories:", error);

    try {
      const fileName = `sp_products_${offset}.json`;
      const filePath = path.resolve(__dirname, `./data/${fileName}`);
      const productsData = await fs.readFile(filePath, "utf-8");
      const productsParsed = JSON.parse(productsData)?.data?.feeds;

      return productsParsed;
    } catch (fileError) {
      console.error("Error reading local category file:", fileError);
      throw new Error(
        "Unable to fetch categories from both API and local file"
      );
    }
  }
};

module.exports = {
  getAllCategories,
  getAllDailyProductsWithCategory,
};
