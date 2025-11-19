import OpenAI from 'openai';
import pLimit from 'p-limit';
import pRetry, { AbortError } from 'p-retry';
import { db } from '../db';
import { blogPosts, blogGenerationJobs } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for blog generation');
    }
    // the newest OpenAI model is "gpt-4o" which supports structured outputs
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes('429') ||
    errorMsg.includes('RATELIMIT_EXCEEDED') ||
    errorMsg.toLowerCase().includes('quota') ||
    errorMsg.toLowerCase().includes('rate limit')
  );
}

interface GeneratedArticle {
  title: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  focusKeywords: string[];
  category: string;
  tags: string[];
}

const BEAUTY_TRENDS_PROMPT = `You are an expert content writer for Kosmospace, a luxury beauty services marketplace in Dubai. 
Generate an SEO-optimized, engaging blog article about beauty trends that will drive traffic to our website.

Requirements:
- Focus on Dubai and UAE beauty market trends
- Target luxury clientele interested in home beauty services
- Include practical tips and actionable advice
- Optimize for search engines with natural keyword usage
- Make it engaging and shareable
- Length: 1200-1500 words
- Tone: Luxurious, professional, yet approachable

Topics to cover should relate to: manicures, pedicures, lash extensions, makeup, bridal beauty, beauty trends in Dubai, home beauty services, etc.

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling article title (60-70 characters)",
  "excerpt": "Brief summary for listings (150-160 characters)",
  "content": "Full HTML article content with <h2>, <h3>, <p>, <ul>, <strong>, <em> tags. Use proper HTML formatting.",
  "seoTitle": "SEO-optimized title (50-60 characters)",
  "seoDescription": "Meta description for search engines (150-160 characters)",
  "focusKeywords": ["keyword1", "keyword2", "keyword3"],
  "category": "one of: trends, guides, tips, beauty-101",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

async function generateSingleArticle(index: number, focusKeywords: string[]): Promise<GeneratedArticle> {
  return await pRetry(
    async () => {
      try {
        const openai = getOpenAIClient();
        const keywordContext = focusKeywords.length > 0 
          ? `\n\nFocus on these keywords naturally: ${focusKeywords.join(', ')}`
          : '';

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert beauty and lifestyle content writer specializing in luxury beauty services in Dubai.'
            },
            {
              role: 'user',
              content: BEAUTY_TRENDS_PROMPT + keywordContext + `\n\nGenerate article #${index + 1}. Make it unique and different from typical beauty articles.`
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.8,
          max_tokens: 3000,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No content generated from OpenAI');
        }

        const article = JSON.parse(content) as GeneratedArticle;
        
        if (!article.title || !article.content || !article.excerpt) {
          throw new Error('Invalid article structure from OpenAI');
        }

        return article;
      } catch (error: any) {
        if (isRateLimitError(error)) {
          throw error;
        }
        throw new AbortError(error);
      }
    },
    {
      retries: 3,
      minTimeout: 2000,
      maxTimeout: 10000,
      factor: 2,
    }
  );
}

async function generateArticleImage(title: string): Promise<string> {
  try {
    const openai = getOpenAIClient();
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `Create a luxurious, aesthetic beauty service image for an article titled "${title}". 
Style: Elegant, professional, Dubai luxury aesthetic. 
Include: Beautiful spa/beauty elements, elegant color palette (rose gold, cream, soft pink), 
minimalist design, high-end luxury feel. No text or logos.`,
      size: '1792x1024',
      quality: 'hd',
      n: 1,
    });

    return response.data?.[0]?.url || '';
  } catch (error) {
    console.error('Failed to generate image:', error);
    return 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=800';
  }
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function generateBlogArticles(
  jobId: string,
  articleCount: number,
  focusKeywords: string[]
): Promise<void> {
  try {
    await db.update(blogGenerationJobs)
      .set({ status: 'generating', progress: 5 })
      .where(eq(blogGenerationJobs.id, jobId));

    const limit = pLimit(1);
    const generatedArticleIds: string[] = [];

    const articlePromises = Array.from({ length: articleCount }, (_, i) =>
      limit(async () => {
        try {
          const article = await generateSingleArticle(i, focusKeywords);
          
          const progressIncrement = Math.floor(70 / articleCount);
          await db.update(blogGenerationJobs)
            .set({ progress: 5 + (i + 1) * progressIncrement })
            .where(eq(blogGenerationJobs.id, jobId));

          const coverImage = await generateArticleImage(article.title);
          
          const slug = generateSlug(article.title);
          const readTime = calculateReadTime(article.content);

          const [insertedArticle] = await db.insert(blogPosts).values({
            title: article.title,
            slug,
            excerpt: article.excerpt,
            content: article.content,
            coverImage,
            category: article.category,
            tags: article.tags,
            seoTitle: article.seoTitle,
            seoDescription: article.seoDescription,
            focusKeywords: article.focusKeywords,
            readTime,
            isPublished: false,
            generatedBy: 'ai',
          }).returning();

          generatedArticleIds.push(insertedArticle.id);

          await db.update(blogGenerationJobs)
            .set({ generatedArticleIds })
            .where(eq(blogGenerationJobs.id, jobId));

          return insertedArticle;
        } catch (error) {
          console.error(`Failed to generate article ${i + 1}:`, error);
          throw error;
        }
      })
    );

    await Promise.all(articlePromises);

    await db.update(blogGenerationJobs)
      .set({
        status: 'completed',
        progress: 100,
        completedAt: new Date(),
      })
      .where(eq(blogGenerationJobs.id, jobId));

  } catch (error: any) {
    console.error('Blog generation failed:', error);
    await db.update(blogGenerationJobs)
      .set({
        status: 'failed',
        errorMessage: error.message || 'Unknown error occurred',
      })
      .where(eq(blogGenerationJobs.id, jobId));
    
    throw error;
  }
}
