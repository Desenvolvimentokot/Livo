import { storage } from '../storage';
import { websocketService } from '../services/websocketService';
import * as youtubeService from '../services/youtubeService';
import * as aiService from '../services/aiService';
import * as documentService from '../services/documentService';
import type { DocumentType } from '@shared/schema';

interface ProcessingJobData {
  youtubeUrl: string;
  documentType: DocumentType;
  userId: string;
  documentId: number;
  jobId: number;
  userPlan: string;
}

interface ProcessingResult {
  success: boolean;
  documentId: number;
  filePath?: string;
  fileSize?: number;
  error?: string;
}

/**
 * Main video processing function
 * Orchestrates the entire pipeline from video to document
 */
export async function processVideo(data: ProcessingJobData): Promise<ProcessingResult> {
  const { youtubeUrl, documentType, userId, documentId, jobId } = data;
  
  try {
    // 1. Extract video ID and validate
    await updateJobProgress(jobId, 10, 'Analyzing YouTube video...');
    const videoId = youtubeService.extractVideoId(youtubeUrl);
    const videoInfo = await youtubeService.getVideoInfo(videoId);
    
    // Check if user has sufficient hours
    const durationHours = videoInfo.duration / 3600;
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (user.hoursUsed + durationHours > user.hoursLimit) {
      throw new Error('Hour limit exceeded for your current plan');
    }
    
    // 2. Extract transcript
    await updateJobProgress(jobId, 30, 'Extracting video captions...');
    const transcript = await youtubeService.extractTranscript(videoId);
    const fullText = youtubeService.transcriptToText(transcript);
    
    if (fullText.length < 100) {
      throw new Error('Video too short or insufficient content to process');
    }
    
    // 3. Process with AI
    await updateJobProgress(jobId, 60, 'Structuring content with AI...');
    const structuredContent = await aiService.structureContent(fullText, documentType);
    
    // 4. Generate document
    await updateJobProgress(jobId, 80, 'Generating document...');
    const document = await documentService.generateDocument(structuredContent, documentType);
    
    // 5. Save document
    await updateJobProgress(jobId, 90, 'Saving document...');
    const fileName = `document_${documentId}_${Date.now()}.html`;
    const filePath = await documentService.saveDocument(document.content, fileName);
    
    // 6. Update database
    await storage.updateDocument(documentId, {
      content: structuredContent,
      status: 'COMPLETED',
      videoTitle: structuredContent.title,
      videoDuration: videoInfo.duration,
      filePath
    });
    
    // Update user's hours used
    await storage.upsertUser({
      ...user,
      hoursUsed: user.hoursUsed + durationHours
    });
    
    // 7. Complete job
    await updateJobProgress(jobId, 100, 'Document created successfully!');
    
    return {
      success: true,
      documentId,
      filePath,
      fileSize: document.size
    };
    
  } catch (error: any) {
    console.error('Processing error:', error);
    
    // Update document as failed
    await storage.updateDocument(documentId, { status: 'FAILED' });
    
    // Update job as failed
    await updateJobProgress(jobId, 0, 'Processing failed', error.message);
    
    return {
      success: false,
      documentId,
      error: error.message
    };
  }
}

/**
 * Updates job progress in database and broadcasts to WebSocket subscribers
 */
async function updateJobProgress(
  jobId: number, 
  progress: number, 
  currentStep: string, 
  error?: string
): Promise<void> {
  try {
    const status = error ? 'FAILED' : (progress === 100 ? 'COMPLETED' : 'PROCESSING');
    
    await storage.updateJob(jobId, {
      progress,
      currentStep,
      errorMessage: error || null,
      status: status as any
    });
    
    // Broadcast progress update to WebSocket subscribers
    websocketService.broadcastProgress(jobId, {
      type: 'progress',
      jobId,
      status,
      progress,
      currentStep,
      errorMessage: error || null
    });
    
    console.log(`Progress update for job ${jobId}: ${progress}% - ${currentStep}`);
    
  } catch (updateError) {
    console.error('Error updating job progress:', updateError);
  }
}

/**
 * Simulates adding job to processing queue
 * In production, this would use Redis/Bull for job queuing
 */
export async function addVideoProcessingJob(data: ProcessingJobData): Promise<void> {
  // Simulate async processing
  setTimeout(async () => {
    await processVideo(data);
  }, 1000);
}

/**
 * Gets processing queue statistics
 */
export async function getQueueStats(): Promise<{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}> {
  // In production, this would query the actual job queue
  return {
    waiting: 0,
    active: 1,
    completed: 24,
    failed: 1
  };
}
