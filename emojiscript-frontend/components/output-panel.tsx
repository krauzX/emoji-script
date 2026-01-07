"use client";

import Editor from "@monaco-editor/react";
import { useEditorStore, useSettingsStore, useThemeStore } from "@/lib/store";
import { Copy, Check, Terminal, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LANGUAGE_MAP = {
  javascript: { monaco: "javascript", label: "JavaScript", icon: "🟨" },
} as const;

export default function OutputPanel() {
  const { output, error, targetLanguage } = useEditorStore();
  const { fontSize } = useSettingsStore();
  const { theme } = useThemeStore();
  const [copied, setCopied] = useState(false);

  const currentLanguage = LANGUAGE_MAP[targetLanguage];

  const handleCopy = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-500" />
          <span className="text-sm font-semibold">Output</span>
          {output && (
            <Badge variant="secondary" className="text-xs h-5">
              {currentLanguage.label}
            </Badge>
          )}
        </div>
        {output && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 gap-2"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span className="hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="hidden sm:inline">Copy</span>
              </>
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-background">
        {error ? (
          <div className="p-4">
            <Card className="p-4 border-destructive bg-destructive/10">
              <div className="flex items-start gap-3">
                <div className="text-destructive">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-destructive mb-1">
                    Transpilation Error
                  </h3>
                  <pre className="text-xs text-destructive/90 whitespace-pre-wrap font-mono">
                    {error}
                  </pre>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage={currentLanguage.monaco}
            language={currentLanguage.monaco}
            value={
              output ||
              `// Your transpiled ${currentLanguage.label} will appear here`
            }
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              readOnly: true,
              minimap: { enabled: true, showSlider: "mouseover" },
              fontSize,
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              folding: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
}
