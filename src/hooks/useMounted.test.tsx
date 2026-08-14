import { renderHook } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useMounted } from "./useMounted";

function Probe() {
  const mounted = useMounted();
  return <span data-mounted={String(mounted)} />;
}

describe("useMounted", () => {
  it("retorna false no render do servidor", () => {
    expect(renderToStaticMarkup(<Probe />)).toContain('data-mounted="false"');
  });

  it("é true imediatamente no cliente", () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current).toBe(true);
  });
});