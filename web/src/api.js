const API_BASE_URL = "http://localhost:3001/api";

const Axios = {
  fetchCategories: async () => {
    const response = await fetch(`${API_BASE_URL}/categories`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch categories");
    }

    return data;
  },

  startScrape: async (categoryId, categoryUrl, limit = 100) => {
    const response = await fetch(`${API_BASE_URL}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ categoryId, categoryUrl, limit }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to start scraping");
    }

    return data;
  },

  checkStatus: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/status/${jobId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to check status");
    }

    return data;
  },

  getResults: async (jobId) => {
    const response = await fetch(`${API_BASE_URL}/results/${jobId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to fetch results");
    }

    return data;
  },
};

export default Axios;
