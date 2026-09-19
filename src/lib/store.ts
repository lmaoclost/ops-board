import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { migrateLegacy, normalizeState, purgeExpired, SCHEMA_VERSION } from "./migrate";
import type { Locale } from "./i18n";
import { nextDue } from "./repeat";
import { cyclePrio } from "./tokens";
import { findSubTree, insertTaskAt, isDescendant, MAX_SUB_DEPTH, removeSubTask, subLevel, subTreeHeight } from "./subtasks";
import { todayISO } from "./date";
import type { AddProjectInput, AddSectionInput, AddTaskInput, Prio, Project, ProjectPatch, SectionPatch, Status, SubTask, Task, TaskPatch } from "./types";
import { uid } from "./uid";

// Contrato do store:
// - único estado global do app (zustand); persiste em localStorage["opsboard.v1"]
//   via `persist`, com `partialize` controlando o que sai (projetos + locale).
// - TODA mutação de projetos passa por `commit()`: ele salva um snapshot JSON
//   pré-mutação na pilha de undo (máx 50) — Ctrl+Z desfaz 1 commit inteiro.
// - `merge` do persist roda em TODA reidratação (não só em mudança de schema):
//   é ali que purgeExpired() apaga tarefas com deletedAt >= 7d.
// - Erros de quota de storage são notificados via setStorageErrorHandler
//   (page.tsx registra um handler que mostra toast).
// - Migrar schema: subir SCHEMA_VERSION em migrate.ts + atualizar e2e export-import.spec.

let storageErrorHandler: (() => void) | null = null;

export function setStorageErrorHandler(fn: (() => void) | null) {
  storageErrorHandler = fn;
}

const safeLocalStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      storageErrorHandler?.();
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // armazenamento indisponível: nada a remover
    }
  },
};

interface BoardStore {
  projetos: Project[];
  locale: Locale;
  setLocale: (locale: Locale) => void;
  canUndo: boolean;
  undo: () => void;
  addProject: (input: AddProjectInput) => void;
  editProject: (id: string, patch: ProjectPatch) => void;
  deleteProject: (id: string) => void;
  toggleProjectArchive: (id: string) => void;
  setProjectPrio: (id: string, prio: Prio) => void;
  toggleProjectCollapsed: (id: string) => void;
  addSection: (pid: string, input: AddSectionInput) => void;
  editSection: (pid: string, sid: string, patch: SectionPatch) => void;
  moveSection: (pid: string, sid: string, index: number) => void;
  moveProject: (pid: string, overPid: string) => void;
  deleteSection: (pid: string, sid: string) => void;
  addTask: (pid: string, sid: string, text: string) => void;
  addTaskFull: (pid: string, sid: string, input: AddTaskInput) => void;
  editTask: (pid: string, sid: string, tid: string, patch: TaskPatch) => void;
  deleteTask: (pid: string, sid: string, tid: string) => void;
  restoreTask: (pid: string, sid: string, tid: string) => void;
  purgeTask: (pid: string, sid: string, tid: string) => void;
  setTaskStatus: (pid: string, sid: string, tid: string, status: Status) => void;
  cycleTaskPrio: (pid: string, sid: string, tid: string) => void;
  toggleTask: (pid: string, sid: string, tid: string) => void;
  toggleSection: (pid: string, sid: string) => void;
  moveTask: (
    src: { pid: string; sid: string; tid: string },
    dest: { pid: string; sid: string; parentId?: string | null },
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

        addProject: ({ title, note, due }) =>
          commit(() =>
            set((s) => ({
              projetos: [
                ...s.projetos,
                {
                  id: uid(),
                  title,
                  note: note ?? "",
                  blocked: false,
                  blockedReason: "",
                  archived: false,
                  prio: 5,
                  due: due ?? "",
                  collapsed: false,
                  sections: [{ id: uid(), title: "geral", tasks: [], notes: "", collapsed: false }],
                },
              ],
            })),
          ),

        editProject: (id, patch) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      title: patch.title,
                      blocked: patch.blocked,
                      ...(patch.due !== undefined ? { due: patch.due } : {}),
                      ...(patch.note !== undefined ? { note: patch.note } : {}),
                      ...(patch.blockedReason !== undefined ? { blockedReason: patch.blockedReason } : {}),
                    }
                  : p,
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

