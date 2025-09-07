// Summarize Long Notes Flow
'use server';
/**
 * @fileOverview A flow for summarizing long notes using AI.
 *
 * - summarizeLongNote - A function that summarizes a long note if it exceeds a certain length.
 * - SummarizeLongNoteInput - The input type for the summarizeLongNote function.
 * - SummarizeLongNoteOutput - The return type for the summarizeLongNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeLongNoteInputSchema = z.object({
  noteContent: z
    .string()
    .describe('The content of the note to be summarized.'),
});
export type SummarizeLongNoteInput = z.infer<typeof SummarizeLongNoteInputSchema>;

const SummarizeLongNoteOutputSchema = z.object({
  summary: z.string().describe('The summarized content of the note.'),
});
export type SummarizeLongNoteOutput = z.infer<typeof SummarizeLongNoteOutputSchema>;

const MAX_NOTE_LENGTH = 1000; // Define the maximum note length before summarization

export async function summarizeLongNote(input: SummarizeLongNoteInput): Promise<SummarizeLongNoteOutput> {
  return summarizeLongNoteFlow(input);
}

const summarizeNotePrompt = ai.definePrompt({
  name: 'summarizeNotePrompt',
  input: {schema: SummarizeLongNoteInputSchema},
  output: {schema: SummarizeLongNoteOutputSchema},
  prompt: `Summarize the following note content:

{{{noteContent}}}`,
});

const summarizeLongNoteFlow = ai.defineFlow(
  {
    name: 'summarizeLongNoteFlow',
    inputSchema: SummarizeLongNoteInputSchema,
    outputSchema: SummarizeLongNoteOutputSchema,
  },
  async input => {
    if (input.noteContent.length > MAX_NOTE_LENGTH) {
      const {output} = await summarizeNotePrompt(input);
      return output!;
    } else {
      return { summary: input.noteContent }; // Return the original content if it's not too long
    }
  }
);
