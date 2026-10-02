
'use server';
/**
 * @fileOverview A Genkit flow for processing grocery receipts using OCR.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReceiptProcessorInputSchema = z.object({
  photoDataUri: z.string().describe("A photo of a receipt as a data URI (base64)."),
});

const ReceiptProcessorOutputSchema = z.object({
  totalAmount: z.number().describe("The total amount spent according to the receipt."),
  date: z.string().describe("The date of the receipt."),
  items: z.array(z.object({
    name: z.string().describe("The name of the item."),
    quantity: z.number().describe("Quantity purchased."),
    price: z.number().describe("Price of the item."),
    category: z.string().describe("Likely category: groceries, medicines, vegetables, kitchen, household.")
  })).describe("List of items identified on the receipt.")
});

export async function processReceipt(input: { photoDataUri: string }) {
  return receiptProcessorFlow(input);
}

const receiptProcessorPrompt = ai.definePrompt({
  name: 'receiptProcessorPrompt',
  input: { schema: ReceiptProcessorInputSchema },
  output: { schema: ReceiptProcessorOutputSchema },
  prompt: `You are an expert receipt OCR assistant. 
Analyze the provided image of a shopping receipt.
Extract the total amount spent, the date, and a list of all items.
For each item, try to determine the quantity, price, and assign it a category from: groceries, medicines, vegetables, kitchen, household.

Photo: {{media url=photoDataUri}}`,
});

const receiptProcessorFlow = ai.defineFlow(
  {
    name: 'receiptProcessorFlow',
    inputSchema: ReceiptProcessorInputSchema,
    outputSchema: ReceiptProcessorOutputSchema,
  },
  async (input) => {
    const { output } = await receiptProcessorPrompt(input);
    return output!;
  }
);
