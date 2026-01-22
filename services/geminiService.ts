
import { GoogleGenAI } from "@google/genai";

// getClubInsights analyzes club data using Gemini
export const getClubInsights = async (data: any): Promise<string> => {
  try {
    // Creating instance right before use as recommended to ensure latest API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres el consultor estratégico de "Famaillá IF", un club de fútbol base. Analiza estos datos: ${JSON.stringify(data)}. Proporciona un resumen de 3 frases motivadoras y analíticas para el director del club sobre el estado de los alumnos y las finanzas.`,
      config: {
        systemInstruction: "Habla con autoridad deportiva, usa un tono profesional y menciona el nombre del club: Famaillá IF.",
        temperature: 0.8,
      }
    });
    // Aseguramos que retorne un string, incluso si response.text es undefined
    return response.text || "Análisis temporalmente no disponible. Los datos se están procesando.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Los insights estratégicos de Famaillá IF estarán disponibles una vez configurada la conexión inteligente.";
  }
};
