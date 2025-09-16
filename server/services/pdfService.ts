import puppeteer, { Browser, Page } from 'puppeteer';
import { DocumentType } from '@shared/schema';
import { loadTemplate, processTemplate } from './documentService';

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance for PDF generation
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
  }
  return browserInstance;
}

/**
 * Generate PDF from HTML content
 */
export async function generatePdfFromHtml(
  htmlContent: string,
  options: {
    format?: 'A4' | 'Letter';
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
  } = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    // Set content and wait for it to load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    
    // Generate PDF with options
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
        ...options.margin
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || '',
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Generate PDF from structured document data
 */
export async function generatePdfFromDocument(
  structuredData: any,
  documentType: DocumentType,
  options: {
    format?: 'A4' | 'Letter';
    includeHeaderFooter?: boolean;
  } = {}
): Promise<{
  success: boolean;
  content: Buffer;
  size: number;
}> {
  try {
    // 1. Load appropriate HTML template
    const templateHtml = await loadTemplate(documentType);
    
    // 2. Process template with data
    const processedHtml = processTemplate(templateHtml, structuredData);
    
    // 3. Add PDF-specific styling
    const pdfHtml = addPdfStyling(processedHtml);
    
    // 4. Generate PDF options
    const pdfOptions = {
      format: options.format || 'A4' as const,
      displayHeaderFooter: options.includeHeaderFooter || false,
      headerTemplate: options.includeHeaderFooter ? `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
          <span>${structuredData.title || 'Document'}</span>
        </div>
      ` : '',
      footerTemplate: options.includeHeaderFooter ? `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-bottom: 10px;">
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated with VideoScribe</span>
        </div>
      ` : ''
    };
    
    // 5. Generate PDF
    const pdfBuffer = await generatePdfFromHtml(pdfHtml, pdfOptions);
    
    return {
      success: true,
      content: pdfBuffer,
      size: pdfBuffer.length
    };
  } catch (error: any) {
    throw new Error(`Error generating PDF: ${error.message}`);
  }
}

/**
 * Add PDF-specific CSS styling to HTML
 */
function addPdfStyling(html: string): string {
  // Add PDF-optimized CSS
  const pdfCss = `
    <style>
      /* PDF-specific styles */
      @page {
        margin: 20mm;
        size: A4;
      }
      
      body {
        font-family: 'Times New Roman', serif;
        font-size: 12pt;
        line-height: 1.6;
        color: #000;
        background: white;
      }
      
      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid;
        color: #000;
      }
      
      .chapter, .section, .step, .slide {
        page-break-inside: avoid;
        margin-bottom: 20px;
      }
      
      .page-break {
        page-break-before: always;
      }
      
      /* Ensure good contrast for print */
      .bg-primary, .bg-secondary, .bg-accent {
        background: #f5f5f5 !important;
        color: #000 !important;
      }
      
      .text-primary, .text-secondary, .text-accent {
        color: #333 !important;
      }
      
      .border {
        border-color: #ccc !important;
      }
      
      /* Hide elements that don't make sense in PDF */
      .animate-spin, .animate-pulse {
        display: none !important;
      }
    </style>
  `;
  
  // Insert CSS before closing head tag or at the beginning of body
  if (html.includes('</head>')) {
    return html.replace('</head>', `${pdfCss}</head>`);
  } else if (html.includes('<body')) {
    return html.replace('<body', `${pdfCss}<body`);
  } else {
    return `${pdfCss}${html}`;
  }
}

/**
 * Close browser instance (for cleanup)
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on('exit', () => {
  if (browserInstance) {
    browserInstance.close();
  }
});

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});