export const MAX_QUANTITY = 500;

export type QuantityAction =
  | { type: "add"; amount: number }
  | { type: "decrement" }
  | { type: "clear" }
  | { type: "set"; raw: string };

export function quantityReducer(state: number, action: QuantityAction): number {
  switch (action.type) {
    case "add":
      return Math.min(MAX_QUANTITY, state + action.amount);
    case "decrement":
      return Math.max(0, state - 1);
    case "clear":
      return 0;
    case "set": {
      const digits = action.raw.replace(/\D/g, "");
      if (!digits) return 0;
      return Math.min(MAX_QUANTITY, parseInt(digits, 10));
    }
  }
}
