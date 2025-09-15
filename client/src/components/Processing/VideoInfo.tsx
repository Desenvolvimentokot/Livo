import { Clock, FileText, Globe, User } from "lucide-react";

interface VideoInfoProps {
  title: string;
  duration: number;
  documentType: string;
  youtubeUrl: string;
}

export default function VideoInfo({ title, duration, documentType, youtubeUrl }: VideoInfoProps) {
  const formatDuration = (seconds: number): string => {
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
  };

  const extractVideoId = (url: string): string => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|m\.youtube\.com\/watch\?v=)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : '';
  };

  const videoId = extractVideoId(youtubeUrl);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8">
      <div className="flex items-start space-x-4">
        {/* Video thumbnail */}
        <img 
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-32 h-20 rounded-lg object-cover bg-muted" 
          onError={(e) => {
            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='128' height='80' viewBox='0 0 128 80'%3E%3Crect width='128' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='12' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EVideo%3C/text%3E%3C/svg%3E";
          }}
          data-testid="img-video-thumbnail"
        />
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground mb-2" data-testid="text-video-title">
            {title}
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span data-testid="text-video-duration">Duration: {formatDuration(duration)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span data-testid="text-document-type">Type: {documentType}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Language: English</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Source: YouTube</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
