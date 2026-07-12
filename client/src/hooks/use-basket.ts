// The basket — THA's most-used write.
//
// PX1-W0 (fnd-px-basket-confirms-wrong-call). All four mutations here used to carry
// only `onSuccess: invalidate`. No `onError`, no toast, nothing. Meanwhile every call
// site fired `addToBasket(...)` UNAWAITED and then awaited a SEPARATE shopping-list
// POST inside its own `try`, and toasted THAT call's success as "Added to basket".
//
// So a failed basket write was actively confirmed to the household as a success. The
// most-used action in the product was 100% unobserved, and the one thing THA said
// about it was false.
//
// The fix is ownership, not another toast: feedback belongs to the mutation. These
// four now speak for themselves through `useTrackedMutation` (the canonical feedback
// owner), and they expose `*Async` variants so a call site that must sequence a
// second write can AWAIT this one and stop claiming a success it never saw.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTrackedMutation } from "@/hooks/use-tracked-mutation";
import { api } from "@shared/routes";
import type { BasketItem } from "@shared/schema";
import { useCallback, useMemo } from "react";

export function useBasket() {
  const queryClient = useQueryClient();
  const basketKey = [api.userBasket.list.path];
  const invalidate = () => queryClient.invalidateQueries({ queryKey: basketKey });

  const { data: basketItems = [], isLoading } = useQuery<BasketItem[]>({
    queryKey: basketKey,
  });

  const addMutation = useTrackedMutation({
    mutationFn: async ({ mealId, quantity }: { mealId: number; quantity?: number }) => {
      const res = await apiRequest('POST', api.userBasket.add.path, { mealId, quantity: quantity || 1 });
      return res.json();
    },
    onSuccess: invalidate,
    feedback: {
      // Success is announced by the call sites that also write the shopping list —
      // one action, one confirmation. The failure is ours, always.
      failure: "Couldn't add that to your basket",
      failureDescription: "Your basket is unchanged. Please try again.",
    },
  });

  const updateMutation = useTrackedMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest('PATCH', `/api/user-basket/${id}`, { quantity });
      return res.json();
    },
    onSuccess: invalidate,
    feedback: {
      failure: "Couldn't change that quantity",
      failureDescription: "Your basket is unchanged. Please try again.",
    },
  });

  const removeMutation = useTrackedMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/user-basket/${id}`);
    },
    onSuccess: invalidate,
    feedback: {
      failure: "Couldn't remove that from your basket",
      failureDescription: "The item is still in your basket. Please try again.",
    },
  });

  const clearMutation = useTrackedMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', api.userBasket.clear.path);
    },
    onSuccess: invalidate,
    feedback: {
      success: "Basket cleared",
      failure: "Couldn't clear your basket",
      failureDescription: "Your basket is unchanged. Please try again.",
    },
  });

  const basketMap = useMemo(() => {
    const map = new Map<number, BasketItem>();
    for (const item of basketItems) {
      map.set(item.mealId, item);
    }
    return map;
  }, [basketItems]);

  const isMealInBasket = useCallback((mealId: number) => basketMap.has(mealId), [basketMap]);

  const getMealQuantity = useCallback((mealId: number) => {
    const item = basketMap.get(mealId);
    return item ? item.quantity : 0;
  }, [basketMap]);

  const getBasketItemId = useCallback((mealId: number) => {
    const item = basketMap.get(mealId);
    return item ? item.id : null;
  }, [basketMap]);

  const totalItems = useMemo(() =>
    basketItems.reduce((sum, item) => sum + item.quantity, 0),
    [basketItems]
  );

  const totalMeals = basketItems.length;

  return {
    basketItems,
    isLoading,
    totalItems,
    totalMeals,
    isMealInBasket,
    getMealQuantity,
    getBasketItemId,
    addToBasket: addMutation.mutate,
    /**
     * Await the basket write before claiming it happened. Rejects on failure — the
     * hook has already told the household why, so a caller should fall silent, not
     * raise a second toast.
     */
    addToBasketAsync: addMutation.mutateAsync,
    updateQuantity: updateMutation.mutate,
    removeFromBasket: removeMutation.mutate,
    clearBasket: clearMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
