import type { TMemory } from "./CalculatorPopup";

export { };

declare global {
  interface Window {
    api: {
      hide: () => Promise<void>;
      show: () => Promise<void>;
      onFocusInput: (cb: () => void) => () => void;
      setHeight: (height: number) => void;
      setVarHeight: (height: number) => void;
      setMemory: (memory: TMemory) => void;
      onMemoryInvalidated: (cb: () => void) => void;
      getMemory: () => Promise<{ newMemory: TMemory }>;
      hardToggleVarWindow: () => void;
      copyToClipboard: (text: string) => void;
      activateAutoStart: () => void;
      deactivateAutoStart: () => void;
    };
  }
}
