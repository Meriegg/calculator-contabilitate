import { useEffect, useRef, useState } from "react";
import type { TMemory } from "../shared/types.js";
import { VariableTypeMap } from "./utils.js";

export const VariableDisplay = () => {
  const [memory, setMemory] = useState<TMemory>({});

  const mainContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mainWindow = mainContainerRef.current;
    if (!mainWindow) return;

    let raf = 0;

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = Math.ceil(mainWindow.getBoundingClientRect().height);
        window.api.setVarHeight(h);
      });
    });

    resizeObserver.observe(mainWindow);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    window.api.onMemoryInvalidated(() => {
      window.api.getMemory().then(({ newMemory }) => {
        setMemory(newMemory);
      });
    });
  }, []);

  return (
    <div ref={mainContainerRef}>
      <div className="flex flex-col gap-1 p-2">
        {Object.keys(memory).map((varName, idx) => {
          const memoryEntry = memory[varName];

          return (
            <div key={`${varName}-${idx}`} className="flex flex-col">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <p className="text-xs p-0.5 px-1 rounded-md bg-orange-900/50 font-mono font-medium text-white flex items-center gap-0.5">
                    <span className="text-white font-medium text-white/60 text-xs">
                      {memoryEntry.content.computeMethod === "static"
                        ? "s"
                        : "d"}
                    </span>
                    {VariableTypeMap(memoryEntry.type)}
                  </p>
                  {memoryEntry?.content?.isSpecial && (
                    <p className="text-xs p-0.5 px-1 rounded-md bg-blue-900/50 font-mono font-medium text-white flex items-center gap-0.5">
                      sp
                    </p>
                  )}

                  <p className="font-mono text-lg text-white">{varName}</p>
                </div>

                <p className="font-mono font-semibold text-white">
                  <span className="text-white/60 text-xs">=</span>{" "}
                  {parseFloat(memoryEntry.content.value).toFixed(2)}
                </p>
              </div>

              {memoryEntry.content.computeMethod === "dynamic" && (
                <div className="flex items-center justify-between">
                  <p className="text-white/60 font-mono text-xs">d_expr</p>

                  <p className="text-mono text-white font-semibold text-sm">
                    {memoryEntry.content.expression}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
