"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  EditorSkeleton,
  OutputSkeleton,
  SidebarSkeleton,
} from "@/components/loading-skeleton";
import { useThemeStore } from "@/lib/store";

const Toolbar = dynamic(() => import("@/components/toolbar"), {
  ssr: false,
});

const CodeEditor = dynamic(() => import("@/components/code-editor"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

const OutputPanel = dynamic(() => import("@/components/output-panel"), {
  ssr: false,
  loading: () => <OutputSkeleton />,
});

const Sidebar = dynamic(() => import("@/components/sidebar"), {
  ssr: false,
  loading: () => <SidebarSkeleton />,
});

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Load code from URL if present
    const params = new URLSearchParams(window.location.search);
    const sharedCode = params.get("code");
    if (sharedCode) {
      try {
        const decoded = atob(sharedCode);
        // Code will be loaded by the editor component
      } catch (error) {
        console.error("Failed to decode shared code:", error);
      }
    }
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ErrorBoundary>
      <main className="h-screen flex flex-col bg-background">
        <Suspense fallback={<div className="h-14 border-b" />}>
          <Toolbar />
        </Suspense>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - collapsible on mobile */}
          <Suspense fallback={<SidebarSkeleton />}>
            <Sidebar />
          </Suspense>

          {/* Main editor and output panel */}
          <div className="flex-1 flex flex-col lg:flex-row gap-0 overflow-hidden">
            <Suspense fallback={<EditorSkeleton />}>
              <CodeEditor />
            </Suspense>

            <Suspense fallback={<OutputSkeleton />}>
              <OutputPanel />
            </Suspense>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
}
