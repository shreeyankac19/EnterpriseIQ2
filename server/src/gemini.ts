import { GoogleGenerativeAI } from '@google/generative-ai';
import { synthesizeLocalRAGAnswer, GroundedResult, searchKnowledgeChunks, queryProjectsForRag } from './rag.js';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function askEnterpriseIQ(
  query: string,
  userRole: string,
  chatHistory: Array<{ sender: string; content: string }> = []
): Promise<GroundedResult> {
  // First, always retrieve factual sources from database and document chunks
  const localRagResult = synthesizeLocalRAGAnswer(query, userRole);

  // If query is completely off-topic or information is unavailable, maintain factual grounding guardrail
  if (!localRagResult.isGrounded) {
    return localRagResult;
  }

  // If no Gemini API key configured, return high-accuracy deterministic RAG result directly
  if (!GEMINI_API_KEY || GEMINI_API_KEY.trim() === '' || GEMINI_API_KEY.includes('your_api_key_here')) {
    return localRagResult;
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2, // low temperature for strict factual grounding
        maxOutputTokens: 800
      }
    });

    const contextSnippet = localRagResult.sources
      .map((s, idx) => `[Source ${idx + 1}: ${s.title} (${s.detail})]\n${s.reference}`)
      .join('\n\n');

    const prompt = `You are EnterpriseIQ, an AI-powered Enterprise Knowledge Management Assistant.
You must answer the user's question using ONLY the provided verified enterprise documents and database context below.
Do not fabricate, speculate, or introduce outside information.
If the information is not present in the context, reply that you could not find information regarding this in company records.
Always maintain a professional, concise, executive tone.

VERIFIED ENTERPRISE CONTEXT:
${contextSnippet}

USER QUESTION:
${query}

Please formulate an accurate, well-formatted response with bold highlights and bullet points where helpful:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return {
      answer: text.trim(),
      sources: localRagResult.sources,
      isGrounded: true
    };
  } catch (error: any) {
    console.error('Gemini API call failed, falling back to local grounded engine:', error.message);
    return localRagResult;
  }
}