        addSection: (pid, { title, notes }) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) =>
                p.id === pid
                  ? { ...p, sections: [...p.sections, { id: uid(), title, tasks: [], notes: notes ?? "", collapsed: false }] }
                  : p,
              ),
            })),
          ),

        editSection: (pid, sid, patch) =>
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
                              ...(patch.title !== undefined ? { title: patch.title } : {}),
                              ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
                            }
                          : sec,
                      ),
                    }
                  : p,
              ),
            })),
          ),

        moveSection: (pid, sid, index) =>
          commit(() =>
            set((s) => ({
              projetos: s.projetos.map((p) => {
                if (p.id !== pid) return p;
                const from = p.sections.findIndex((sec) => sec.id === sid);
                if (from === -1) return p;
                const next = [...p.sections];
                const [moved] = next.splice(from, 1);
                next.splice(Math.max(0, Math.min(index, next.length)), 0, moved);
                return { ...p, sections: next };
              }),
            })),
          ),

        moveProject: (pid, overPid) =>
          commit(() =>
            set((s) => {
              const from = s.projetos.findIndex((p) => p.id === pid);
              const index = s.projetos.findIndex((p) => p.id === overPid);
              if (from === -1 || index === -1) return s;
              const next = [...s.projetos];
              const [moved] = next.splice(from, 1);
              next.splice(index, 0, moved);
              return { projetos: next };
            }),
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
                                  blockedReason: input.blockedReason ?? "",
                                  prio: input.prio ?? 5,
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
            set((s) => {
              const sec = findSection(s.projetos, pid, sid);
              const current = sec ? findSubTree(sec.tasks, tid) : null;
              // Guard de profundidade: patch com subs não pode aprofundar além do cap —
              // nem além da altura já existente (edit de legado nível 3+ continua válido).
              if (sec && current && patch.subs !== undefined && subTreeHeight(patch.subs) > Math.max(MAX_SUB_DEPTH, subTreeHeight(current.subs))) {
                return s;
              }
              return {
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
                                          blockedReason: patch.blockedReason ?? t.blockedReason,
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
              };
            }),
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

        cycleTaskPrio: (pid, sid, tid) =>
          commit(() =>
            set((s) => {
              const t = findTask(s.projetos, pid, sid, tid);
              if (!t) return s;
              const next = cyclePrio(t.prio);
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
          commit(() => {
            const taskSubDepth = (t: Task | SubTask): number => (t.subs.length === 0 ? 0 : 1 + Math.max(...t.subs.map(taskSubDepth)));
            return set((s): BoardStore => {
              const srcSec = findSection(s.projetos, src.pid, src.sid);
              const destSec = findSection(s.projetos, dest.pid, dest.sid);
              if (!srcSec || !destSec) return s;

              const inRoot = srcSec.tasks.some((t) => t.id === src.tid);
              let task: Task | null;
              if (inRoot) {
                task = srcSec.tasks.find((t) => t.id === src.tid) ?? null;
              } else {
                const found = findSubTree(srcSec.tasks, src.tid);
                if (!found) return s;
                task = { ...found, doneAt: found.status === "done" ? new Date().toISOString() : null };
              }
              if (!task) return s;

              if (dest.parentId != null) {
                if (dest.parentId === src.tid) return s;
                if (isDescendant(task.subs, src.tid, dest.parentId)) return s;
                // parentLevel = nível do pai como sub da task raiz (1 = sub, 2 = subsub).
                // A task movida ocuparia parentLevel + 1; profundidade final = isso + altura da sub-árvore movida.
                const parentTask = destSec.tasks.find((t) => findSubTree(t.subs, dest.parentId!));
                const parentLevel = parentTask ? subLevel(parentTask.subs, dest.parentId) : null;
                if (parentLevel !== null && parentLevel + 1 + taskSubDepth(task) > MAX_SUB_DEPTH) return s;
              }

              const next: Project[] = s.projetos.map((p) => {
                const secs = p.sections.map((sec) =>
                  sec.id === src.sid
                    ? { ...sec, tasks: inRoot ? sec.tasks.filter((t) => t.id !== src.tid) : removeSubTask(sec.tasks, src.tid) }
                    : sec,
                );
                return { ...p, sections: secs };
              });

              if (dest.parentId) {
                const destProj = next.find((p) => p.id === dest.pid);
                const destSection = destProj?.sections.find((sec) => sec.id === dest.sid);
                if (!destSection || !findSubTree(destSection.tasks, dest.parentId)) return s;
                const patched = { ...task, subs: reconcileSubs(task.subs) };
                const projetos = next.map((p) =>
                  p.id === dest.pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) => {
                          if (sec.id !== dest.sid) return sec;
                          const after = insertTaskAt(sec.tasks, dest.parentId!, patched, index);
                          return {
                            ...sec,
                            tasks: after.map((tk) =>
                              tk.id === dest.parentId ? { ...tk, subs: reconcileSubs(tk.subs) } : tk,
                            ),
                          };
                        }),
                      }
                    : p,
                );
                return { ...s, projetos };
              }

              const destSecAfter = findSection(next, dest.pid, dest.sid)!;
              const insertAt = Math.max(0, Math.min(index, destSecAfter.tasks.length));
              const tasks = [...destSecAfter.tasks];
              tasks.splice(insertAt, 0, task);

              return {
                ...s,
                projetos: next.map((p) =>
                  p.id === dest.pid
                    ? {
                        ...p,
                        sections: p.sections.map((sec) => (sec.id === dest.sid ? { ...sec, tasks } : sec)),
                      }
                    : p,
                ),
              };
            });
          }),

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