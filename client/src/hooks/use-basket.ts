import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { api } from "@shared/routes";
import type { BasketItem } from "@shared/schema";
import { useCallback, useMemo } from "react";

export function useBasket() {
  const queryClient = useQueryClient();
  const basketKey = [api.userBasket.list.path];

  const { data: basketItems = [], isLoading } = useQuery<BasketItem[]>({
    queryKey: basketKey,
  });

  const addMutation = useMutation({
    mutationFn: async ({ mealId, quantity }: { mealId: number; quantity?: number }) => {
      const res = await apiRequest('POST', api.userBasket.add.path, { mealId, quantity: quantity || 1 });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: basketKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await apiRequest('PATCH', `/api/user-basket/${id}`, { quantity });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: basketKey }),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/user-basket/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: basketKey }),
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', api.userBasket.clear.path);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: basketKey }),
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
    updateQuantity: updateMutation.mutate,
    removeFromBasket: removeMutation.mutate,
    clearBasket: clearMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
