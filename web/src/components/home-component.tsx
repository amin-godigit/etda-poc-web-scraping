"use client";
import { CategorySelector } from "./category-selector";
import { useEffect, useState } from "react";
import { Category, ScrapingJob, ScrapingResult } from "@/types";
import { ScrapeButton } from "./scrape-button";
import { LoadingState } from "./loading-state";
import { ErrorDisplay } from "./error-display";
import { ResultsDisplay } from "./results-display";
import Axios from "@/api";

const LIMIT = 100;

export default function HomeComponent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<ScrapingJob | null>(null);
  const [results, setResults] = useState<ScrapingResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setStatus("loading");
        const data = await Axios.fetchCategories();
        if (data.success) {
          setCategories(data.data);
        } else {
          setError(data.error || "Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Network error: Unable to fetch categories");
      } finally {
        setStatus("idle");
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (jobId && status === "scraping") {
      interval = setInterval(async () => {
        try {
          const statusData = await Axios.checkStatus(jobId);
          setProgress(statusData.progress);

          if (statusData.status === "completed") {
            setStatus("completed");
            clearInterval(interval);
            await new Promise((resolve) => setTimeout(resolve, 500));
            const resultsData = await Axios.getResults(jobId);
            setResults(resultsData);
          } else if (statusData.status === "error") {
            setStatus("error");
            setError(statusData.message || "Scraping job failed");
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Error checking job status:", err);
          setStatus("error");
          setError("Failed to check status");
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, status]);

  const handleStartScrape = async () => {
    if (!selectedCategory) return;

    try {
      setError(null);
      setResults(null);
      setProgress(0);
      setStatus("scraping");

      const data = await Axios.startScrape(selectedCategory.id, LIMIT);

      if (data.success) {
        setJobId(data.jobId);
      } else {
        setError(data.error || "Failed to start scraping");
      }
    } catch (err) {
      console.error("Error starting scraping:", err);
      if (err instanceof Error) {
        setError(err?.message || "Network error: Unable to start scraping");
      } else {
        setError("An unknown error occurred");
      }
      setStatus("error");
    }
  };

  const handleTryAgain = () => {
    handleStartScrape();
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-6">
      <div className="w-full max-w-5xl space-y-6">
        <h1 className="text-2xl font-bold text-center border-b pb-4">
          Shopee Scraping Tool
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="w-full sm:w-2/3">
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              disabled={status === "loading" || status === "scraping"}
              isLoading={status === "loading"}
            />
          </div>
          <div className="w-full sm:w-1/3">
            <ScrapeButton
              onStartScrape={handleStartScrape}
              disabled={
                status === "loading" ||
                !selectedCategory ||
                status === "scraping"
              }
              isLoading={status === "scraping"}
            />
          </div>
        </div>

        <div className="border rounded-lg p-4 min-h-[400px]">
          {error ? (
            <ErrorDisplay error={error} onTryAgain={handleTryAgain} />
          ) : status && status === "scraping" ? (
            <LoadingState progress={progress} limit={LIMIT} />
          ) : results ? (
            <ResultsDisplay results={(results as ScrapingResult) || []} />
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              Results will appear here
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
