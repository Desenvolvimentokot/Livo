import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Video, Check, Link as LinkIcon, FileText } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-muted/30 to-accent/10 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Transform YouTube Videos into 
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  {" "}Professional Documents
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Convert any YouTube video into beautifully formatted ebooks, tutorials, guides, and recipes using AI-powered content structuring.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-lg font-semibold"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-start-converting"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Converting
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg font-semibold"
                data-testid="button-watch-demo"
              >
                <Video className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500" />
                <span>Free 30 Minutes</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            {/* Modern YouTube to Document Animation Mockup */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
              <div className="space-y-6">
                {/* YouTube URL Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">YouTube URL</label>
                  <div className="relative">
                    <Input 
                      type="url" 
                      placeholder="https://youtube.com/watch?v=..." 
                      className="pr-12"
                      data-testid="input-youtube-url"
                    />
                    <LinkIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                {/* Document Type Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className="p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
                    data-testid="button-type-ebook"
                  >
                    <FileText className="h-6 w-6 text-primary mb-2 mx-auto" />
                    <span className="text-sm font-medium">E-book</span>
                  </button>
                  <button 
                    className="p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-center"
                    data-testid="button-type-tutorial"
                  >
                    <div className="h-6 w-6 text-secondary mb-2 mx-auto">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                      </svg>
                    </div>
                    <span className="text-sm font-medium">Tutorial</span>
                  </button>
                </div>
                
                {/* Convert Button */}
                <Button 
                  className="w-full py-3 font-semibold bg-gradient-to-r from-primary to-secondary"
                  data-testid="button-convert"
                >
                  Convert to Document
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
