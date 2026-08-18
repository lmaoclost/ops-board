import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { migrateLegacy, normalizeState, purgeExpired, SCHEMA_VERSION } from "./migrate";
import type { Locale } from "./i18n";
import { nextDue } from "./repeat";
import { todayISO } from "./date";
import type { AddTaskInput, Prio, Project, Status, SubTask, Task, TaskPatch } from "./types";
import { uid } from "./uid";

let storageErrorHandler: (() => void) | null = null;

export function setStorageErrorHandler(fn: (() => void) | null) {
  storageErrorHandler = fn;
}

const safeLocalStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      storageErrorHandler?.();
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

interface BoardStore {
  projetos: Project[];
  locale: Locale;
  setLocale: (locale: Locale) => void;
  canUndo: boolean;
  undo: () => void;
  addProject: (title: string) => void;
  renameProject: (id: string, title: string, blocked: boolean, due?: string) => void;
  deleteProject: (id: string) => void;
  toggleProjectArchive: (id: string) => void;
  setProjectPrio: (id: string, prio: Prio) => void;
  toggleProjectCollapsed: (id: string) => void;
  addSection: (pid: string, title: string) => void;
  renameSection: (pid: string, sid: string, title: string) => void;
  deleteSection: (pid: string, sid: string) => void;
  addTask: (pid: string, sid: string, text: string) => void;
  addTaskFull: (pid: string, sid: string, input: AddTaskInput) => void;
  editTask: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  deleteTask: (pid: string, sid: string, tid: string) => void;
  restoreTask: (pid: string, sid: string, tid: string) => void;
  purgeTask: (pid: string, sid: string, tid: string) => void;
  setTaskStatus: (pid: string, sid: string, tid: string, status: Status) => void;
  setTaskPrio: (pid: string, sid: string, tid: string, prio: Prio) => void;
  cycleTaskPrio: (pid: string, sid: string, tid: string) => void;
  toggleTask: (pid: string, sid: string, tid: string) => void;
  toggleSection: (pid: string, sid: string) => void;
  moveTask: (
    src: { pid: string; sid: string; tid: string },
    dest: { pid: string; sid: string },
    index: number,
  ) => void;
  reset: () => void;
  importState: (projetos: Project[]) => void;
}

const findProject = (projetos: Project[], pid: string) => projetos.find((p) => p.id === pid);
const findSection = (projetos: Project[], pid: string, sid: string) =>
  findProject(projetos, pid)?.sections.find((s) => s.id === sid);
const findTask = (projetos: Project[], pid: string, sid: string, tid: string) =>
  findSection(projetos, pid, sid)?.tasks.find((t) => t.id === tid);

/** Tarefa recorrente concluída: volta p/ todo com próxima due (nunca vencida). */
const applyRepeat = (t: Task): Task =>
  t.repeat ? { ...t, status: "todo", due: nextDue(t.repeat, t.due, todayISO()), doneAt: null } : t;

export function reconcileSubs(subs: SubTask[]): SubTask[] {
  return subs.map((s) => {
    const own = reconcileSubs(s.subs);
    const status: Status = own.length > 0 ? (own.every((x) => x.status === "done") ? "done" : "todo") : s.status;
    return { ...s, subs: own, status };
  });
}

