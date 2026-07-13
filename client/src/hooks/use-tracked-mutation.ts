// PX1-W0 — the canonical feedback owner for mutations.
//
// The literal specification for this hook already existed in the codebase, at
// shopping-workspace-page.tsx:1488–1505: snapshot → optimistic write → onError
// rollback → a toast that TELLS the household the rollback happened → onSettled
// invalidate. It worked, and it was copy-pasted rather than owned — which is how
// 35 other mutations came to have no failure path at all.
//
// This hook owns that pattern. Two rules it enforces by construction:
//
//   1. `feedback.failure` is REQUIRED. A mutation cannot be written that fails in
//      silence, because the type will not compile without the words to say so.
//   2. The error's own message is NEVER shown to the household. `queryClient.ts`
//      throws `${status}: ${rawBody}`, and forwarding that put "500: Internal
//      Server Error" into household toasts. Only the copy declared here is ever
//      rendered.
//
// Feedback belongs to the mutation, not to the call site. When the call site owns
// it, the call site can toast the success of a DIFFERENT request than the one that
// failed — which is exactly what the basket did (fnd-px-basket-confirms-wrong-call).

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface MutationFeedback<TData = unknown, TVariables = unknown, TError = unknown> {
  /**
   * Shown when the write lands. Omit ONLY when the surface is its own
   * confirmation (an optimistic row that visibly appears, a switch that moves).
   */
  success?: string | ((data: TData, variables: TVariables) => string);
  successDescription?: string | ((data: TData, variables: TVariables) => string);
  /**
   * Required. Plain words: what could not be done. Never a status code, never a
   * response body, never "Error:".
   */
  failure: string | ((variables: TVariables) => string);
  /**
   * What it means for their data, and the one way forward (EXP §14). For an
   * optimistic write this is where the rollback is DISCLOSED — a change that
   * silently snaps back reads as a broken control, not as a failure.
   */
  failureDescription?: string | ((variables: TVariables) => string);
  /**
   * PX1-W4b (fnd-px-success-silent-error-loud).
   *
   * Recognises an outcome the SERVER calls an error but the HOUSEHOLD would not:
   * what they asked for is already true. Adding an ingredient that is already in
   * the pantry is not a failure — it is the pantry agreeing with them — and it
   * used to be raised in red, with a destructive icon, in the same voice THA uses
   * to say a write was lost. EXP §14: "Alarm is reserved for genuine data loss or
   * safety."
   *
   * Return the plain words to say and the toast stays CALM. Return nothing and the
   * error is a real failure and alarms, as it should. There is no way to express
   * "satisfied" as a destructive toast, which is the point.
   */
  satisfied?: (
    error: TError,
    variables: TVariables,
  ) => { title: string; description?: string } | null | undefined | false;
}

function resolve<TArgs extends unknown[]>(
  copy: string | ((...args: TArgs) => string) | undefined,
  ...args: TArgs
): string | undefined {
  return typeof copy === "function" ? copy(...args) : copy;
}

/**
 * `useMutation` with a mandatory failure path.
 *
 * The caller's own `onSuccess` / `onError` still run — this hook adds the
 * household's feedback, it does not take the mutation's behaviour away. Use
 * `onError` for the optimistic rollback and let `feedback.failureDescription`
 * say that the rollback happened.
 *
 * Destructive mutations must additionally carry a confirmation (`ui/alert-dialog`)
 * or an undo at the call site. This hook makes the failure audible; it cannot make
 * an irreversible action reversible.
 */
export function useTrackedMutation<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: UseMutationOptions<TData, TError, TVariables, TContext> & {
    feedback: MutationFeedback<TData, TVariables, TError>;
  },
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { feedback, onSuccess, onError, ...rest } = options;
  const { toast } = useToast();

  return useMutation<TData, TError, TVariables, TContext>({
    ...rest,
    onSuccess: (data, variables, context) => {
      const title = resolve(feedback.success, data, variables);
      if (title) {
        toast({
          title,
          description: resolve(feedback.successDescription, data, variables),
        });
      }
      return onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      // The caller's rollback runs FIRST, so the household never sees the toast
      // describing a rollback that has not happened yet.
      const result = onError?.(error, variables, context);

      // A satisfied state is not a failure and is never raised as one.
      const satisfied = feedback.satisfied?.(error, variables);
      if (satisfied) {
        toast({ title: satisfied.title, description: satisfied.description });
        return result;
      }

      toast({
        title: resolve(feedback.failure, variables) ?? "Something didn't save",
        description: resolve(feedback.failureDescription, variables),
        variant: "destructive",
      });
      return result;
    },
  });
}
