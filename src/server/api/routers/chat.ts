import { z } from "zod";
import { Configuration, OpenAIApi } from "openai";
import type { ChatCompletionResponseMessage } from "openai";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

/* const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
); */

export const chatRouter = createTRPCRouter({
  example: publicProcedure
    .input(
      z.object({
        role: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const { content, role } = input;

      //returns a ChatCompletionResponse object example (not the real api)
      const response = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Answer to your question: " + content,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 9,
          completion_tokens: 12,
          total_tokens: 21,
        },
      };

      return response?.choices[0]?.message;
    }),
});
