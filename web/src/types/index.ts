export interface Category {
  id: string;
  name?: string;
  display_name?: string;
}

export interface ScrapingJob {
  jobId: string;
  status: "scraping" | "completed" | "error";
  categoryId: string;
}

export interface ProductData {
  id: string;
  name: string;
  price: number;
  rating: number;
  reviews: number;
  sold: number;
  seller: {
    name: string;
    rating: number;
  };
  url: string;
  imageUrl: string;
}

export interface ScrapingResult {
  success: boolean;
  jobId: string;
  category: {
    id: string;
    name: string;
  };
  totalItems: number;
  scrapedAt: string;
  data: ProductData[];
}
