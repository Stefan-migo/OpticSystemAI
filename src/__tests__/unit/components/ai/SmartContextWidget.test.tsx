import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SmartContextWidget } from "@/components/ai/SmartContextWidget";

describe("SmartContextWidget", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  it("should render loading state", () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    expect(screen.getByText(/Cargando insights/i)).toBeInTheDocument();
  });

  it("should render insights correctly", async () => {
    const mockInsights = [
      {
        id: "1",
        organization_id: "org-1",
        section: "dashboard",
        type: "warning",
        title: "Test Warning",
        message: "Test message",
        priority: 8,
        is_dismissed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ insights: mockInsights }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Warning")).toBeInTheDocument();
    });
  });

  it("should not render when no insights", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ insights: [] }),
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // Widget should not render anything when no insights
      expect(container.firstChild).toBeNull();
    });
  });

  it("should handle errors gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      // Widget should not render on error
      expect(container.firstChild).toBeNull();
    });
  });

  it("should handle dismiss action", async () => {
    const mockInsights = [
      {
        id: "1",
        organization_id: "org-1",
        section: "dashboard",
        type: "warning",
        title: "Test",
        message: "Test",
        priority: 5,
        is_dismissed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ insights: mockInsights }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    // Click dismiss button
    const dismissButton = screen.getByRole("button", { name: /descartar/i });
    fireEvent.click(dismissButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/insights/1/dismiss"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("should handle feedback action", async () => {
    const mockInsights = [
      {
        id: "1",
        organization_id: "org-1",
        section: "dashboard",
        type: "warning",
        title: "Test",
        message: "Test",
        priority: 5,
        is_dismissed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ insights: mockInsights }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    render(
      <QueryClientProvider client={queryClient}>
        <SmartContextWidget section="dashboard" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test")).toBeInTheDocument();
    });

    // Click rate button, then click a star
    const rateButton = screen.getByText("Calificar");
    fireEvent.click(rateButton);

    const starButton = screen.getByLabelText("5 estrellas");
    fireEvent.click(starButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/ai/insights/1/feedback"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });
  });
});
