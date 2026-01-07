"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEditorStore, useSettingsStore, useThemeStore } from "@/lib/store";
import { apiClient } from "@/lib/api";
import { SuggestionEngine } from "@/lib/suggestions";
import * as monaco from "monaco-editor";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2 } from "lucide-react";

export default function CodeEditor() {
  const {
    code,
    setCode,
    setOutput,
    setIsTranspiling,
    setError,
    targetLanguage,
    syntaxMode,
  } = useEditorStore();
  const { fontSize, autoTranspile, showSuggestions } = useSettingsStore();
  const { theme } = useThemeStore();
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const suggestionEngineRef = useRef<SuggestionEngine | null>(null);

  useEffect(() => {
    if (!suggestionEngineRef.current) {
      suggestionEngineRef.current = new SuggestionEngine();
    }
  }, []);

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;

    editor.updateOptions({
      minimap: { enabled: true },
      fontSize,
      lineNumbers: "on",
      roundedSelection: false,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      suggestOnTriggerCharacters: showSuggestions,
      quickSuggestions: showSuggestions,
    });

    if (showSuggestions && suggestionEngineRef.current) {
      const provider = monacoInstance.languages.registerCompletionItemProvider(
        "plaintext",
        {
          provideCompletionItems: (model, position) => {
            const textUntilPosition = model.getValueInRange({
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            });
            const cursorOffset = model.getOffsetAt(position);
            const suggestions =
              syntaxMode === "markup"
                ? suggestionEngineRef.current!.getSuggestionsForMarkup(
                    textUntilPosition,
                    cursorOffset,
                    syntaxMode
                  )
                : suggestionEngineRef.current!.getSuggestionsForEmoji(
                    textUntilPosition,
                    cursorOffset
                  );

            return {
              suggestions: suggestions.map((sug) => ({
                label: sug.label,
                kind: monacoInstance.languages.CompletionItemKind.Snippet,
                detail: sug.detail,
                documentation: sug.documentation,
                insertText: sug.insertText,
                insertTextRules:
                  monacoInstance.languages.CompletionItemInsertTextRule
                    .InsertAsSnippet,
                range: {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - (sug.label.length - 1),
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                },
              })),
            };
          },
        }
      );
      return () => provider.dispose();
    }
  };

  const transpileCode = async (codeToTranspile: string) => {
    if (!codeToTranspile.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    const hasMarkupTags = /<[a-z]+[^>]*>/i.test(codeToTranspile);
    const hasEmojis =
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
        codeToTranspile
      );

    if (syntaxMode === "markup" && hasEmojis && !hasMarkupTags) {
      setError(
        "Emoji syntax detected. Switch to Emoji mode to use emoji-based programming."
      );
      setOutput("");
      setIsTranspiling(false);
      return;
    }

    if (syntaxMode === "emoji" && hasMarkupTags && !hasEmojis) {
      setError(
        "Markup syntax detected. Switch to Markup mode to use tag-based programming."
      );
      setOutput("");
      setIsTranspiling(false);
      return;
    }

    setIsTranspiling(true);
    setError(null);

    try {
      const result = await apiClient.transpile(
        codeToTranspile,
        targetLanguage,
        syntaxMode === "markup"
      );
      if (result.success) {
        setOutput(result.javascript || result.output || "");
      } else {
        setError(result.errors?.join("\n") || "Transpilation failed");
      }
    } catch (error: any) {
      setError(error.message || "Failed to transpile");
    } finally {
      setIsTranspiling(false);
    }
  };

  const handleChange = (value: string | undefined) => {
    const newCode = value || "";
    setCode(newCode);

    if (autoTranspile) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => transpileCode(newCode), 500);
    }
  };

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    []
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-r">
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Input</span>
          <Badge variant="secondary" className="text-xs h-5">
            {syntaxMode === "emoji" ? "🙂 Emoji" : "📝 Markup"}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">
          {code.split("\n").length} lines
        </span>
      </div>
      <div className="flex-1 overflow-hidden bg-background">
        <Editor
          height="100%"
          defaultLanguage="xml"
          value={code}
          onChange={handleChange}
          onMount={handleEditorDidMount}
          theme={theme === "dark" ? "vs-dark" : "vs-light"}
          options={{
            minimap: { enabled: true, showSlider: "mouseover" },
            fontSize,
            lineNumbers: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            wordWrap: "on",
            wrappingIndent: "indent",
            renderValidationDecorations: "off",
            folding: true,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>
    </div>
  );
}
