import { NextRequest, NextResponse } from 'next/server';

// AI-powered Sanskrit dictionary using the existing chat API
async function getAIDictionaryMeaning(word: string): Promise<any[]> {
  try {
    const contextPrompt = `You are a Sanskrit scholar and expert in Vedic literature. Provide a comprehensive dictionary entry for the Sanskrit word "${word}". 

Please provide the response in the following JSON format:
{
  "sanskrit": "Sanskrit word in Devanagari script",
  "transliteration": "Roman transliteration",
  "english": "English meaning and definition",
  "grammar": "Grammatical information (noun, verb, etc.)",
  "etymology": "Brief etymology if known",
  
}

Focus on:
1. Accurate Sanskrit script in Devanagari
2. Proper transliteration
3. Comprehensive English meaning
4. Grammatical classification
5. Etymology and word origins

If the word is not found or unclear, provide the best possible interpretation based on Sanskrit linguistics.`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: contextPrompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.answer || '';

    // Try to parse JSON from AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return [{
          sanskrit: parsed.sanskrit || word,
          english: parsed.english || 'Meaning not available',
          transliteration: parsed.transliteration || word,
          grammar: parsed.grammar || 'Not specified',
          etymology: parsed.etymology || '',
          source: 'AI Sanskrit Scholar',
          dictionary: 'AI'
        }];
      }
    } catch (parseError) {
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
