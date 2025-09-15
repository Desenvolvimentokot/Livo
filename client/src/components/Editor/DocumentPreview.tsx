import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentPreviewProps {
  document: any;
}

export default function DocumentPreview({ document }: DocumentPreviewProps) {
  const renderContent = () => {
    if (!document.content) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No content available</p>
        </div>
      );
    }

    const content = document.content;

    // Render based on document type
    switch (document.documentType) {
      case 'EBOOK':
        return renderEbook(content);
      case 'TUTORIAL':
        return renderTutorial(content);
      case 'GUIDE':
        return renderGuide(content);
      case 'RECIPE':
        return renderRecipe(content);
      case 'PRESENTATION':
        return renderPresentation(content);
      case 'SUMMARY':
        return renderSummary(content);
      default:
        return renderGeneric(content);
    }
  };

  const renderEbook = (content: any) => (
    <div className="space-y-8">
      {/* Title Page */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 text-primary-foreground rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="ebook-title">
          {content.title || document.videoTitle}
        </h1>
        {content.subtitle && (
          <p className="text-primary-foreground/80 text-lg" data-testid="ebook-subtitle">
            {content.subtitle}
          </p>
        )}
        <div className="mt-4 flex items-center space-x-4 text-sm text-primary-foreground/70">
          <span>Generated from YouTube Video</span>
          <span>•</span>
          <span>Professional E-book</span>
        </div>
      </div>

      {/* Introduction */}
      {content.introduction && (
        <section className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Introduction
          </h2>
          <div className="prose prose-lg max-w-none text-foreground space-y-4">
            <p>{content.introduction}</p>
          </div>
        </section>
      )}

      {/* Chapters */}
      {content.chapters && content.chapters.map((chapter: any, index: number) => (
        <section key={index} className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Chapter {index + 1}: {chapter.title}
          </h2>
          <div className="prose prose-lg max-w-none text-foreground space-y-4">
            <p>{chapter.content}</p>
          </div>
        </section>
      ))}

      {/* Conclusion */}
      {content.conclusion && (
        <section className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
            Conclusion
          </h2>
          <div className="prose prose-lg max-w-none text-foreground space-y-4">
            <p>{content.conclusion}</p>
          </div>
        </section>
      )}

      {/* Key Takeaways */}
      {content.keyTakeaways && (
        <section className="p-8">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-4">
              Key Takeaways
            </h3>
            <ul className="list-disc list-inside space-y-2 text-green-800 dark:text-green-300">
              {content.keyTakeaways.map((takeaway: string, index: number) => (
                <li key={index}>{takeaway}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );

  const renderTutorial = (content: any) => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="tutorial-title">
          {content.title || document.videoTitle}
        </h1>
        {content.description && (
          <p className="text-white/90 text-lg">{content.description}</p>
        )}
      </div>

      {/* Materials */}
      {content.materials && (
        <section className="p-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-4">
              Materials Needed
            </h3>
            <ul className="list-disc list-inside space-y-2 text-blue-800 dark:text-blue-300">
              {content.materials.map((material: string, index: number) => (
                <li key={index}>{material}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Steps */}
      {content.steps && (
        <section className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Steps</h2>
          {content.steps.map((step: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <span className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  {step.stepNumber || index + 1}
                </span>
                {step.title}
              </h3>
              <div className="prose max-w-none text-foreground mb-4">
                <p>{step.content}</p>
              </div>
              {step.tips && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="text-yellow-800 dark:text-yellow-300">
                    <strong>Tip:</strong> {step.tips}
                  </p>
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );

  const renderGuide = (content: any) => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="guide-title">
          {content.title || document.videoTitle}
        </h1>
      </div>

      {/* Overview */}
      {content.overview && (
        <section className="p-8">
          <div className="bg-gray-50 dark:bg-gray-900/20 p-6 rounded-lg border-l-4 border-gray-500">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-4">
              Overview
            </h3>
            <p className="text-gray-800 dark:text-gray-300">{content.overview}</p>
          </div>
        </section>
      )}

      {/* Sections */}
      {content.sections && content.sections.map((section: any, index: number) => (
        <section key={index} className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4 border-b border-border pb-2">
            {section.title}
          </h2>
          <div className="prose prose-lg max-w-none text-foreground">
            <p>{section.content}</p>
          </div>
        </section>
      ))}
    </div>
  );

  const renderRecipe = (content: any) => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 p-8 text-white rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="recipe-title">
          {content.title || document.videoTitle}
        </h1>
        {content.description && (
          <p className="text-white/90 text-lg">{content.description}</p>
        )}
      </div>

      {/* Recipe Meta */}
      <section className="p-8">
        <div className="grid grid-cols-3 gap-4">
          {content.prepTime && (
            <div className="text-center p-4 bg-card border border-border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Prep Time</div>
              <div className="text-lg font-bold text-orange-600">{content.prepTime}</div>
            </div>
          )}
          {content.cookTime && (
            <div className="text-center p-4 bg-card border border-border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Cook Time</div>
              <div className="text-lg font-bold text-orange-600">{content.cookTime}</div>
            </div>
          )}
          {content.servings && (
            <div className="text-center p-4 bg-card border border-border rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Servings</div>
              <div className="text-lg font-bold text-orange-600">{content.servings}</div>
            </div>
          )}
        </div>
      </section>

      {/* Ingredients */}
      {content.ingredients && (
        <section className="p-8">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-4">
              Ingredients
            </h3>
            <ul className="list-disc list-inside space-y-2 text-green-800 dark:text-green-300">
              {content.ingredients.map((ingredient: string, index: number) => (
                <li key={index}>{ingredient}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Instructions */}
      {content.instructions && (
        <section className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-foreground mb-6">Instructions</h2>
          {content.instructions.map((instruction: any, index: number) => (
            <div key={index} className="border border-border rounded-lg p-6 bg-card">
              <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center mr-3 text-sm font-bold">
                  {instruction.step || index + 1}
                </span>
                Step {instruction.step || index + 1}
              </h3>
              <p className="text-foreground">{instruction.instruction}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  );

  const renderPresentation = (content: any) => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="presentation-title">
          {content.title || document.videoTitle}
        </h1>
        {content.subtitle && (
          <p className="text-white/90 text-lg">{content.subtitle}</p>
        )}
        <div className="mt-4 flex items-center space-x-4 text-sm text-white/70">
          <span>Generated from YouTube Video</span>
          <span>•</span>
          <span>Professional Presentation</span>
        </div>
      </div>

      {/* Slides */}
      {content.slides && content.slides.map((slide: any, index: number) => (
        <section key={index} className="p-8 border-b border-border last:border-b-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Slide {slide.slideNumber || index + 1}: {slide.title}
            </h2>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
              Slide {slide.slideNumber || index + 1}
            </span>
          </div>
          <div className="prose prose-lg max-w-none text-foreground space-y-4">
            <div className="whitespace-pre-wrap">{slide.content}</div>
          </div>
          {slide.notes && (
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                Speaker Notes
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{slide.notes}</p>
            </div>
          )}
        </section>
      ))}
    </div>
  );

  const renderSummary = (content: any) => (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-8 text-white rounded-t-xl">
        <h1 className="text-3xl font-bold mb-4" data-testid="summary-title">
          {content.title || document.videoTitle}
        </h1>
        <div className="mt-4 flex items-center space-x-4 text-sm text-white/70">
          <span>Generated from YouTube Video</span>
          <span>•</span>
          <span>Executive Summary</span>
        </div>
      </div>

      {/* Overview */}
      {content.overview && (
        <section className="p-8">
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border-l-4 border-green-500">
            <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-4">
              Overview
            </h3>
            <p className="text-green-800 dark:text-green-300">{content.overview}</p>
          </div>
        </section>
      )}

      {/* Main Points */}
      {content.mainPoints && (
        <section className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-2">
            Key Points
          </h2>
          <ul className="space-y-4">
            {content.mainPoints.map((point: string, index: number) => (
              <li key={index} className="flex items-start space-x-3">
                <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-1">
                  {index + 1}
                </span>
                <p className="text-foreground flex-1">{point}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Detailed Summary */}
      {content.details && (
        <section className="p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6 border-b border-border pb-2">
            Detailed Summary
          </h2>
          <div className="space-y-6">
            {content.details.map((detail: any, index: number) => (
              <div key={index} className="border border-border rounded-lg p-6 bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-4">{detail.topic}</h3>
                <p className="text-muted-foreground">{detail.summary}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Conclusion */}
      {content.conclusion && (
        <section className="p-8">
          <div className="bg-gray-50 dark:bg-gray-900/20 p-6 rounded-lg border-l-4 border-gray-500">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-400 mb-4">
              Conclusion
            </h3>
            <p className="text-gray-800 dark:text-gray-300 italic">{content.conclusion}</p>
          </div>
        </section>
      )}
    </div>
  );

  const renderGeneric = (content: any) => (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold text-foreground mb-4">
        {content.title || document.videoTitle}
      </h1>
      <div className="prose prose-lg max-w-none text-foreground">
        <pre className="whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>
      </div>
    </div>
  );

  return (
    <div className="flex-1 bg-muted/30 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden" data-testid="document-preview">
            {renderContent()}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
