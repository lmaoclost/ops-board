import type { SubTask } from "./types";
import { uid } from "./uid";

export const makeSub = (text: string): SubTask => ({
  id: uid(),
  text,
  note: "",
  prio: 3,
  due: "",
  status: "todo",
  blocked: false,
  subs: [],
});

export function mapSubs(subs: SubTask[], id: string, fn: (s: SubTask) => SubTask): SubTask[] {
  return subs.map((s) => (s.id === id ? fn(s) : { ...s, subs: mapSubs(s.subs, id, fn) }));
}

export function removeSub(subs: SubTask[], id: string): SubTask[] {
  return subs.filter((s) => s.id !== id).map((s) => ({ ...s, subs: removeSub(s.subs, id) }));
}

export function addSub(subs: SubTask[], id: string, child: SubTask): SubTask[] {
  return subs.map((s) =>
    s.id === id ? { ...s, subs: [...s.subs, child] } : { ...s, subs: addSub(s.subs, id, child) },
  );
}