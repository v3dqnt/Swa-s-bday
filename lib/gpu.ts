import { init, type Gpu } from "vgpu";

// One WebGPU device for the whole page; every canvas draws through it.
let pending: Promise<Gpu> | null = null;

export function getGpu(): Promise<Gpu> {
  if (!("gpu" in navigator)) return Promise.reject(new Error("WebGPU unavailable"));
  pending ??= init().catch((e) => {
    pending = null;
    throw e;
  });
  return pending;
}
