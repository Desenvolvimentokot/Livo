import { apiRequest } from "@/lib/queryClient";

export interface VideoInfo {
  videoId: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  hoursNeeded: number;
  canProcess: boolean;
  hoursAvailable: number;
}

export interface ProcessingJob {
  success: boolean;
  documentId: number;
  jobId: number;
  estimatedDuration: number;
  processingTime: number;
}

export interface JobProgress {
  jobId: number;
  status: string;
  progress: number;
  currentStep?: string;
  errorMessage?: string;
  document?: any;
}

export interface DashboardStats {
  documentsCount: number;
  hoursUsed: number;
  hoursLimit: number;
  successRate: number;
}

export interface DocumentListResponse {
  documents: Array<{
    id: number;
    youtubeUrl: string;
    videoTitle?: string;
    documentType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    fileSize?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const api = {
  // Video processing
  async validateVideo(youtubeUrl: string): Promise<VideoInfo> {
    const response = await apiRequest('POST', '/api/videos/info', { youtubeUrl });
    return response.json();
  },

  async processVideo(youtubeUrl: string, documentType: string): Promise<ProcessingJob> {
    const response = await apiRequest('POST', '/api/videos/process', {
      youtubeUrl,
      documentType
    });
    return response.json();
  },

  // Job management
  async getJobProgress(jobId: number): Promise<JobProgress> {
    const response = await apiRequest('GET', `/api/jobs/${jobId}/progress`);
    return response.json();
  },

  // Documents
  async getDocuments(page = 1, limit = 10): Promise<DocumentListResponse> {
    const response = await apiRequest('GET', `/api/documents?page=${page}&limit=${limit}`);
    return response.json();
  },

  async getDocument(documentId: number): Promise<any> {
    const response = await apiRequest('GET', `/api/documents/${documentId}`);
    return response.json();
  },

  async downloadDocument(documentId: number): Promise<Blob> {
    const response = await apiRequest('GET', `/api/documents/${documentId}/download`);
    return response.blob();
  },

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiRequest('GET', '/api/dashboard/stats');
    return response.json();
  },

  // Queue stats
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const response = await apiRequest('GET', '/api/queue/stats');
    return response.json();
  }
};

export default api;
