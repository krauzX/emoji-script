"use client";

import { Play, Code2, Settings2, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEditorStore, useSettingsStore } from "@/lib/store";
import { ConnectionStatus } from "@/components/connection-status";
import { toast } from "sonner";
import { apiClient, type TargetLanguage, type SyntaxMode } from "@/lib/api";

const SUPPORTED_LANGUAGES = [
  { value: "javascript" as const, label: "JavaScript", icon: "🟨" },
];

export default function Toolbar() {
  const {
    code,
    targetLanguage,
    syntaxMode,
    setTargetLanguage,
    setSyntaxMode,
    setOutput,
    setError,
    setIsTranspiling,
    setUsedMarkup,
  } = useEditorStore();
  const {
    autoTranspile,
    showSuggestions,
    setAutoTranspile,
    setShowSuggestions,
  } = useSettingsStore();

  const handleTranspile = async () => {
    if (!code.trim()) {
      toast.error("Please enter some code first");
      return;
    }

    setIsTranspiling(true);
    setError(null);

    try {
      const useMarkup = syntaxMode === "markup";
      const result = await apiClient.transpile(code, targetLanguage, useMarkup);

      if (result.success && result.output) {
        setOutput(result.output);
        setUsedMarkup(result.usedMarkup || false);
        toast.success(
          `Transpiled to ${targetLanguage} using ${
            result.usedMarkup ? "markup" : "emoji"
          } syntax`
        );
      } else {
        const errorMsg = result.errors?.join("\n") || "Transpilation failed";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = error.message || "Failed to transpile code";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsTranspiling(false);
    }
  };

  const handleExport = () => {
    const extension = syntaxMode === "markup" ? "xml" : "ejs";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emojiscript-code.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code exported");
  };

  const handleSyntaxModeChange = (mode: string) => {
    setSyntaxMode(mode as SyntaxMode);
    toast.info(`Switched to ${mode} syntax mode`);
  };

  return (
    <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold">EmojiScript</h1>
          <Badge
            variant="outline"
            className="text-xs h-5 hidden sm:inline-flex"
          >
            Playground
          </Badge>
        </div>
        <Separator orientation="vertical" className="h-6 hidden lg:block" />
        <ConnectionStatus />
      </div>

      <div className="flex items-center gap-2">
        <Tabs value={syntaxMode} onValueChange={handleSyntaxModeChange}>
          <TabsList className="h-9">
            <TabsTrigger value="emoji" className="text-xs px-3">
              <span className="hidden sm:inline">Emoji</span>
              <span className="sm:hidden">😀</span>
            </TabsTrigger>
            <TabsTrigger value="markup" className="text-xs px-3">
              <span className="hidden sm:inline">Markup</span>
              <span className="sm:hidden">{"<>"}</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator orientation="vertical" className="h-6 hidden sm:block" />

        <Select value={targetLanguage} onValueChange={setTargetLanguage}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                <span className="flex items-center gap-2">
                  <span>{lang.icon}</span>
                  <span>{lang.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleTranspile}
          className="gap-2 h-9 glow-primary hover:glow-primary"
        >
          <Play className="w-4 h-4" />
          Transpile
        </Button>

        <Separator orientation="vertical" className="h-6" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-9"
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Settings2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="gradient-text">
                Editor Settings
              </DialogTitle>
              <DialogDescription>
                Customize your EmojiScript coding experience
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-transpile">Auto Transpile</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically transpile code as you type
                  </p>
                </div>
                <Switch
                  id="auto-transpile"
                  checked={autoTranspile}
                  onCheckedChange={setAutoTranspile}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-suggestions">AI Suggestions</Label>
                  <p className="text-xs text-muted-foreground">
                    Show intelligent code suggestions while typing
                  </p>
                </div>
                <Switch
                  id="show-suggestions"
                  checked={showSuggestions}
                  onCheckedChange={setShowSuggestions}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
