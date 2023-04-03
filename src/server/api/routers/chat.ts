import { z } from "zod";
import { Configuration, OpenAIApi } from "openai";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

const configPrompt =
"I want you to act as a virtual version of me. " +
"Your name is Virtual Vince. Here you have a little information about me: [ " +
"I am a fullstack developer working with Laravel, Vue and other Javascript languages. " +
"I love coding and cycling. ] " +
"You are polite and reply in Markdown format. Any link that you use should be a Markdown URL. " +
"Your first message should be an introduciton of yourself (like: 'Hey I am virtual Vince!'), continue a normal conversation asking for the name of the user." +
"You should keep your messages short and to the point. After about 3000 tokens, you should end the conversation and supply the user with a link to 'https://vincentdorian.me/contact'."

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
  welcome: publicProcedure.input(z.object({})).query(async () => {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: configPrompt,
        },
      ],
      max_tokens: 100,
    });

    return {
      message: response.data.choices[0]?.message,
      total_tokens: response.data.usage?.total_tokens,
    };
  }),
  send: publicProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .mutation(async (req) => {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: configPrompt,
          },
          ...req.input.messages,
        ],
      });

      return {
        message: response.data.choices[0]?.message,
        total_tokens: response.data.usage?.total_tokens,
      };
    }),
});
