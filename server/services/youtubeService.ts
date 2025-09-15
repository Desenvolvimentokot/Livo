interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

interface VideoInfo {
  videoId: string;
  duration: number;
  thumbnail: string;
  transcriptLength: number;
}

/**
 * Extracts the video ID from YouTube URLs
 * Supports formats: youtube.com/watch?v=ID, youtu.be/ID, m.youtube.com/watch?v=ID
 */
export function extractVideoId(url: string): string {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)([^&\n?#]+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid YouTube URL format');
  }
  
  return match[1];
}

/**
 * Gets basic video information including duration estimate
 * Note: This is a simplified implementation for demo purposes
 * In production, you would use youtube-transcript package or YouTube Data API
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo> {
  try {
    // Simulate video info retrieval
    // In production, use youtube-transcript or YouTube Data API
    const estimatedDuration = 2700; // 45 minutes in seconds
    
    return {
      videoId,
      duration: estimatedDuration,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      transcriptLength: 150 // estimated number of transcript segments
    };
  } catch (error) {
    throw new Error('Unable to access video. Please check if it is public and has captions available.');
  }
}

/**
 * Extracts transcript from YouTube video
 * Note: This is a simplified implementation for demo purposes
 * In production, you would use the youtube-transcript package
 */
export async function extractTranscript(videoId: string): Promise<TranscriptItem[]> {
  try {
    // Simulate transcript extraction
    // In production, use youtube-transcript package
    const mockTranscript: TranscriptItem[] = [
      {
        text: "Welcome to this comprehensive guide on React Hooks. In this video, we'll explore everything you need to know about using hooks in your React applications.",
        offset: 0,
        duration: 5.5
      },
      {
        text: "React Hooks were introduced in React 16.8 and have revolutionized how we write React components. They allow us to use state and other React features in functional components.",
        offset: 5.5,
        duration: 7.2
      },
      {
        text: "Let's start with the most basic hook - useState. The useState hook allows you to add state to functional components.",
        offset: 12.7,
        duration: 6.1
      },
      // Continue with more realistic transcript content...
    ];
    
    return mockTranscript;
  } catch (error) {
    throw new Error('Could not extract transcript from this video');
  }
}

/**
 * Converts transcript array to continuous text
 * Removes music markers, applause, etc.
 */
export function transcriptToText(transcript: TranscriptItem[]): string {
  return transcript
    .map(item => item.text)
    .join(' ')
    .replace(/\[Music\]/gi, '')
    .replace(/\[Applause\]/gi, '')
    .replace(/\[Laughter\]/gi, '')
    .replace(/\[Silence\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Formats duration from seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
