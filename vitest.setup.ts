import { vi } from "vitest";

// Prevent server-only from throwing in test environment
vi.mock("server-only", () => ({}));

// Stub next/headers — not available outside Next.js runtime
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockReturnValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));
