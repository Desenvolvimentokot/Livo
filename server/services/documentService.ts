import fs from 'fs/promises';
import path from 'path';
import type { DocumentType } from "@shared/schema";

/**
 * Loads HTML template for the specified document type
 */
export async function loadTemplate(documentType: DocumentType): Promise<string> {
  try {
    const templatePath = path.join(__dirname, '../templates', `${documentType.toLowerCase()}.html`);
    return await fs.readFile(templatePath, 'utf8');
  } catch (error) {
    throw new Error(`Template not found for document type: ${documentType}`);
  }
}

/**
 * Processes HTML template by replacing placeholders with actual data
 * Uses {{variable}} syntax for substitutions
 */
export function processTemplate(templateHtml: string, data: any): string {
  let processedHtml = templateHtml;
  
  // Basic substitutions
  processedHtml = processedHtml.replace(/\{\{title\}\}/g, data.title || 'Untitled Document');
  processedHtml = processedHtml.replace(/\{\{subtitle\}\}/g, data.subtitle || '');
  
  // Document type specific processing
  if (data.chapters) {
    // Ebook processing
    const chaptersHtml = data.chapters.map((chapter: any, index: number) => `
      <div class="chapter">
        <h2>Chapter ${index + 1}: ${chapter.title}</h2>
        <div class="chapter-content">${chapter.content.replace(/\n/g, '</p><p>')}</div>
      </div>
    `).join('');
    processedHtml = processedHtml.replace(/\{\{chapters\}\}/g, chaptersHtml);
    
    processedHtml = processedHtml.replace(/\{\{introduction\}\}/g, data.introduction || '');
    processedHtml = processedHtml.replace(/\{\{conclusion\}\}/g, data.conclusion || '');
    
    if (data.keyTakeaways) {
      const takeawaysHtml = data.keyTakeaways.map((item: string) => `<li>${item}</li>`).join('');
      processedHtml = processedHtml.replace(/\{\{keyTakeaways\}\}/g, `<ul>${takeawaysHtml}</ul>`);
    }
  }
  
  if (data.steps) {
    // Tutorial processing
    const stepsHtml = data.steps.map((step: any) => `
      <div class="step">
        <h3>Step ${step.stepNumber}: ${step.title}</h3>
        <div class="step-content">${step.content}</div>
        ${step.tips ? `<div class="step-tips"><strong>Tip:</strong> ${step.tips}</div>` : ''}
      </div>
    `).join('');
    processedHtml = processedHtml.replace(/\{\{steps\}\}/g, stepsHtml);
    
    if (data.materials) {
      const materialsHtml = data.materials.map((item: string) => `<li>${item}</li>`).join('');
      processedHtml = processedHtml.replace(/\{\{materials\}\}/g, `<ul>${materialsHtml}</ul>`);
    }
  }
  
  if (data.sections) {
    // Guide processing
    const sectionsHtml = data.sections.map((section: any) => `
      <div class="section">
        <h2>${section.title}</h2>
        <div class="section-content">${section.content.replace(/\n/g, '</p><p>')}</div>
      </div>
    `).join('');
    processedHtml = processedHtml.replace(/\{\{sections\}\}/g, sectionsHtml);
  }
  
  if (data.ingredients && data.instructions) {
    // Recipe processing
    const ingredientsHtml = data.ingredients.map((item: string) => `<li>${item}</li>`).join('');
    processedHtml = processedHtml.replace(/\{\{ingredients\}\}/g, `<ul>${ingredientsHtml}</ul>`);
    
    const instructionsHtml = data.instructions.map((instruction: any) => `
      <div class="instruction-step">
        <h4>Step ${instruction.step}</h4>
        <p>${instruction.instruction}</p>
      </div>
    `).join('');
    processedHtml = processedHtml.replace(/\{\{instructions\}\}/g, instructionsHtml);
  }
  
  if (data.slides) {
    // Presentation processing
    const slidesHtml = data.slides.map((slide: any) => `
      <div class="slide">
        <div class="slide-number">Slide ${slide.slideNumber}</div>
        <h2 class="slide-title">${slide.title}</h2>
        <div class="slide-content">${slide.content.replace(/\n/g, '</p><p>')}</div>
        ${slide.notes ? `
          <div class="speaker-notes">
            <div class="speaker-notes-label">Speaker Notes</div>
            <div class="speaker-notes-content">${slide.notes}</div>
          </div>` : ''}
      </div>
    `).join('');
    processedHtml = processedHtml.replace(/\{\{slides\}\}/g, slidesHtml);
  }
  
  if (data.mainPoints) {
    // Summary processing
    const mainPointsHtml = data.mainPoints.map((point: string) => `<li>${point}</li>`).join('');
    processedHtml = processedHtml.replace(/\{\{mainPoints\}\}/g, `<ul>${mainPointsHtml}</ul>`);
    
    processedHtml = processedHtml.replace(/\{\{overview\}\}/g, data.overview || '');
    processedHtml = processedHtml.replace(/\{\{conclusion\}\}/g, data.conclusion || '');
    
    if (data.details) {
      const detailsHtml = data.details.map((detail: any) => `
        <div class="detail-item">
          <h3 class="detail-topic">${detail.topic}</h3>
          <div class="detail-summary">${detail.summary}</div>
        </div>
      `).join('');
      processedHtml = processedHtml.replace(/\{\{details\}\}/g, detailsHtml);
    }
  }
  
  return processedHtml;
}

/**
 * Generates a complete document from structured data
 * Returns HTML content for now (PDF generation would require additional setup)
 */
export async function generateDocument(structuredData: any, documentType: DocumentType): Promise<{
  success: boolean;
  content: string;
  size: number;
}> {
  try {
    // 1. Load appropriate template
    const templateHtml = await loadTemplate(documentType);
    
    // 2. Process template with data
    const processedHtml = processTemplate(templateHtml, structuredData);
    
    return {
      success: true,
      content: processedHtml,
      size: processedHtml.length
    };
  } catch (error: any) {
    throw new Error(`Error generating document: ${error.message}`);
  }
}

/**
 * Saves document content to file system
 */
export async function saveDocument(content: string, filename: string): Promise<string> {
  try {
    const uploadsDir = process.env.UPLOADS_DIR || './uploads';
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const filePath = path.join(uploadsDir, filename);
    await fs.writeFile(filePath, content, 'utf8');
    
    return filePath;
  } catch (error: any) {
    throw new Error(`Error saving document: ${error.message}`);
  }
}
