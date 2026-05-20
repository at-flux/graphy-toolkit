import type { z } from 'zod';

export type ActionContext = {
  readonly log?: (message: string) => void;
};

export type Action<I, O> = {
  readonly name: string;
  readonly inputSchema: z.ZodType<I>;
  readonly outputSchema: z.ZodType<O>;
  readonly run: (input: I, ctx: ActionContext) => Promise<O>;
};
