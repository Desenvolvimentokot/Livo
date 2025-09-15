import { Check, Clock, AlertCircle } from "lucide-react";

interface ProcessingStepsProps {
  currentStep?: string;
  progress: number;
  status: string;
  errorMessage?: string;
}

interface Step {
  id: string;
  title: string;
  description: string;
  minProgress: number;
}

const steps: Step[] = [
  {
    id: 'analyzing',
    title: 'Video Analysis',
    description: 'Extracting video metadata and validating content',
    minProgress: 10
  },
  {
    id: 'extracting',
    title: 'Transcript Extraction', 
    description: 'Downloading and processing video captions',
    minProgress: 30
  },
  {
    id: 'structuring',
    title: 'AI Content Structuring',
    description: 'Analyzing content and creating chapters and sections',
    minProgress: 60
  },
  {
    id: 'generating',
    title: 'Document Generation',
    description: 'Formatting and styling your final document',
    minProgress: 80
  },
  {
    id: 'finalizing',
    title: 'Final Review',
    description: 'Quality check and document finalization',
    minProgress: 90
  }
];

export default function ProcessingSteps({ currentStep, progress, status, errorMessage }: ProcessingStepsProps) {
  const getStepStatus = (step: Step) => {
    if (status === 'FAILED' && errorMessage) {
      return progress >= step.minProgress ? 'completed' : 'pending';
    }
    
    if (progress >= 100) return 'completed';
    if (progress >= step.minProgress) return 'completed';
    
    // Check if this is the current step
    const currentStepLower = currentStep?.toLowerCase() || '';
    if (currentStepLower.includes(step.id) || 
        (step.id === 'analyzing' && currentStepLower.includes('analyz')) ||
        (step.id === 'extracting' && currentStepLower.includes('extract')) ||
        (step.id === 'structuring' && currentStepLower.includes('structur')) ||
        (step.id === 'generating' && currentStepLower.includes('generat')) ||
        (step.id === 'finalizing' && currentStepLower.includes('final'))) {
      return 'active';
    }
    
    return 'pending';
  };

  const getStepIcon = (step: Step) => {
    const stepStatus = getStepStatus(step);
    
    switch (stepStatus) {
      case 'completed':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
        );
      case 'active':
        return (
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center animate-pulse">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
        );
    }
  };

  const getStepTextColor = (step: Step) => {
    const stepStatus = getStepStatus(step);
    
    switch (stepStatus) {
      case 'completed':
        return 'text-foreground';
      case 'active':
        return 'text-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (step: Step) => {
    const stepStatus = getStepStatus(step);
    
    switch (stepStatus) {
      case 'completed':
        return 'Completed';
      case 'active':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (step: Step) => {
    const stepStatus = getStepStatus(step);
    
    switch (stepStatus) {
      case 'completed':
        return 'text-green-600';
      case 'active':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6" data-testid="processing-steps">
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className="flex items-center space-x-4"
          data-testid={`step-${step.id}`}
        >
          {getStepIcon(step)}
          <div className="flex-1">
            <h4 className={`font-medium ${getStepTextColor(step)}`}>
              {step.title}
            </h4>
            <p className="text-sm text-muted-foreground">
              {step.description}
            </p>
          </div>
          <span className={`text-xs font-medium ${getStatusColor(step)}`}>
            {getStatusText(step)}
          </span>
        </div>
      ))}
      
      {status === 'FAILED' && errorMessage && (
        <div className="flex items-center space-x-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-destructive">Processing Failed</h4>
            <p className="text-sm text-destructive/80" data-testid="text-error-message">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {status === 'COMPLETED' && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Processing completed successfully! Your document is ready.
          </p>
        </div>
      )}

      {status === 'PROCESSING' && (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Estimated time remaining: <span className="font-medium text-foreground">3-5 minutes</span>
          </p>
        </div>
      )}
    </div>
  );
}
