"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorDisplayProps {
  error: string
  onTryAgain: () => void
}

export function ErrorDisplay({ error, onTryAgain }: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />

      <div className="text-center">
        <h3 className="text-lg font-medium text-destructive">Error: Unable to complete the operation</h3>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>

      <Button onClick={onTryAgain} variant="outline">
        Try Again
      </Button>
    </div>
  )
}
