import { useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/hooks/useSocket";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import VideoInfo from "@/components/Processing/VideoInfo";
import ProgressBar from "@/components/Processing/ProgressBar";
import ProcessingSteps from "@/components/Processing/ProcessingSteps";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Processing() {
  const { jobId } = useParams();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { socket } = useSocket();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: jobData, isLoading: jobLoading, refetch } = useQuery<any>({
    queryKey: ["/api/jobs", jobId, "progress"],
    enabled: !!jobId && isAuthenticated,
    refetchInterval: jobData?.status === 'PROCESSING' ? 2000 : false,
    retry: false,
  });

  // WebSocket for real-time updates
  useEffect(() => {
    if (socket && jobId) {
      socket.send(JSON.stringify({
        type: 'subscribe',
        jobId: parseInt(jobId!)
      }));

      const handleMessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'progress' && data.jobId === parseInt(jobId!)) {
            refetch();
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };

      socket.addEventListener('message', handleMessage);

      return () => {
        socket.removeEventListener('message', handleMessage);
      };
    }
  }, [socket, jobId, refetch]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (jobLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const job = jobData as any;
  const document = job?.document;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-lg font-semibold text-foreground">Processing Document</span>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span data-testid="text-processing-status">
                {job?.status === 'COMPLETED' ? 'Completed' : 'Processing...'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Video Information */}
        {document && (
          <VideoInfo
            title={document.videoTitle || 'Processing Video'}
            duration={document.videoDuration || 0}
            documentType={document.documentType}
            youtubeUrl={document.youtubeUrl}
          />
        )}

        {/* Progress Section */}
        <div className="bg-card border border-border rounded-xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-semibold text-foreground mb-2">Processing Your Document</h3>
            <p className="text-muted-foreground">
              Our AI is transforming your video into a professional {document?.documentType?.toLowerCase()}
            </p>
          </div>

          {/* Overall Progress */}
          <ProgressBar 
            progress={job?.progress || 0}
            status={job?.status || 'PENDING'}
          />

          {/* Processing Steps */}
          <ProcessingSteps 
            currentStep={job?.currentStep}
            progress={job?.progress || 0}
            status={job?.status || 'PENDING'}
            errorMessage={job?.errorMessage}
          />

          {/* Navigation */}
          {job?.status === 'COMPLETED' && document && (
            <div className="mt-8 text-center">
              <Link href={`/editor/${document.id}`}>
                <Button size="lg" data-testid="button-view-document">
                  View Document
                </Button>
              </Link>
            </div>
          )}

          {job?.status === 'FAILED' && (
            <div className="mt-8 text-center">
              <Link href="/">
                <Button variant="outline" size="lg" data-testid="button-try-again">
                  Try Again
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
