interface ProgressBarProps {
  progress: number;
  status: string;
}

export default function ProgressBar({ progress, status }: ProgressBarProps) {
  const getProgressColor = () => {
    if (status === 'FAILED') return 'bg-destructive';
    if (status === 'COMPLETED') return 'bg-green-500';
    return 'bg-gradient-to-r from-primary to-secondary';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-foreground">Overall Progress</span>
        <span className="text-sm font-medium text-primary" data-testid="text-progress-percentage">
          {progress}%
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-3">
        <div 
          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
          data-testid="progress-bar"
        ></div>
      </div>
    </div>
  );
}
