import OpenAI from "openai";
import type { DocumentType } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

/**
 * Document type specific prompts optimized for structured content generation
 */
const DOCUMENT_PROMPTS = {
  EBOOK: `You are an expert in creating professional ebooks. Analyze this video transcript and transform it into a well-structured ebook.

Return a JSON with this EXACT structure:
{
  "title": "Main ebook title",
  "subtitle": "Descriptive subtitle",
  "introduction": "Engaging 2-3 paragraph introduction",
  "chapters": [
    {
      "title": "Chapter title",
      "content": "Chapter content in paragraphs"
    }
  ],
  "conclusion": "2-3 paragraph conclusion",
  "keyTakeaways": ["Important point 1", "Important point 2"]
}`,

  TUTORIAL: `You are an expert in creating step-by-step tutorials. Analyze this transcript and transform it into a practical tutorial.

Return a JSON with this EXACT structure:
{
  "title": "Tutorial title",
  "description": "Description of what will be taught",
  "materials": ["Material 1", "Material 2"],
  "steps": [
    {
      "stepNumber": 1,
      "title": "Step name",
      "content": "Detailed instructions",
      "tips": "Extra tips (optional)"
    }
  ],
  "troubleshooting": "Solutions for common problems",
  "finalTips": "Final tips"
}`,

  GUIDE: `You are an expert in creating practical guides. Analyze this transcript and transform it into an organized guide.

Return a JSON with this EXACT structure:
{
  "title": "Guide title",
  "overview": "Guide overview",
  "sections": [
    {
      "title": "Section title",
      "content": "Section content"
    }
  ],
  "checklist": ["Checklist item 1", "Item 2"],
  "resources": "Additional resources"
}`,

  RECIPE: `You are an expert in creating recipe guides. Analyze this transcript and transform it into a structured recipe.

Return a JSON with this EXACT structure:
{
  "title": "Recipe title",
  "description": "Recipe description",
  "ingredients": ["Ingredient 1", "Ingredient 2"],
  "instructions": [
    {
      "step": 1,
      "instruction": "Step instruction"
    }
  ],
  "prepTime": "Preparation time",
  "cookTime": "Cooking time",
  "servings": "Number of servings"
}`,

  PRESENTATION: `You are an expert in creating presentations. Analyze this transcript and transform it into a structured presentation.

Return a JSON with this EXACT structure:
{
  "title": "Presentation title",
  "subtitle": "Presentation subtitle",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide title",
      "content": "Slide content",
      "notes": "Speaker notes"
    }
  ]
}`,

  SUMMARY: `You are an expert in creating comprehensive summaries. Analyze this transcript and create a structured summary.

Return a JSON with this EXACT structure:
{
  "title": "Summary title",
  "overview": "Brief overview",
  "mainPoints": ["Main point 1", "Main point 2"],
  "details": [
    {
      "topic": "Topic name",
      "summary": "Topic summary"
    }
  ],
  "conclusion": "Summary conclusion"
}`
};

/**
 * Processes text with AI to generate structured content
 * Uses GPT-5 for cost-optimized processing
 */
export async function structureContent(text: string, documentType: DocumentType): Promise<any> {
  const prompt = DOCUMENT_PROMPTS[documentType];
  
  if (!prompt) {
    throw new Error(`Document type not supported: ${documentType}`);
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: `Video transcript:\n\n${text}\n\nIMPORTANT: Return ONLY the JSON, no additional text.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const responseText = completion.choices[0].message.content?.trim();
    
    if (!responseText) {
      throw new Error('AI did not return valid content');
    }
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from response if wrapped in text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('AI did not return valid JSON');
      }
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      throw new Error('Error processing AI response. Please try again.');
    }
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

/**
 * Generates intelligent title based on content
 * Used when video doesn't have a clear title
 */
export async function generateTitle(text: string, documentType: DocumentType): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `Generate an attractive and professional title for a ${documentType.toLowerCase()} based on this content. Return only the title, without quotes or extra formatting.`
        },
        {
          role: "user",
          content: text.substring(0, 1000) // First 1000 characters
        }
      ],
      temperature: 0.8,
      max_tokens: 100
    });
    
    return completion.choices[0].message.content?.trim() || `${documentType} Document`;
  } catch (error) {
    return `${documentType} Document`; // Fallback title
  }
}

export { DOCUMENT_PROMPTS };
