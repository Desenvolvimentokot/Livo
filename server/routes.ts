import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
// import { requireAuth, type AuthenticatedRequest } from "./middleware/auth";
import { insertDocumentSchema, insertJobSchema } from "@shared/schema";
import { addVideoProcessingJob, getQueueStats } from "./jobs/videoProcessor";
import { websocketService } from "./services/websocketService";
import * as youtubeService from "./services/youtubeService";
import path from "path";
import fs from "fs/promises";
import { generatePdfFromDocument } from "./services/pdfService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Video processing routes
  app.post('/api/videos/process', async (req: any, res) => {
    try {
      const { youtubeUrl, documentType } = req.body;
      // Validate input
      if (!youtubeUrl || !documentType) {
        return res.status(400).json({
          error: 'YouTube URL and document type are required'
        });
      }
      
      const validTypes = ['EBOOK', 'TUTORIAL', 'GUIDE', 'RECIPE', 'PRESENTATION', 'SUMMARY'];
      if (!validTypes.includes(documentType)) {
        return res.status(400).json({
          error: 'Invalid document type'
        });
      }
      
      // Extract and validate video
      const videoId = youtubeService.extractVideoId(youtubeUrl);
      const videoInfo = await youtubeService.getVideoInfo(videoId);
      
      // Check user's hour limit
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
        const user = await storage.getUser(userId); // Ensure userId is defined
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const durationHours = videoInfo.duration / 3600;
      
      if ((user.hoursUsed || 0) + durationHours > (user.hoursLimit || 0.5)) {
        return res.status(403).json({
          error: 'Hour limit exceeded',
          hoursNeeded: durationHours,
          hoursAvailable: (user.hoursLimit || 0.5) - (user.hoursUsed || 0)
        });
      }
      
      // Create document in database
      const document = await storage.createDocument({
        userId,
        youtubeUrl,
        documentType: documentType as any,
        status: 'PROCESSING'
      });
      
      // Create processing job
      const job = await storage.createJob({
        userId,
        documentId: document.id,
        status: 'PENDING',
        progress: 0
      });
      
      // Add to processing queue
      await addVideoProcessingJob({
        youtubeUrl,
        documentType: documentType as any,
        userId,
        documentId: document.id,
        jobId: job.id,
        userPlan: user.plan || 'FREE'
      });
      
      res.json({
        success: true,
        documentId: document.id,
        jobId: job.id,
        estimatedDuration: videoInfo.duration,
        processingTime: Math.max(60, videoInfo.duration / 60)
      });
      
    } catch (error: any) {
      console.error('Error processing video:', error);
      res.status(400).json({
        error: error.message
      });
    }
  });

  // Get video info without processing
    app.post('/api/videos/info', async (req: any, res) => {
    try {
      const { youtubeUrl } = req.body;
      
      if (!youtubeUrl) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      const videoId = youtubeService.extractVideoId(youtubeUrl);
      const videoInfo = await youtubeService.getVideoInfo(videoId);
      
      const durationHours = videoInfo.duration / 3600;
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
        const user = await storage.getUser(userId); // Ensure userId is defined
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({
        videoId,
        duration: videoInfo.duration,
        durationFormatted: youtubeService.formatDuration(videoInfo.duration),
        thumbnail: videoInfo.thumbnail,
        hoursNeeded: Math.round(durationHours * 100) / 100,
        canProcess: (user.hoursUsed || 0) + durationHours <= (user.hoursLimit || 0.5),
        hoursAvailable: (user.hoursLimit || 0.5) - (user.hoursUsed || 0)
      });
      
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get job progress
    app.get('/api/jobs/:jobId/progress', async (req: any, res) => {
    try {
      const { jobId } = req.params;
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      
      const job = await storage.getJob(parseInt(jobId));
      
      if (!job || job.userId !== userId) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      const document = await storage.getDocument(job.documentId);
      
      res.json({
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        currentStep: job.currentStep,
        errorMessage: job.errorMessage,
        document
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Document routes
    app.get('/api/documents', async (req: any, res) => {
    try {
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      const { page = 1, limit = 10, status, type } = req.query;
      
      const documents = await storage.getUserDocuments(
        userId,
        parseInt(limit as string),
        (parseInt(page as string) - 1) * parseInt(limit as string)
      );
      
      res.json({
        documents: documents.map(doc => ({
          id: doc.id,
          youtubeUrl: doc.youtubeUrl,
          videoTitle: doc.videoTitle,
          documentType: doc.documentType,
          status: doc.status,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          fileSize: doc.filePath ? 'Available' : null,
        })),
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: documents.length,
          pages: Math.ceil(documents.length / parseInt(limit as string))
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get single document
    app.get('/api/documents/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      
      const document = await storage.getDocument(parseInt(id));
      
      if (!document || document.userId !== userId) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      res.json(document);
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download document
    app.get('/api/documents/:id/download', async (req: any, res) => {
    try {
      const { id } = req.params;
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      
      const document = await storage.getDocument(parseInt(id));
      
      if (!document || document.userId !== userId) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      if (!document.filePath || document.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Document not ready for download' });
      }
      
      try {
        const fileContent = await fs.readFile(document.filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${document.videoTitle || 'document'}.html"`);
        res.send(fileContent);
      } catch (fileError) {
        res.status(404).json({ error: 'Document file not found' });
      }
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download document as PDF
    app.get('/api/documents/:id/pdf', async (req: any, res) => {
    try {
      const { id } = req.params;
      const { format } = req.query as { format?: 'A4' | 'Letter' };
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      
      const document = await storage.getDocument(parseInt(id));
      
      if (!document || document.userId !== userId) {
        return res.status(404).json({ error: 'Document not found' });
      }
      
      if (!document.content || document.status !== 'COMPLETED') {
        return res.status(400).json({ error: 'Document not ready for PDF generation' });
      }
      
      // Generate PDF from document content
      const pdfResult = await generatePdfFromDocument(
        document.content,
        document.documentType,
        {
          format: format || 'A4',
          includeHeaderFooter: true
        }
      );
      
      if (!pdfResult.success) {
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${document.videoTitle || 'document'}.pdf"`);
      res.setHeader('Content-Length', pdfResult.size.toString());
      
      // Send PDF buffer
      res.send(pdfResult.content);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: `Failed to generate PDF: ${error.message}` });
    }
  });

  // Dashboard stats
    app.get('/api/dashboard/stats', async (req: any, res) => {
    try {
        const userId = req.user!.claims.sub; // Adjusted to get userId without authentication
      const stats = await storage.getUserStats(userId);
      
      res.json(stats);
      
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Queue stats
    app.get('/api/queue/stats', async (req: any, res) => {
    try {
      const stats = await getQueueStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Initialize WebSocket service for real-time updates
  websocketService.initialize(httpServer);

  return httpServer;
}