export function createBoardStore(initial: Project[] = []) {
  const undoStack: string[] = [];
  const MAX_UNDO = 50;
  return create<BoardStore>()(
    persist(
      (set, get) => {
        const commit = (fn: () => void) => {
          const prev = JSON.stringify(get().projetos);
          fn();
          if (JSON.stringify(get().projetos) !== prev) {
            undoStack.push(prev);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            set({ canUndo: true });
          }
        };
        return {
        projetos: initial,
        locale: "pt",
        setLocale: (locale) => set({ locale }),
        canUndo: false,

        undo: () => {
          const snap = undoStack.pop();
          if (snap === undefined) return;
          set({ projetos: JSON.parse(snap) as Project[] });
          set({ canUndo: undoStack.length > 0 });
        },

        addProject: (title) =>
          commit(() =>
            set((s) => ({
              projetos: [
                ...s.projetos,
                {
                  id: uid(),
                  title,
                  blocked: false,
                  archived: false,
                  prio: 3,
                  due: "",
                  collapsed: false,
                  sections: [{ id: uid(), title: "geral", tasks: [], notes: "", collapsed: false }],
                },
              ],
            })),
          ),

        renameProject: (id, title, blocked, due) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === id ? { ...p, title, blocked, ...(due !== undefined ? { due } : {}) } : p,
              ),
            })),
          ),

        deleteProject: (id) =>
          commit(() => set((s) => ({ projetos: s.projetos.filter((p) => p.id !== id) }))),

        toggleProjectArchive: (id) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p)),
            })),
          ),

        setProjectPrio: (id, prio) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) => (p.id === id ? { ...p, prio } : p)),
            })),
          ),

        toggleProjectCollapsed: (id) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) => (p.id === id ? { ...p, collapsed: !p.collapsed } : p)),
            })),
          ),

        addSection: (pid, title) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? { ...p, sections: [...p.sections, { id: uid(), title, tasks: [], notes: "", collapsed: false }] }
                  : p,
              ),
            })),
          ),

        renameSection: (pid, sid, title) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? { ...p, sections: p.sections.map((sec) => (sec.id === sid ? { ...sec, title } : sec)) }
                  : p,
              ),
            })),
          ),

        deleteSection: (pid, sid) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid ? { ...p, sections: p.sections.filter((sec) => sec.id !== sid) } : p,
              ),
            })),
          ),

        addTask: (pid, sid, text) => get().addTaskFull(pid, sid, { text, status: "todo" }),

        addTaskFull: (pid, sid, input) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? {
                              ...sec,
                              tasks: [
                                ...sec.tasks,
                                {
                                  id: uid(),
                                  text: input.text.trim(),
                                  status: input.status,
                                  note: input.note ?? "",
                                  blocked: input.blocked ?? false,
                                  prio: input.prio ?? 3,
                                  due: input.due ?? "",
                                  doneAt: input.status === "done" ? new Date().toISOString() : null,
                                  subs: input.subs ? reconcileSubs(input.subs) : [],
                                  repeat: input.repeat,
                                },
                              ],
                            }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        editTask: (pid, sid, tid, patch) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? {
                              ...sec,
                              tasks: sec.tasks.map((t) =>
                                t.id === tid
                                  ? (() => {
                                      const subs = patch.subs !== undefined ? reconcileSubs(patch.subs) : t.subs;
                                      const status: Status =
                                        patch.subs !== undefined && subs.length > 0
                                          ? subs.every((s) => s.status === "done")
                                            ? "done"
                                            : "todo"
                                          : t.status;
                                      return {
                                        ...t,
                                        text: patch.text ?? t.text,
                                        note: patch.note ?? t.note,
                                        blocked: patch.blocked ?? t.blocked,
                                        prio: patch.prio ?? t.prio,
                                        due: patch.due ?? t.due,
                                        subs,
                                        status,
                                        repeat: patch.repeat !== undefined ? (patch.repeat ?? undefined) : t.repeat,
                                        deletedAt: patch.deletedAt !== undefined ? patch.deletedAt : t.deletedAt,
                                      };
                                    })()
                                  : t,
                              ),
                            }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        deleteTask: (pid, sid, tid) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? { ...sec, tasks: sec.tasks.map((t) => (t.id === tid ? { ...t, deletedAt: new Date().toISOString() } : t)) }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        restoreTask: (pid, sid, tid) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? { ...sec, tasks: sec.tasks.map((t) => (t.id === tid ? { ...t, deletedAt: null } : t)) }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        purgeTask: (pid, sid, tid) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid ? { ...sec, tasks: sec.tasks.filter((t) => t.id !== tid) } : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        setTaskStatus: (pid, sid, tid, status) =>
          commit(() =>
            set((s) => {
              const t = findTask(s.projetos, pid, sid, tid);
              if (!t) return s;
              const wasDone = t.status === "done";
              const doneAt = status === "done" && !wasDone ? new Date().toISOString() : status !== "done" && wasDone ? null : t.doneAt;
              const repeated = status === "done" && !wasDone && t.repeat ? applyRepeat(t) : null;
              return {
                projetos: s.projetos.map((p) =>
                  p.id === pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) =>
                          sec.id === sid
                            ? { ...sec, tasks: sec.tasks.map((x) => (x.id === tid ? (repeated ?? { ...x, status, doneAt }) : x)) }
                            : sec,
                        ),
                      }
                    : p,
                ),
              };
            }),
          ),

        setTaskPrio: (pid, sid, tid, prio) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? { ...sec, tasks: sec.tasks.map((t) => (t.id === tid ? { ...t, prio } : t)) }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        cycleTaskPrio: (pid, sid, tid) =>
          commit(() =>
            set((s) => {
              const t = findTask(s.projetos, pid, sid, tid);
              if (!t) return s;
              const next = (t.prio % 3) + 1 as Prio;
              return {
                projetos: s.projetos.map((p) =>
                  p.id === pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) =>
                          sec.id === sid
                            ? { ...sec, tasks: sec.tasks.map((x) => (x.id === tid ? { ...x, prio: next } : x)) }
                            : sec,
                        ),
                      }
                    : p,
                ),
              };
            }),
          ),

        toggleTask: (pid, sid, tid) =>
          commit(() =>
            set((s) => {
              const t = findTask(s.projetos, pid, sid, tid);
              if (!t) return s;
              const status: Status = t.status === "done" ? "todo" : "done";
              const repeated = status === "done" && t.repeat ? applyRepeat(t) : null;
              const doneAt = status === "done" ? new Date().toISOString() : null;
              return {
                projetos: s.projetos.map((p) =>
                  p.id === pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) =>
                          sec.id === sid
                            ? { ...sec, tasks: sec.tasks.map((x) => (x.id === tid ? (repeated ?? { ...x, status, doneAt }) : x)) }
                            : sec,
                        ),
                      }
                    : p,
                ),
              };
            }),
          ),

        toggleSection: (pid, sid) =>
          set((s) => ({
            projetos: s.projetos.map((p) =>
              p.id === pid
                ? {
                    ...p,
                    sections: p.sections.map((sec) =>
                      sec.id === sid ? { ...sec, collapsed: !sec.collapsed } : sec,
                    ),
                  }
                : p,
            ),
          })),

        moveTask: (src, dest, index) =>
          commit(() =>
            set((s) => {
              const srcSec = findSection(s.projetos, src.pid, src.sid);
              const destSec = findSection(s.projetos, dest.pid, dest.sid);
              if (!srcSec || !destSec) return s;
              const task = srcSec.tasks.find((t) => t.id === src.tid);
              if (!task) return s;

              const next = s.projetos.map((p) => {
                const secs = p.sections.map((sec) => {
                  if (sec.id === src.sid) {
                    return { ...sec, tasks: sec.tasks.filter((t) => t.id !== src.tid) };
                  }
                  return sec;
                });
                return { ...p, sections: secs };
              });

              const destSecAfter = findSection(next, dest.pid, dest.sid)!;
              const insertAt = Math.max(0, Math.min(index, destSecAfter.tasks.length));
              const tasks = [...destSecAfter.tasks];
              tasks.splice(insertAt, 0, task);

              return {
                projetos: next.map((p) =>
                  p.id === dest.pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) => (sec.id === dest.sid ? { ...sec, tasks } : sec)),
                      }
                    : p,
                ),
              };
            }),
          ),

        reset: () => commit(() => set({ projetos: [] })),

        importState: (projetos) => commit(() => set({ projetos })),
      };
      },
      {
        name: "opsboard.v1",
        version: SCHEMA_VERSION,
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (s) => ({ projetos: s.projetos, locale: s.locale }),
        merge: (persistedState, currentState) => {
          const p = persistedState as { projetos?: Project[]; locale?: Locale } | undefined;
          return {
            ...currentState,
            projetos: purgeExpired(Array.isArray(p?.projetos) ? p.projetos : currentState.projetos),
            locale: p?.locale ?? currentState.locale,
          };
        },
        migrate: (persisted, version) => {
          if (version < SCHEMA_VERSION) {
            const legacy = migrateLegacy(persisted);
            if (legacy) return { projetos: legacy, locale: "pt" };
          }
          if (persisted && Array.isArray((persisted as { projetos?: unknown }).projetos)) {
            return { projetos: normalizeState(persisted), locale: "pt" };
          }
          return { projetos: [], locale: "pt" };
        },
      },
    ),
  );
}

export const useBoard = createBoardStore();