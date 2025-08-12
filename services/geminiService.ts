
import { GoogleGenAI, Type } from "@google/genai";
import type { ReceiptData } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const receiptSchema = {
    type: Type.OBJECT,
    properties: {
        storeName: { 
            type: Type.STRING,
            description: "El nombre de la tienda o comercio."
        },
        transactionDate: {
            type: Type.STRING,
            description: "La fecha de la transacción en formato YYYY-MM-DD."
        },
        totalAmount: {
            type: Type.NUMBER,
            description: "El importe total de la factura."
        },
        items: {
            type: Type.ARRAY,
            description: "Una lista de los artículos comprados.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "El nombre del artículo."
                    },
                    quantity: {
                        type: Type.INTEGER,
                        description: "La cantidad del artículo. Si no se especifica, asumir 1."
                    },
                    price: {
                        type: Type.NUMBER,
                        description: "El precio unitario o total del artículo."
                    }
                },
                required: ["name", "quantity", "price"]
            }
        }
    },
    required: ["storeName", "transactionDate", "totalAmount", "items"]
};


export const extractReceiptData = async (base64Image: string): Promise<ReceiptData> => {
    const prompt = `Analiza la imagen de esta factura. Extrae el nombre de la tienda, la fecha, el importe total y una lista detallada de los artículos con su nombre, cantidad y precio. Asegúrate de que la salida sea un objeto JSON válido que cumpla con el esquema proporcionado. Si un dato no está claro, intenta inferirlo de la mejor manera posible. La fecha debe estar en formato AAAA-MM-DD.`;

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1],
        },
    };

    const textPart = {
        text: prompt,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: receiptSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedData = JSON.parse(jsonText);

        // Basic validation
        if (!parsedData.storeName || !parsedData.totalAmount) {
            throw new Error("El JSON extraído no tiene los campos requeridos.");
        }

        return parsedData as ReceiptData;

    } catch (error) {
        console.error("Error al procesar la factura con Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Error de la IA: ${error.message}`);
        }
        throw new Error("Ocurrió un error desconocido al contactar con la IA.");
    }
};
