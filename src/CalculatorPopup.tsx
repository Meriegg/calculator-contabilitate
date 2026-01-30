import type { TMemory } from "../shared/types.js";
import { useEffect, useRef, useState } from "react";

type EvalCtx = {
  stack: string[];
  inProgressVars: Record<string, number>;
};

const memory: TMemory = {};
let tempMemory: TMemory = {};

interface TEvaluationOutput {
  finalValue: string;
  UIElems: string[];
}

const CalculatorWidget = () => {
  const [expression, setExpression] = useState("");
  const [finalValue, setFinalValue] = useState("");
  const [currUIElems, setCurrUIElems] = useState<string[]>([]);
  const [expressionHistory, setExpressionHistory] = useState<string[]>([]);
  const [expressionHistoryIndex, setExpressionHistoryIndex] = useState<
    number | null
  >(null);

  const [lastInput, setLastInput] = useState("");

  const mainContainerRef = useRef<HTMLDivElement>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleCommand = (exp: string, exec: boolean): TEvaluationOutput => {
    const command = exp.trim().slice(1);

    switch (true) {
      case command === "ajutor": {
        return {
          finalValue: `/ajutor: Afiseaza toate comenzile
/t: Inchide/deschide fereastra cu variabile
/c var1,var2,...,varN: Sterge variabilele specificate
/ca: Sterge toate variabilele
/cs var1,var2,...,varN: Sterge variabilele speciale specificate
/csa var1,var2,...,varN: Sterge toate variabilele speciale
/aas: Activeaza start automat
/das: Dezactiveaza start automat`,
          UIElems: [],
        };
      }

      case command === "t": {
        if (exec) {
          window.api.hardToggleVarWindow();
        }
        return {
          finalValue: "",
          UIElems: [`Inchide/deschide fereastra cu variabile.`],
        };
      }

      case command.startsWith("c "): {
        const variableNames = command.replace("c ", "").trim().split(",");
        if (!variableNames?.length) {
          return {
            finalValue: "",
            UIElems: [`Comanda invalida: Nicio variabila specificata`],
          };
        }

        if (exec) {
          for (const varName of variableNames) {
            if (memory[varName]?.content?.isSpecial === true) continue;

            delete memory[varName];
          }

          window.api.setMemory(memory);
        }

        return {
          finalValue: "",
          UIElems: [`Sterge ${variableNames.join(", ")}`],
        };
      }

      case command === "ca": {
        if (exec) {
          for (const varName of Object.keys(memory)) {
            if (memory[varName]?.content?.isSpecial === true) continue;

            delete memory[varName];
          }

          window.api.setMemory(memory);
        }

        return {
          finalValue: "",
          UIElems: [`Sterge toate variabilele`],
        };
      }

      case command.startsWith("cs "): {
        const variableNames = command.replace("c ", "").trim().split(",");
        if (!variableNames?.length) {
          return {
            finalValue: "",
            UIElems: [`Comanda invalida: Nicio variabila specificata`],
          };
        }

        if (exec) {
          for (const varName of variableNames) {
            if (memory[varName]?.content?.isSpecial === false) continue;

            delete memory[varName];
          }

          window.api.setMemory(memory);
        }

        return {
          finalValue: "",
          UIElems: [`Sterge special ${variableNames.join(", ")}`],
        };
      }

      case command === "csa": {
        if (exec) {
          for (const varName of Object.keys(memory)) {
            if (memory[varName]?.content?.isSpecial === false) continue;

            delete memory[varName];
          }

          window.api.setMemory(memory);
        }

        return {
          finalValue: "",
          UIElems: [`Sterge toate variabilele speciale`],
        };
      }

      case command == "aas": {
        if (exec) window.api.activateAutoStart();

        return {
          finalValue: "",
          UIElems: [`Activeaza start automat.`],
        };
      }

      case command === "das": {
        if (exec) window.api.deactivateAutoStart();

        return {
          finalValue: "",
          UIElems: [`Dezactiveaza start automat.`],
        };
      }

      default:
        return {
          finalValue: "",
          UIElems: [`Comanda invalida! [${command}]`],
        };
    }
  };

  const cycleWarn = (ctx: EvalCtx, name: string) => {
    const start = ctx.stack.indexOf(name);
    const cyclePath =
      start >= 0
        ? [...ctx.stack.slice(start), name].join(" -> ")
        : `${name} -> ${name}`;
    return `WARN: Referinta circulara, se va folosi valoarea statica: ${cyclePath}`;
  };

  const evaluateExpression = (
    exp: string,
    exec: boolean,
    topLevel = true,
    evalCtx: EvalCtx = {
      stack: [],
      inProgressVars: {},
    },
  ): TEvaluationOutput => {
    if (exp.trim().startsWith("/")) {
      return handleCommand(exp, exec);
    }

    if (!exec && topLevel) tempMemory = { ...memory };

    const uiElems: string[] = [];
    if (exp === "") return { finalValue: "", UIElems: uiElems };

    let cursor = 0;
    let parenDepth = 0;
    let tokens: string[] = [];
    let lastFinal = "";

    const computeResultFromEvalString = (stmtTokens: string[]) => {
      const stmt = stmtTokens.join("").trim();
      if (!stmt.length) return;

      try {
        const out = String(eval(stmt));
        lastFinal = out;
        uiElems.push(`eval ${stmt} -> ${out}`);
      } catch (e) {
        console.error(e);
        uiElems.push(`ERR: Expresie invalida. [${stmt}]`);
        lastFinal = "";
      }
    };

    while (cursor < exp.length) {
      const char = exp[cursor];

      if (char === "#" || /[A-Za-z_]/.test(char)) {
        const variable = evaluateVariable(exp.slice(cursor), exec, evalCtx);
        uiElems.push(...variable.UIElems);
        tokens.push(variable.finalValue);
        cursor += variable.cursor;
        continue;
      }

      if (char === "(" || char === "[" || char === "{") parenDepth++;
      if (char === ")" || char === "]" || char === "}") parenDepth--;

      if (parenDepth === 0 && char === ";") {
        computeResultFromEvalString(tokens);
        tokens = [];
        cursor++;
        continue;
      }

      tokens.push(char);
      cursor++;
    }

    computeResultFromEvalString(tokens);

    // if (lastFinal !== "") uiElems.push(`=> ${lastFinal}`);

    if (exec) window.api.setMemory(memory);

    return { finalValue: lastFinal, UIElems: uiElems };
  };

  const evaluateVariable = (
    exp: string,
    exec: boolean,
    evalCtx: EvalCtx,
  ): TEvaluationOutput & { cursor: number } => {
    const usedMemory = exec ? memory : tempMemory;
    const uiElems: string[] = [];

    let cursor = 0;
    let isSpecial = false;

    const skipSpaces = () => {
      while (cursor < exp.length && exp[cursor] === " ") cursor++;
    };

    const nameStart = /[A-Za-z_]/;
    const nameChar = /[A-Za-z0-9_]/;
    const valueChar = /[0-9A-Za-z_#+\-*/().\s]/;

    let queryMode: "s" | "d" = "s";
    if (exp[cursor] === "#") {
      queryMode = "d";
      cursor++;
    }

    skipSpaces();

    // handle variable name
    if (cursor >= exp.length || !nameStart.test(exp[cursor])) {
      return {
        finalValue: "",
        UIElems: [...uiElems, "ERR: Referinta la variabila invalida."],
        cursor,
      };
    }

    let variableName = "";
    while (cursor < exp.length && nameChar.test(exp[cursor])) {
      variableName += exp[cursor++];
    }

    skipSpaces();

    // handle assignment expression
    if (exp[cursor] === "=") {
      cursor++;
      skipSpaces();

      let assignedExp = "";
      while (cursor < exp.length) {
        const char = exp[cursor];
        if (char === "!") {
          isSpecial = true;
          cursor += 1;
          continue;
        }
        if (char === ";" || !valueChar.test(char)) break;
        assignedExp += char;
        cursor++;
      }
      assignedExp = assignedExp.trim();

      if (!assignedExp.length) {
        return {
          finalValue: "",
          UIElems: [
            ...uiElems,
            `ERR: Lipseste expresia pentru ${variableName}.`,
          ],
          cursor,
        };
      }

      const method: "s" | "d" =
        queryMode === "d" && exec
          ? "d"
          : usedMemory?.[variableName]?.content.computeMethod === "dynamic"
            ? "d"
            : "s";

      const out = evaluateExpression(assignedExp, exec, false);
      uiElems.push(...out.UIElems);

      const assignedValue = out.finalValue;

      usedMemory[variableName] = {
        type: "variable",
        content: {
          value: assignedValue,
          expression: assignedExp,
          computeMethod: method === "d" ? "dynamic" : "static",
          isSpecial:
            usedMemory?.[variableName]?.content?.isSpecial === true
              ? true
              : isSpecial,
        },
      };

      uiElems.push(
        `(set) var[${variableName}] = ${method === "d" ? `(${assignedExp})` : assignedValue} [${method}]`,
      );

      return { finalValue: assignedValue, UIElems: uiElems, cursor };
    }

    // handle reference expression
    const entry = usedMemory?.[variableName];
    if (!entry) {
      return {
        finalValue: "",
        UIElems: [...uiElems, `ERR: Variabila \`${variableName}\` nu exista.`],
        cursor,
      };
    }

    const storedMethod: "s" | "d" =
      entry.content.computeMethod === "dynamic" ? "d" : "s";

    if (storedMethod === "s") {
      uiElems.push(`(=) var[${variableName}] = ${entry.content.value} [s]`);
      return { finalValue: entry.content.value, UIElems: uiElems, cursor };
    }

    if (evalCtx.inProgressVars?.[variableName] !== undefined) {
      uiElems.push(cycleWarn(evalCtx, variableName));
      return {
        cursor,
        finalValue: entry.content.value,
        UIElems: uiElems,
      };
    }

    evalCtx.inProgressVars[variableName] = 0;
    evalCtx.stack.push(variableName);

    const computed = evaluateExpression(
      entry.content.expression,
      false,
      false,
      evalCtx,
    );

    delete evalCtx.inProgressVars[variableName];
    evalCtx.stack.pop();

    if (
      computed.UIElems?.some((e) => e.includes("ERR")) ||
      computed.finalValue === ""
    ) {
      uiElems.push(
        `WARN: var[${variableName}] -> static ${entry.content.value}`,
      );
      return { finalValue: entry.content.value, UIElems: uiElems, cursor };
    }

    uiElems.push(`(=) var[${variableName}] = ${computed.finalValue} [d]`);
    return { finalValue: computed.finalValue, UIElems: uiElems, cursor };
  };

  useEffect(() => {
    const mainWindow = mainContainerRef.current;
    if (!mainWindow) return;

    let raf = 0;

    const resizeObserver = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = Math.ceil(mainWindow.getBoundingClientRect().height);
        window.api.setHeight(h);
      });
    });

    resizeObserver.observe(mainWindow);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!mainInputRef?.current) return;

    mainInputRef.current.focus();
  }, [mainInputRef]);

  return (
    <div
      className="flex text-white w-full h-auto flex-col gap-2 window"
      ref={mainContainerRef}
    >
      <input
        ref={mainInputRef}
        value={expression}
        style={{
          backdropFilter: "blur(150px)",
        }}
        className="w-full text-white border-b-[1px] focus:outline-none text-2xl p-4 border-white/10"
        onChange={(e) => {
          const mainEval = evaluateExpression(e.target.value, false);
          setExpressionHistoryIndex(null);
          setFinalValue(mainEval.finalValue);
          setCurrUIElems(mainEval.UIElems);
          setExpression(e.target.value);
        }}
        placeholder="x = 3; 1 + x"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            window.api.hide();
            return;
          }

          if (e.key === "Enter") {
            const mainEval = evaluateExpression(expression, true);
            setExpressionHistory((prev) => [...prev, expression]);
            setLastInput("");
            setFinalValue("");
            setExpression("");
            setCurrUIElems([]);
            window.api.copyToClipboard(mainEval.finalValue);
            window.api.hide();
            return;
          }

          if (e.key === "ArrowUp") {
            if (expressionHistoryIndex === null && !!expression)
              setLastInput(expression);

            const newIdx =
              expressionHistoryIndex === null
                ? expressionHistory.length - 1
                : expressionHistoryIndex - 1;
            if (newIdx >= 0) {
              setExpressionHistoryIndex(newIdx);
              setExpression(expressionHistory[newIdx]);
            }
          }

          if (e.key === "ArrowDown") {
            if (expressionHistoryIndex === null) return;

            const newIdx = expressionHistoryIndex + 1;

            if (newIdx < expressionHistory.length) {
              setExpressionHistoryIndex(newIdx);
              setExpression(expressionHistory[newIdx]);
            } else {
              setExpressionHistoryIndex(null);
              setExpression(lastInput);
              setLastInput("");
            }
          }
        }}
      />

      <div className="flex flex-col -mt-1 gap-1 w-full">
        <div className="flex px-1 flex-col gap-1 w-full">
          <p className="text-lg font-medium w-full p-4 rounded-xl bg-white/5">
            <pre
              className="font-sans"
              dangerouslySetInnerHTML={{
                __html: finalValue || "-Fara rezultat-",
              }}
            ></pre>
            <span className="flex items-center justify-between w-full text-xs font-normal text-white/60">
              <span>rezultat final</span>
              <span>
                copiaza: <span className="font-medium text-white">Enter</span>
              </span>
            </span>
          </p>
        </div>

        <div className="py-2 -mt-3.5">
          <p className="text-xs text-white/70 py-1 px-2">rationament</p>
          <hr className="border-white/10" />
        </div>

        <div className="flex px-1 -mt-2 flex-col gap-0.5 w-full">
          {currUIElems.map((e, idx) => (
            <p
              key={idx}
              className="text-xs p-3 py-2 font-medium rounded-lg bg-white/5"
            >
              {e}
            </p>
          ))}
        </div>
      </div>

      {/* <pre>{JSON.stringify(window.location.hash, null, 2)}</pre> */}

      {/* <pre className="text-left">{JSON.stringify(memory, null, 2)}</pre>
      <pre className="text-left">{JSON.stringify(tempMemory, null, 2)}</pre> */}
    </div>
  );
};

export default CalculatorWidget;
