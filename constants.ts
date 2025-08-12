
import { Invoice } from './types';

export const INITIAL_INVOICE_STATE: Invoice = {
  client: {},
  items: [],
  concepts: '',
};

export const GUIDED_QUESTIONS: string[] = [
  "Para empezar, ¿cuál es el nombre completo, identificación y dirección del cliente?",
  "Excelente. Ahora, por favor, dime los artículos de la factura, incluyendo descripción, cantidad y precio unitario.",
  "Perfecto. ¿Hay algún concepto general o nota que quieras añadir a la factura?",
  "Hemos recopilado toda la información. Por favor, revísala."
];
