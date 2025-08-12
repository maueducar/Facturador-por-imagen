import { GoogleGenAI, Type } from "@google/genai";
import { Invoice, GeminiResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const INVOICE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    client: {
      type: Type.OBJECT,
      description: "Datos del cliente extraídos del transcript. No inventar información.",
      properties: {
        name: { type: Type.STRING, description: "Nombre completo del cliente." },
        id: { type: Type.STRING, description: "Número de identificación del cliente (CUIT, DNI, etc.)." },
        address: { type: Type.STRING, description: "Dirección física o fiscal del cliente." },
      },
    },
    items: {
      type: Type.ARRAY,
      description: "Lista de artículos o servicios facturados. Extraer descripción, cantidad y precio por unidad.",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Nombre o descripción del artículo/servicio." },
          quantity: { type: Type.NUMBER, description: "Número de unidades." },
          unitPrice: { type: Type.NUMBER, description: "Precio por unidad." },
        },
        required: ["description", "quantity", "unitPrice"],
      },
    },
    concepts: {
      type: Type.STRING,
      description: "Notas generales, observaciones o conceptos adicionales para la factura.",
    },
    isComplete: {
      type: Type.BOOLEAN,
      description: "Establecer en true solo si el transcript parece contener toda la información necesaria para una factura (datos del cliente y al menos un artículo con cantidad y precio). De lo contrario, false.",
    },
  },
};

const createPrompt = (transcript: string, currentInvoice: Invoice, currentQuestion?: string): string => {
  return `Eres un asistente experto en la creación de facturas de venta a partir de transcripciones de voz en español.
Tu tarea es analizar el discurso del usuario y extraer datos estructurados.
DEBES responder únicamente con un objeto JSON que coincida con el esquema proporcionado. No agregues explicaciones ni texto introductorio.

Datos de la factura actual (hasta ahora):
${JSON.stringify(currentInvoice, null, 2)}

${currentQuestion ? `El usuario está respondiendo a la siguiente pregunta: "${currentQuestion}"` : 'El usuario está dictando la factura de forma libre.'}

Transcripción de la voz del usuario:
"${transcript}"

Instrucciones:
1. Lee la transcripción y los datos de la factura actual.
2. Actualiza los datos de la factura con cualquier información nueva encontrada en la transcripción. Si la transcripción contiene información ya presente, sobrescríbela solo si la nueva información es más específica o corrige un error. No elimines datos existentes a menos que se contradigan explícitamente.
3. Analiza si la nueva información completa un paso. Por ejemplo, si se pregunta por el cliente y el usuario lo provee.
4. Completa los campos 'client', 'items' y 'concepts' basándote en la transcripción.
5. Determina si la factura parece completa. Establece 'isComplete' en true si los datos del cliente y al menos un artículo están presentes. De lo contrario, mantenlo en false.
6. Devuelve los datos actualizados como un único objeto JSON.`;
};


export const processInvoiceTranscript = async (
  transcript: string,
  currentInvoice: Invoice,
  currentQuestion?: string
): Promise<GeminiResponse> => {
  try {
    const prompt = createPrompt(transcript, currentInvoice, currentQuestion);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: INVOICE_SCHEMA,
        temperature: 0.1,
      },
    });
    
    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText) as GeminiResponse;
    return parsedJson;

  } catch (error) {
    console.error("Error al procesar con Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`Error en la API de Gemini: ${error.message}`);
    }
    throw new Error("Se produjo un error desconocido al contactar con la IA.");
  }
};