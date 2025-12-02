import Image from "next/image"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Image 
            src="/marketeam-logo.png" 
            alt="Marketeam Logo" 
            width={48} 
            height={48} 
            className="h-12 w-12 text-primary animate-pulse"
          />
          <span className="text-2xl font-serif font-bold text-primary ml-2">Marketeam</span>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        </div>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    </div>
  )
}
