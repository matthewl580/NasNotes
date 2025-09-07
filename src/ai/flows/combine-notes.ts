'use server';

/**
 * @fileOverview Combines multiple notes using AI to generate a cohesive summary.
 *
 * - combineNotes - A function that combines notes and generates a summary.
 * - CombineNotesInput - The input type for the combineNotes function.
 * - CombineNotesOutput - The return type for the combineNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CombineNotesInputSchema = z.object({
  notes: z
    .array(
      z.object({
        title: z.string().optional(),
        content: z.string(),
      })
    )
    .describe('An array of notes to combine.'),
});

export type CombineNotesInput = z.infer<typeof CombineNotesInputSchema>;

const CombineNotesOutputSchema = z.object({
  summary: z.string().describe('A cohesive summary of the combined notes.'),
});

export type CombineNotesOutput = z.infer<typeof CombineNotesOutputSchema>;

export async function combineNotes(input: CombineNotesInput): Promise<CombineNotesOutput> {
  return combineNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'combineNotesPrompt',
  input: {schema: CombineNotesInputSchema},
  output: {schema: CombineNotesOutputSchema},
  prompt: `You are an expert note taker and summarizer. Your goal is to combine multiple notes into a single, cohesive summary.\n\nNotes:\n{{#each notes}}\nTitle: {{title}}\nContent: {{content}}\n{{/each}}\n\nSummary:`,
});

const combineNotesFlow = ai.defineFlow(
  {
    name: 'combineNotesFlow',
    inputSchema: CombineNotesInputSchema,
    outputSchema: CombineNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
