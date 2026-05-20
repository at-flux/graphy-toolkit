import type { z } from 'zod';
import type { Action, ActionContext } from './types.js';

export async function runActionChain<I, O>(
  actions: readonly Action<I | unknown, unknown>[],
  initialInput: I,
  ctx: ActionContext = {},
): Promise<O> {
  let current: unknown = initialInput;
  for (const action of actions) {
    current = action.inputSchema.parse(current);
    current = await action.run(current as I, ctx);
    current = action.outputSchema.parse(current);
  }
  return current as O;
}

export function defineAction<I, O>(def: Action<I, O>): Action<I, O> {
  return def;
}

export type InferActionInput<A> = A extends Action<infer I, unknown> ? I : never;
export type InferActionOutput<A> = A extends Action<unknown, infer O> ? O : never;

export function parseActionOutput<A extends Action<unknown, unknown>>(
  action: A,
  value: unknown,
): z.infer<A['outputSchema']> {
  return action.outputSchema.parse(value) as z.infer<A['outputSchema']>;
}
