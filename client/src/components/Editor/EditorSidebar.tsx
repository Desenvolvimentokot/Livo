import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FileText, Book, Laptop, File, List, Hash } from "lucide-react";

interface EditorSidebarProps {
  document: any;
}

export default function EditorSidebar({ document }: EditorSidebarProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [exportFormats, setExportFormats] = useState({
    pdf: true,
    word: false,
    html: false,
  });

  const getDocumentStructure = () => {
    if (!document.content) return [];

    const structure = [];
    const content = document.content;

    // Add introduction if available
    if (content.introduction || content.overview || content.description) {
      structure.push({
        id: 'introduction',
        title: 'Introduction',
        type: 'intro',
        icon: FileText
      });
    }

    // Add main content sections based on document type
    switch (document.documentType) {
      case 'EBOOK':
        if (content.chapters) {
          content.chapters.forEach((chapter: any, index: number) => {
            structure.push({
              id: `chapter-${index}`,
              title: `Chapter ${index + 1}: ${chapter.title}`,
              type: 'chapter',
              icon: List
            });
          });
        }
        if (content.conclusion) {
          structure.push({
            id: 'conclusion',
            title: 'Conclusion',
            type: 'conclusion',
            icon: FileText
          });
        }
        break;

      case 'TUTORIAL':
        if (content.materials) {
          structure.push({
            id: 'materials',
            title: 'Materials',
            type: 'materials',
            icon: List
          });
        }
        if (content.steps) {
          content.steps.forEach((step: any, index: number) => {
            structure.push({
              id: `step-${index}`,
              title: `Step ${step.stepNumber || index + 1}: ${step.title}`,
              type: 'step',
              icon: Hash
            });
          });
        }
        break;

      case 'GUIDE':
        if (content.sections) {
          content.sections.forEach((section: any, index: number) => {
            structure.push({
              id: `section-${index}`,
              title: section.title,
              type: 'section',
              icon: List
            });
          });
        }
        break;

      case 'RECIPE':
        if (content.ingredients) {
          structure.push({
            id: 'ingredients',
            title: 'Ingredients',
            type: 'ingredients',
            icon: List
          });
        }
        if (content.instructions) {
          structure.push({
            id: 'instructions',
            title: 'Instructions',
            type: 'instructions',
            icon: Hash
          });
        }
        break;
    }

    return structure;
  };

  const getDocumentStats = () => {
    if (!document.content) {
      return { wordCount: 0, pages: 0, readingTime: 0 };
    }

    // Estimate word count from content
    let totalText = '';
    const content = document.content;

    if (content.introduction) totalText += content.introduction + ' ';
    if (content.description) totalText += content.description + ' ';
    if (content.overview) totalText += content.overview + ' ';
    if (content.conclusion) totalText += content.conclusion + ' ';

    if (content.chapters) {
      content.chapters.forEach((chapter: any) => {
        totalText += chapter.content + ' ';
      });
    }

    if (content.sections) {
      content.sections.forEach((section: any) => {
        totalText += section.content + ' ';
      });
    }

    if (content.steps) {
      content.steps.forEach((step: any) => {
        totalText += step.content + ' ';
      });
    }

    const wordCount = totalText.split(' ').filter(word => word.length > 0).length;
    const pages = Math.max(1, Math.ceil(wordCount / 250)); // ~250 words per page
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 words per minute

    return { wordCount, pages, readingTime };
  };

  const structure = getDocumentStructure();
  const stats = getDocumentStats();

  const templates = [
    { id: 'classic', label: 'Classic', icon: Book },
    { id: 'modern', label: 'Modern', icon: Laptop },
    { id: 'minimal', label: 'Minimal', icon: File },
  ];

  const handleExportFormatChange = (format: string, checked: boolean) => {
    setExportFormats(prev => ({
      ...prev,
      [format]: checked
    }));
  };

  return (
    <div className="w-80 bg-card border-r border-border overflow-hidden flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Document Structure */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground" data-testid="heading-structure">
              Document Structure
            </h3>
            <div className="space-y-2 text-sm">
              {structure.length === 0 ? (
                <p className="text-muted-foreground">No structure available</p>
              ) : (
                structure.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = index === 0; // First item is active by default
                  
                  return (
                    <div 
                      key={item.id}
                      className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                      data-testid={`structure-item-${item.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Template Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Template Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplate === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`p-3 border rounded-lg text-center transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary'
                    }`}
                    data-testid={`template-${template.id}`}
                  >
                    <Icon className={`h-5 w-5 mb-1 mx-auto ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                    <span className={`text-xs ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {template.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Export Format</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="pdf" 
                  checked={exportFormats.pdf}
                  onCheckedChange={(checked) => handleExportFormatChange('pdf', checked as boolean)}
                  data-testid="checkbox-pdf"
                />
                <label htmlFor="pdf" className="text-sm text-foreground cursor-pointer">
                  PDF Document
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="word" 
                  checked={exportFormats.word}
                  onCheckedChange={(checked) => handleExportFormatChange('word', checked as boolean)}
                  data-testid="checkbox-word"
                />
                <label htmlFor="word" className="text-sm text-foreground cursor-pointer">
                  Word Document
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="html" 
                  checked={exportFormats.html}
                  onCheckedChange={(checked) => handleExportFormatChange('html', checked as boolean)}
                  data-testid="checkbox-html"
                />
                <label htmlFor="html" className="text-sm text-foreground cursor-pointer">
                  HTML Page
                </label>
              </div>
            </div>
          </div>

          {/* Document Stats */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Document Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Word Count:</span>
                <span className="text-foreground font-medium" data-testid="stat-word-count">
                  {stats.wordCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pages:</span>
                <span className="text-foreground font-medium" data-testid="stat-pages">
                  {stats.pages}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reading Time:</span>
                <span className="text-foreground font-medium" data-testid="stat-reading-time">
                  {stats.readingTime} min
                </span>
              </div>
            </div>
          </div>

          {/* Document Type Badge */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Document Type</h3>
            <Badge variant="outline" className="w-fit" data-testid="badge-document-type">
              {document.documentType?.charAt(0) + document.documentType?.slice(1).toLowerCase()}
            </Badge>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
