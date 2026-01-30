type TVariable = {
  value: string;
  expression: string;
  computeMethod: "static" | "dynamic";
  isSpecial: boolean;
};

export type TMemory = Record<string, { type: "variable"; content: TVariable }>;