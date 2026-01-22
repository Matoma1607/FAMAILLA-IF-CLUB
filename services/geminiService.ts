
import { GoogleGenAI } from "@google/genai";

export const getClubInsights = async (data: any) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Eres el consultor estratégico de "Famaillá IF", un club de fútbol base. Analiza estos datos: ${JSON.stringify(data)}. Proporciona un resumen de 3 frases motivadoras y analíticas para el director del club sobre el estado de los alumnos y las finanzas.`,
      config: {
        systemInstruction: "Habla con autoridad deportiva, usa un tono profesional y menciona el nombre del club: Famaillá IF.",
        temperature: 0.8,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Los insights de Famaillá IF estarán disponibles en breve.";
  }
};
