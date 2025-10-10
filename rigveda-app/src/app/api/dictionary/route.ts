import { NextRequest, NextResponse } from 'next/server';

type DictionaryResult = {
  sanskrit: string;
  english: string;
  transliteration?: string;
  grammar?: string;
  etymology?: string;
  source?: string;
  dictionary?: string;
  contextualUsage?: string;
  grammaticalInfo?: string;
  derivedWords?: string;
  usageNote?: string;
  origin?: string;
};

// AI-powered Sanskrit dictionary using direct OpenRouter API call
async function getAIDictionaryMeaning(word: string): Promise<DictionaryResult[]> {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENROUTER_API_KEY');
    }

    const contextPrompt = `
You are a highly knowledgeable Sanskrit scholar specializing in Vedic and Classical Sanskrit philology, lexicography, and etymology. 
Your task is to return a comprehensive Sanskrit dictionary entry for the word: "${word}".

The output must be returned as a valid, parsable JSON object — with no explanations, comments, or Markdown formatting. 
Do not include any text outside the JSON. Return only the JSON.

The input word can be:
- A Sanskrit term (in Devanagari or Roman transliteration)
- An English word that needs Sanskrit translation or equivalents

Follow these instructions:

1. **Language Detection**
   - Detect whether the input is Sanskrit (Devanagari or IAST) or English.
   - Include this as the field: "languageDetected".

2. **If Sanskrit → English**
   Provide fields:
   {
     "word": "",
     "transliteration": "",
     "languageDetected": "Sanskrit",
     "partOfSpeech": "",
     "gender": "",
     "meanings": ["", "", ""],
     "contextualUsage": "",
     "etymology": "",
     "grammaticalInfo": "",
     "derivedOrRelatedWords": ["", ""]
   }

3. **If English → Sanskrit**
   Provide fields:
   {
     "word": "",
     "languageDetected": "English",
     "sanskritEquivalents": [
       {
         "devanagari": "",
         "transliteration": "",
         "partOfSpeech": "",
         "gender": "",
         "meaning": "",
         "etymology": "",
         "usageNote": "",
         "origin": "Vedic / Classical / Philosophical"
       }
     ]
   }

4. **Formatting**
   - Output must be valid JSON with double quotes around keys and string values.
   - No Markdown, no asterisks, no additional commentary.
   - Ensure it can be parsed directly using JSON.parse().
`;
    

    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://rigveda.vercel.app',
        'X-Title': process.env.OPENROUTER_SITE_NAME || 'Rigveda',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: contextPrompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Handle Sanskrit → English response
        if (parsed.languageDetected === 'Sanskrit') {
          return [{
            sanskrit: parsed.word || word,
            english: Array.isArray(parsed.meanings) ? parsed.meanings.join('; ') : parsed.meanings || 'Meaning not available',
            transliteration: parsed.transliteration || word,
            grammar: `${parsed.partOfSpeech || ''} ${parsed.gender || ''}`.trim() || 'Not specified',
            etymology: parsed.etymology || '',
            source: 'AI Sanskrit Scholar',
            dictionary: 'AI',
            contextualUsage: parsed.contextualUsage || '',
            grammaticalInfo: parsed.grammaticalInfo || '',
            derivedWords: Array.isArray(parsed.derivedOrRelatedWords) ? parsed.derivedOrRelatedWords.join(', ') : parsed.derivedOrRelatedWords || ''
          }];
        }
        
        // Handle English → Sanskrit response
        if (parsed.languageDetected === 'English' && Array.isArray(parsed.sanskritEquivalents)) {
          return parsed.sanskritEquivalents.map((equiv: any) => ({
            sanskrit: equiv.devanagari || '',
            english: equiv.meaning || '',
            transliteration: equiv.transliteration || '',
            grammar: `${equiv.partOfSpeech || ''} ${equiv.gender || ''}`.trim() || 'Not specified',
            etymology: equiv.etymology || '',
            source: 'AI Sanskrit Scholar',
            dictionary: 'AI',
            usageNote: equiv.usageNote || '',
            origin: equiv.origin || ''
          }));
        }
      }
    } catch (error) {
      console.log('Failed to parse AI JSON response, using text response');
    }

    // Fallback: return AI response as text
    return [{
      sanskrit: word,
      english: aiResponse,
      transliteration: word,
      grammar: 'AI Analysis',
      source: 'AI Sanskrit Scholar',
      dictionary: 'AI'
    }];

  } catch (error) {
    console.error('AI Dictionary error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json(
        { error: 'Word parameter is required' },
        { status: 400 }
      );
    }

    console.log(`AI Dictionary API called with word: "${word}"`);

    // Use AI to get Sanskrit meaning
    const aiResults = await getAIDictionaryMeaning(word);
    
    if (aiResults.length > 0) {
      console.log(`AI Dictionary found ${aiResults.length} results`);
      return NextResponse.json(aiResults, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // If no AI results, return empty array
    console.log('No AI results found');
    return NextResponse.json([], {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });

  } catch (error) {
    console.error('AI Dictionary API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get AI dictionary meaning',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
