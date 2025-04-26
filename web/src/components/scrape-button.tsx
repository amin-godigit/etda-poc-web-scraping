"use client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ScrapeButtonProps {
  onStartScrape: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ScrapeButton({
  onStartScrape,
  disabled = false,
  isLoading = false,
}: ScrapeButtonProps) {
  return (
    <Button onClick={onStartScrape} disabled={disabled} className="w-full h-10">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Starting...
        </>
      ) : (
        "Start Scrape"
      )}
    </Button>
  );
}
