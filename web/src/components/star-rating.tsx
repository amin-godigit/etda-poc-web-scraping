"use client";

import type React from "react";
import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  readOnly?: boolean;
  className?: string;
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = "md",
  color = "text-yellow-400",
  readOnly = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    if (readOnly) return;

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - left) / width;

    if (percent <= 0.5) {
      setHoverRating(index + 0.5);
    } else {
      setHoverRating(index + 1);
    }
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverRating(0);
  };

  const renderStar = (index: number) => {
    const displayRating = hoverRating || rating;
    const value = index + 1;

    const isFilled = displayRating >= value;
    const isHalfFilled =
      !isFilled && displayRating > index && displayRating < value;

    return (
      <div
        key={index}
        className={cn("relative cursor-pointer", readOnly && "cursor-default")}
        onMouseMove={(e) => handleMouseMove(e, index)}
        role={!readOnly ? "button" : undefined}
        tabIndex={!readOnly ? 0 : undefined}
        aria-label={
          !readOnly ? `Rate ${index + 1} out of ${maxRating}` : undefined
        }
      >
        <Star
          className={cn("stroke-current text-gray-300", sizeClasses[size])}
        />
        {isHalfFilled && (
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star
              className={cn(
                "stroke-current fill-current",
                color,
                sizeClasses[size]
              )}
            />
          </div>
        )}
        {isFilled && (
          <Star
            className={cn(
              "absolute inset-0 stroke-current fill-current",
              color,
              sizeClasses[size]
            )}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      onMouseLeave={handleMouseLeave}
      role="group"
      aria-label={`${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }).map((_, index) => renderStar(index))}
    </div>
  );
}
