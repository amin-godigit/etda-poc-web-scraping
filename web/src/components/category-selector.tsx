"use client";

import type { Category } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function CategorySelector({
  categories,
  selectedCategory,
  onSelectCategory,
  disabled = false,
  isLoading = false,
}: CategorySelectorProps) {
  return (
    <div className="space-y-2">
      <Select
        disabled={disabled}
        value={selectedCategory?.id}
        onValueChange={(value) => {
          const category = categories.find((cat) => cat.id === value);
          if (category) {
            onSelectCategory(category);
          }
        }}
      >
        <SelectTrigger id="category-select" className="w-full">
          <SelectValue
            placeholder={
              isLoading ? "Loading categories..." : "Select a category"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
