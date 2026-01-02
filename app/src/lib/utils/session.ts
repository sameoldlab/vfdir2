import { createContext } from "svelte";

export const [getSession, setSession] = createContext<{ v: string }>()
