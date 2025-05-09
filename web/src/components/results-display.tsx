"use client";

import { useState } from "react";
import type { ScrapingResult } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { useMediaQuery } from "@/hooks/use-media-query";
import { StarRating } from "./star-rating";

interface ResultsDisplayProps {
  results: ScrapingResult;
}

export function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const totalPages = Math.ceil(results.data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = results.data.slice(startIndex, endIndex);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = startPage + maxPagesToShow - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, index) => startPage + index
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Results for: {results?.category?.name} ({results?.totalItems}{" "}
          products)
        </h3>
        <p className="text-sm text-muted-foreground">
          Scraped at: {new Date(results?.scrapedAt)?.toLocaleString()}
        </p>
      </div>

      {isDesktop ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Sold</TableHead>
              <TableHead>Seller</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium whitespace-normal break-words w-140 min-w-140">
                  {product?.name}
                </TableCell>
                <TableCell>{formatPrice(product?.price)}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {StarRating({
                      rating: Number(product?.rating.toFixed(1)),
                      readOnly: true,
                      size: "sm",
                    })}
                    <span className="ml-1">
                      ({product?.rating?.toFixed(1) || 0})
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatNumber(product?.sold) || "-"}</TableCell>
                <TableCell>{product?.seller?.name || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="space-y-4">
          {currentItems.map((product, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="font-medium">{product?.name}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p>Price:</p>
                    <p>{formatPrice(product?.price)}</p>

                    <p>Rating:</p>
                    <div className="flex items-center">
                      {StarRating({
                        rating: Number(product?.rating.toFixed(1)),
                        readOnly: true,
                        size: "sm",
                      })}
                      <span className="ml-1">
                        ({product?.rating?.toFixed(1) || 0})
                      </span>
                    </div>

                    <p>Sold:</p>
                    <p>{formatNumber(product?.sold) || "-"}</p>

                    <p>Seller:</p>
                    <p>{product?.seller?.name || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? "disabled-class" : ""}
              />
            </PaginationItem>

            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  onClick={() => setCurrentPage(pageNumber)}
                  isActive={currentPage === pageNumber}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={currentPage === totalPages ? "disabled-class" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
