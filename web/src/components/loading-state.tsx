import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  progress: number
}

export function LoadingState({ progress }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="flex items-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <h3 className="text-lg font-medium">Scraping in progress...</h3>
      </div>

      <div className="text-center">
        <p className="mb-2">{progress} of 100 products scraped</p>
        <Progress value={progress} className="w-64 h-2" />
        <p className="mt-2 text-sm text-muted-foreground">{progress}%</p>
      </div>
    </div>
  )
}
