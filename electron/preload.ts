import type { TMemory } from '../shared/types.js';
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  hide: () => {
    console.log("hide")
    ipcRenderer.invoke("ui:hide")
  },
  show: () => ipcRenderer.invoke("ui:show"),
  onFocusInput: (cb: () => void) => {
    ipcRenderer.on("ui:focusInput", cb);
    return () => ipcRenderer.removeListener("ui:focusInput", cb);
  },
  setHeight: (height: number) => ipcRenderer.invoke("ui:setHeight", height),
  setVarHeight: (height: number) => ipcRenderer.invoke("ui:setVarHeight", height),
  setMemory: (memory: TMemory) => ipcRenderer.invoke("state:setMemory", memory),
  getMemory: () => ipcRenderer.invoke("state:getMemory"),
  onMemoryInvalidated: (cb: () => void) => {
    console.log("memory invalidated")
    ipcRenderer.on("state:memInvalidated", cb);
  },
  hardToggleVarWindow: () => ipcRenderer.invoke("ui:hardToggleVarWindow"),
  copyToClipboard: (text: string) => ipcRenderer.invoke("ui:copyToClipboard", text),
  activateAutoStart: () => ipcRenderer.invoke("activateAutoStart"),
  deactivateAutoStart: () => ipcRenderer.invoke("deactivateAutoStart")
});
