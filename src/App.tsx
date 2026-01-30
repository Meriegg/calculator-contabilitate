import CalculatorWidget from "./CalculatorPopup";
import { VariableDisplay } from "./VariableDisplay";

export const App = () => {
  if (window.location.hash?.includes("var")) {
    return <VariableDisplay />;
  }

  return <CalculatorWidget />;
};
