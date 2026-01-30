import type { TMemory } from "../shared/types";

export const VariableTypeMap = (type: TMemory[number]['type']) => {
  switch (type) {
    case "variable":
      return "var";
    default:
      return type;
  }
}