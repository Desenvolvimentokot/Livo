import { useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import DocumentPreview from "@/components/Editor/DocumentPreview";
import EditorSidebar from "@/components/Editor/EditorSidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Save, Download, FileText, FileDown, ChevronDown } from "lucide-react";
import { Link } from "wouter";

export default function Editor() {
  const { documentId } = useParams();
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

  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ["/api/documents", documentId],
    enabled: !!documentId && isAuthenticated,
    retry: false,
  });

  const handleDownloadHtml = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${(document as any)?.videoTitle || 'document'}.html`;
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document HTML downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download HTML document",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/pdf`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('PDF generation failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = globalThis.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${(document as any)?.videoTitle || 'document'}.pdf`;
      globalThis.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Document PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF document",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (documentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex h-screen">
          <div className="w-80 bg-card border-r border-border animate-pulse"></div>
          <div className="flex-1 bg-muted/30 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Document Not Found</h2>
            <p className="text-muted-foreground mb-8">The document you're looking for doesn't exist or you don't have access to it.</p>
            <Link href="/">
              <Button data-testid="button-back-home">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="button-back">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-lg font-semibold text-foreground" data-testid="text-document-title">
                {(document as any)?.videoTitle || 'Untitled Document'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  toast({
                    title: "Feature Coming Soon",
                    description: "Save Draft functionality will be available in a future update.",
                    variant: "default",
                  });
                }}
                data-testid="button-save"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" data-testid="button-export">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadHtml} data-testid="button-download-html">
                    <FileText className="h-4 w-4 mr-2" />
                    Download HTML
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPdf} data-testid="button-download-pdf">
                    <FileDown className="h-4 w-4 mr-2" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen">
        {/* Editor Sidebar */}
        <EditorSidebar document={document} />
        
        {/* Document Preview */}
        <DocumentPreview document={document} />
      </div>
    </div>
  );
}
