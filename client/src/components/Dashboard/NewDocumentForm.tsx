import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, FileText, Map, Utensils, PresentationIcon, FileText as Summary } from "lucide-react";
import { useLocation } from "wouter";

const documentTypes = [
  { id: 'EBOOK', label: 'E-book', icon: FileText, color: 'primary' },
  { id: 'TUTORIAL', label: 'Tutorial', icon: FileText, color: 'secondary' },
  { id: 'GUIDE', label: 'Guide', icon: Map, color: 'accent' },
  { id: 'RECIPE', label: 'Recipe', icon: Utensils, color: 'orange' },
];

export default function NewDocumentForm() {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedType, setSelectedType] = useState('EBOOK');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processMutation = useMutation({
    mutationFn: async (data: { youtubeUrl: string; documentType: string }) => {
      const response = await apiRequest('POST', '/api/videos/process', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Processing Started",
        description: "Your video is being processed. You'll be redirected to the progress page.",
      });
      
      // Invalidate and refetch documents list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Redirect to processing page
      setLocation(`/processing/${data.jobId}`);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to start processing",
        variant: "destructive",
      });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (youtubeUrl: string) => {
      const response = await apiRequest('POST', '/api/videos/info', { youtubeUrl });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Video Validated",
        description: `Video duration: ${data.durationFormatted}. Ready to process!`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Validation Failed",
        description: error.message || "Could not validate YouTube URL",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }
    
    processMutation.mutate({ youtubeUrl: youtubeUrl.trim(), documentType: selectedType });
  };

  const handleValidate = () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL first",
        variant: "destructive",
      });
      return;
    }
    
    validateMutation.mutate(youtubeUrl.trim());
  };

  return (
    <div className="bg-card border border-border rounded-xl p-8 mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-6">Create New Document</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* YouTube URL Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">YouTube URL</label>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="pr-12"
                data-testid="input-youtube-url"
              />
              <Link className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
            <Button 
              type="button"
              variant="outline"
              onClick={handleValidate}
              disabled={validateMutation.isPending}
              data-testid="button-validate"
            >
              {validateMutation.isPending ? 'Validating...' : 'Validate'}
            </Button>
          </div>
        </div>
        
        {/* Document Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Document Type</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {documentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  }`}
                  data-testid={`button-type-${type.id.toLowerCase()}`}
                >
                  <Icon className={`h-6 w-6 mb-2 mx-auto ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`} />
                  <span className={`text-sm font-medium ${
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {type.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex space-x-4">
          <Button 
            type="submit"
            size="lg"
            disabled={processMutation.isPending}
            data-testid="button-start-processing"
          >
            {processMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Start Processing
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="lg"
            data-testid="button-save-draft"
          >
            Save as Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
