import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import StatsCard from "@/components/Dashboard/StatsCard";
import DocumentsList from "@/components/Dashboard/DocumentsList";
import NewDocumentForm from "@/components/Dashboard/NewDocumentForm";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Documents Created"
            value={(stats as any)?.documentsCount || 0}
            icon="file-text"
            color="primary"
            data-testid="stat-documents"
          />
          <StatsCard
            title="Hours Processed"
            value={(stats as any)?.hoursUsed || 0}
            icon="clock"
            color="secondary"
            data-testid="stat-hours"
          />
          <StatsCard
            title="Current Plan"
            value="Free"
            icon="user"
            color="accent"
            data-testid="stat-plan"
          />
          <StatsCard
            title="Success Rate"
            value={`${(stats as any)?.successRate || 0}%`}
            icon="check"
            color="green"
            data-testid="stat-success"
          />
        </div>

        {/* New Document Form */}
        <NewDocumentForm />

        {/* Recent Documents */}
        <DocumentsList />
      </div>
    </div>
  );
}
