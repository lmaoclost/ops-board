import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { migrateLegacy, normalizeState, SCHEMA_VERSION } from "./migrate";
import type { Prio, Project, Section, Status, TaskPatch } from "./types";
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
  addProject: (title: string) => void;
  renameProject: (id: string, title: string, blocked: boolean) => void;
  deleteProject: (id: string) => void;
  toggleProjectArchive: (id: string) => void;
  addSection: (pid: string, title: string) => void;
  renameSection: (pid: string, sid: string, title: string) => void;
  deleteSection: (pid: string, sid: string) => void;
  addTask: (pid: string, sid: string, text: string) => void;
  editTask: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  deleteTask: (pid: string, sid: string, tid: string) => void;
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

const makeTask = (text: string): Section["tasks"][number] => ({
  id: uid(),
  text,
  status: "todo",
  note: "",
  blocked: false,
  prio: 3,
  due: "",
  doneAt: null,
});

export function createBoardStore(initial: Project[] = []) {
  return create<BoardStore>()(
    persist(
      (set) => ({
        projetos: initial,

        addProject: (title) =>
          set((s) => ({
            projetos: [
              ...s.projetos,
              {
                id: uid(),
                title,
                blocked: false,
                archived: false,
                sections: [{ id: uid(), title: "geral", tasks: [], notes: "", collapsed: false }],
              },
            ],
          })),

        renameProject: (id, title, blocked) =>
          set((s) => ({
            projetos: s.projetos.map((p) => (p.id === id ? { ...p, title, blocked } : p)),
          })),

        deleteProject: (id) => set((s) => ({ projetos: s.projetos.filter((p) => p.id !== id) })),

        toggleProjectArchive: (id) =>
          set((s) => ({
            projetos: s.projetos.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p)),
          })),

        addSection: (pid, title) =>
          set((s) => ({
            projetos: s.projetos.map((p) =>
              p.id === pid
                ? { ...p, sections: [...p.sections, { id: uid(), title, tasks: [], notes: "", collapsed: false }] }
                : p,
            ),
          })),

        renameSection: (pid, sid, title) =>
          set((s) => ({
            projetos: s.projetos.map((p) =>
              p.id === pid
                ? { ...p, sections: p.sections.map((sec) => (sec.id === sid ? { ...sec, title } : sec)) }
                : p,
            ),
          })),

        deleteSection: (pid, sid) =>
          set((s) => ({
            projetos: s.projetos.map((p) =>
              p.id === pid ? { ...p, sections: p.sections.filter((sec) => sec.id !== sid) } : p,
            ),
          })),

        addTask: (pid, sid, text) =>
          set((s) => ({
            projetos: s.projetos.map((p) =>
              p.id === pid
                ? {
                    ...p,
                    sections: p.sections.map((sec) =>
                      sec.id === sid ? { ...sec, tasks: [...sec.tasks, makeTask(text.trim())] } : sec,
                    ),
                  }
                : p,
            ),
          })),

        editTask: (pid, sid, tid, patch) =>
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
                                ? {
                                    ...t,
                                    text: patch.text ?? t.text,
                                    note: patch.note ?? t.note,
                                    blocked: patch.blocked ?? t.blocked,
                                    prio: patch.prio ?? t.prio,
                                    due: patch.due ?? t.due,
                                  }
                                : t,
                            ),
                          }
                        : sec,
                    ),
                  }
                : p,
            ),
          })),

        deleteTask: (pid, sid, tid) =>
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

        setTaskStatus: (pid, sid, tid, status) =>
          set((s) => {
            const t = findTask(s.projetos, pid, sid, tid);
            if (!t) return s;
            const wasDone = t.status === "done";
            const doneAt = status === "done" && !wasDone ? new Date().toISOString() : status !== "done" && wasDone ? null : t.doneAt;
            return {
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? { ...sec, tasks: sec.tasks.map((x) => (x.id === tid ? { ...x, status, doneAt } : x)) }
                          : sec,
                      ),
                    }
                  : p,
              ),
            };
          }),

        setTaskPrio: (pid, sid, tid, prio) =>
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

        cycleTaskPrio: (pid, sid, tid) =>
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

        toggleTask: (pid, sid, tid) =>
          set((s) => {
            const t = findTask(s.projetos, pid, sid, tid);
            if (!t) return s;
            const status: Status = t.status === "done" ? "todo" : "done";
            const doneAt = status === "done" ? new Date().toISOString() : null;
            return {
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? {
                      ...p,
                      sections: p.sections.map((sec) =>
                        sec.id === sid
                          ? { ...sec, tasks: sec.tasks.map((x) => (x.id === tid ? { ...x, status, doneAt } : x)) }
                          : sec,
                      ),
                    }
                  : p,
              ),
            };
          }),

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

        reset: () => set({ projetos: [] }),

        importState: (projetos) => set({ projetos }),
      }),
      {
        name: "opsboard.v1",
        version: SCHEMA_VERSION,
        storage: createJSONStorage(() => safeLocalStorage),
        migrate: (persisted, version) => {
          if (version < SCHEMA_VERSION) {
            const legacy = migrateLegacy(persisted);
            if (legacy) return legacy;
          }
          if (persisted && Array.isArray((persisted as { projetos?: unknown }).projetos)) {
            return normalizeState(persisted);
          }
          return { projetos: [] };
        },
      },
    ),
  );
}

export const useBoard = createBoardStore();