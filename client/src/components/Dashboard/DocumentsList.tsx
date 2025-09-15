import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { FileText, Download, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

export default function DocumentsList() {
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["/api/documents"],
    retry: false,
  });

  const documents = (documentsData as any)?.documents || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PROCESSING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'TUTORIAL':
        return <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <div className="w-5 h-5 text-secondary">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
          </div>
        </div>;
      default:
        return <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <FileText className="h-5 w-5 text-primary" />
        </div>;
    }
  };

  const handleDownload = async (documentId: number, title: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${title || 'document'}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-32"></div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Documents</h2>
        <Button variant="ghost" size="sm" data-testid="button-view-all">
          View All
        </Button>
      </div>
      
      <div className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8" data-testid="text-no-documents">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No documents created yet</p>
            <p className="text-sm text-muted-foreground mt-2">Create your first document using the form above</p>
          </div>
        ) : (
          documents.map((doc: any) => (
            <div 
              key={doc.id} 
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              data-testid={`document-${doc.id}`}
            >
              <div className="flex items-center space-x-4">
                {getDocumentIcon(doc.documentType)}
                <div>
                  <h3 className="font-medium text-foreground" data-testid={`document-title-${doc.id}`}>
                    {doc.videoTitle || 'Untitled Document'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {doc.documentType.charAt(0) + doc.documentType.slice(1).toLowerCase()} • 
                    Created {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  className={getStatusColor(doc.status)}
                  data-testid={`document-status-${doc.id}`}
                >
                  {doc.status === 'PROCESSING' && <Clock className="h-3 w-3 mr-1" />}
                  {doc.status === 'FAILED' && <AlertCircle className="h-3 w-3 mr-1" />}
                  {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                </Badge>
                {doc.status === 'COMPLETED' ? (
                  <div className="flex items-center space-x-1">
                    <Link href={`/editor/${doc.id}`}>
                      <Button variant="ghost" size="sm" data-testid={`button-edit-${doc.id}`}>
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownload(doc.id, doc.videoTitle)}
                      data-testid={`button-download-${doc.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ) : doc.status === 'PROCESSING' ? (
                  <Link href={`/processing/${doc.id}`}>
                    <Button variant="ghost" size="sm" data-testid={`button-view-progress-${doc.id}`}>
                      View Progress
                    </Button>
                  </Link>
                ) : (
                  <div className="w-8 h-8"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
