'use server';
/**
 * @fileOverview A Genkit flow for a voice-activated inventory assistant.
 *
 * - voiceInventoryAssistant - A function that processes user voice commands to manage home inventory.
 * - VoiceInventoryAssistantInput - The input type for the voiceInventoryAssistant function.
 * - VoiceInventoryAssistantOutput - The return type for the voiceInventoryAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VoiceInventoryAssistantInputSchema = z.object({
  command: z.string().describe('The user\'s voice command for inventory management.'),
});
export type VoiceInventoryAssistantInput = z.infer<typeof VoiceInventoryAssistantInputSchema>;

const VoiceInventoryAssistantOutputSchema = z.object({
  response: z.string().describe('The assistant\'s verbal response to the command.'),
  actionTaken: z.string().optional().describe('The specific action performed (e.g., "added", "queried").'),
});
export type VoiceInventoryAssistantOutput = z.infer<typeof VoiceInventoryAssistantOutputSchema>;

const addItemToInventoryTool = ai.defineTool(
  {
    name: 'addItemToInventory',
    description: 'Adds a new item or updates the quantity of an existing item. Use this when the user says things like "I bought bread", "add 2 packs of milk", or "we are low on rice".',
    inputSchema: z.object({
      itemName: z.string().describe('The common name of the item (e.g., "Whole Milk", "Basmati Rice").'),
      quantity: z.number().describe('The amount to add.'),
      unit: z.string().optional().describe('The unit (e.g., "liters", "packets", "kg").'),
      category: z.enum(['groceries', 'medicines', 'vegetables', 'kitchen', 'household']).default('groceries').describe('The most likely category.'),
      lowStockThreshold: z.number().default(10).describe('Alert threshold for low stock.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real implementation, this would call a Firestore service
    console.log(`Action: Adding ${input.quantity} ${input.unit || ''} of ${input.itemName}`);
    return `Successfully added ${input.quantity} ${input.unit || ''} of ${input.itemName} to your ${input.category}. I'll alert you if it drops below ${input.lowStockThreshold}.`;
  }
);

const checkStockLevelsTool = ai.defineTool(
  {
    name: 'checkStockLevels',
    description: 'Checks the current quantity or status of an item. Use for "do we have milk?", "how much rice is left?".',
    inputSchema: z.object({
      itemName: z.string().describe('The name of the item to check.'),
    }),
    outputSchema: z.object({
      found: z.boolean(),
      quantity: z.number().optional(),
      unit: z.string().optional(),
      status: z.string().optional(),
    }),
  },
  async (input) => {
    // Mock data for intelligent response
    const mockData: Record<string, { q: number, u: string }> = {
      'milk': { q: 2, u: 'packets' },
      'rice': { q: 5, u: 'kg' },
      'bread': { q: 1, u: 'loaf' },
    };
    const item = mockData[input.itemName.toLowerCase()];
    if (item) {
      return { found: true, quantity: item.q, unit: item.u, status: item.q < 3 ? 'low' : 'ok' };
    }
    return { found: false };
  }
);

const voiceInventoryAssistantPrompt = ai.definePrompt({
  name: 'voiceInventoryAssistantPrompt',
  input: { schema: VoiceInventoryAssistantInputSchema },
  output: { schema: VoiceInventoryAssistantOutputSchema },
  tools: [addItemToInventoryTool, checkStockLevelsTool],
  system: `You are an intelligent home inventory assistant. Your goal is to parse natural language commands from users (often seniors) and manage their stock.

Intelligence Guidelines:
1. **Identify Items**: Intelligently extract the item name even if described vaguely (e.g., "that white drink" -> "milk").
2. **Handle Quantity**: If the user says "a couple", assume 2. If they say "some", ask for clarification or assume a default of 1.
3. **Thresholds**: If the user doesn't specify a low-stock alert level, default to 10 for total quantity items.
4. **Friendly Tone**: Be warm and use simple language.
5. **Medicine Recognition**: If an item sounds like a medicine (e.g., Paracetamol, Aspirin), set the category to 'medicines'.

Examples:
- "Add two big bags of rice" -> addItemToInventory({ itemName: "Rice", quantity: 2, unit: "bags", category: "kitchen" })
- "How much milk is there?" -> checkStockLevels({ itemName: "milk" })
`,
  prompt: 'User said: {{{command}}}',
});

const voiceInventoryAssistantFlow = ai.defineFlow(
  {
    name: 'voiceInventoryAssistantFlow',
    inputSchema: VoiceInventoryAssistantInputSchema,
    outputSchema: VoiceInventoryAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await voiceInventoryAssistantPrompt(input);
    return output!;
  }
);

export async function voiceInventoryAssistant(input: VoiceInventoryAssistantInput): Promise<VoiceInventoryAssistantOutput> {
  return voiceInventoryAssistantFlow(input);
}
