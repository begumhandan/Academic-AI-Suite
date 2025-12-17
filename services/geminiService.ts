
import { GoogleGenAI, Type } from "@google/genai";
import { Suggestion, Reference } from "../types";

const apiKey = process.env.API_KEY || '';

const getAIClient = () => {
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

const getSystemInstruction = (persona: string) => {
    let personaInstruction = "";
    
    switch (persona) {
        case 'Strict Academic':
            personaInstruction = "You are a highly formal academic editor. Prioritize objective language, formal sentence structures, and precise academic terminology. Be rigorous.";
            break;
        case 'Friendly Peer':
            personaInstruction = "You are a helpful academic peer. Provide constructive edits that improve flow and readability while maintaining professional standards. Be encouraging.";
            break;
        case 'Minimalist Editor':
            personaInstruction = "You are a minimalist editor. Make only absolutely necessary changes to fix errors or clarity issues. Preserve the author's original voice strictly.";
            break;
        default:
            personaInstruction = "You are an AI-powered academic writing assistant.";
    }

    return `${personaInstruction}
Your role is to assist the user by editing, expanding, refining, or restructuring academic text.
Rules:
- If asked to edit or rewrite, return ONLY the revised text content. 
- DO NOT add conversational filler like "Here is the revised text" or "Sure, I changed it".
- Maintain academic tone and clarity.
- Prefer clarity over complexity.`;
};

export const generateSuggestion = async (
  task: string,
  selectedText: string,
  constraints: string,
  persona: string = 'Strict Academic'
): Promise<Suggestion | null> => {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Task: ${task}\nTarget Text to Modify: "${selectedText}"\nConstraints: ${constraints}\n\nIMPORTANT: Return ONLY the revised text. NO explanations. NO conversational filler.`,
      config: {
        systemInstruction: getSystemInstruction(persona),
      }
    });

    const text = response.text || "";

    return {
      id: crypto.randomUUID(),
      originalText: selectedText,
      suggestedText: text.trim(),
      type: 'rewrite',
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};

export const chatWithAI = async (message: string, context: string, persona: string = 'Strict Academic'): Promise<string> => {
    const ai = getAIClient();
    if (!ai) return "API Key missing.";
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Context (Document Content): ${context.substring(0, 1000)}\nUser Question: ${message}`,
            config: { 
                systemInstruction: getSystemInstruction(persona) 
            }
        });
        return response.text || "...";
    } catch (e) {
        return "Error.";
    }
}

export const extractReferences = async (content: string, style: string = 'APA'): Promise<Reference[]> => {
    const ai = getAIClient();
    if (!ai) return [];

    try {
        // Complex task: extracting full bibliography from limited context requires Google Search
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: `Metindeki atıfları (citations) tespit et ve bunları ${style} formatında tam bir bibliyografya listesine dönüştür.
            
            ÖNEMLİ TALİMATLAR:
            1. Metinde sadece yazar ve yıl olsa bile (örn: Smith, 2023), Google Search kullanarak bu yayının tam başlığını, dergi/kitap adını ve DOI numarasını bul.
            2. Bilgileri internetten doğrula.
            3. Eğer bir bilgiye hiçbir şekilde ulaşılamıyorsa o alanı boş bırak ("" veya null). Kesinlikle "[Bilgi Eksik]" gibi metinler yazma.
            4. Sonucu sadece JSON formatında döndür.

            Metin: """${content}"""`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            authors: { type: Type.STRING },
                            year: { type: Type.STRING },
                            title: { type: Type.STRING },
                            source: { type: Type.STRING },
                            doi: { type: Type.STRING },
                        },
                        required: ["id", "authors", "year", "title"]
                    }
                }
            }
        });

        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (error) {
        console.error("Error extracting references:", error);
        return [];
    }
};
