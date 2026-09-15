/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// (desligados aqui: o arquivo inteiro é uma declaração de fusão de tipos —
//  não há membros próprios a declarar nem como evitar `any` nos genéricos.)
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// jest-dom 7 augments vitest's one-param `Assertion<T>` (vitest ≤4). Vitest 5
// widened it to `Assertion<R, T>`, orphaning that augmentation and breaking
// matcher types (toBeInTheDocument, toHaveAttribute, …). Re-apply the
// matchers onto the real two-param interface. Drop this file when jest-dom
// ships vitest-5-compatible types.
declare module "vitest" {
  interface Assertion<R extends void | Promise<void> = void, T = unknown>
    extends TestingLibraryMatchers<any, T> {}
}
