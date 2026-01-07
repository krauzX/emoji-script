"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { EMOJI_SYNTAX } from "@/lib/constants";
import { apiClient, type Example } from "@/lib/api";
import { useEditorStore } from "@/lib/store";
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Sparkles,
  BookOpen,
  RefreshCw,
  Copy,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function SidebarSection({
  title,
  count,
  category,
  icon: Icon,
  expandedSections,
  toggleSection,
  children,
}: {
  title: string;
  count: number;
  category: string;
  icon?: React.ElementType;
  expandedSections: Set<string>;
  toggleSection: (s: string) => void;
  children: React.ReactNode;
}) {
  const isExpanded = expandedSections.has(category);
  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => toggleSection(category)}
        className="w-full justify-start gap-2 mb-2 h-9"
      >
        {Icon && <Icon className="w-4 h-4" />}
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <span className="font-semibold">{title}</span>
        <Badge variant="secondary" className="ml-auto">
          {count}
        </Badge>
      </Button>
      {isExpanded && <div className="space-y-1 pl-2">{children}</div>}
    </div>
  );
}

function EmojiItem({
  emoji,
  js,
  desc,
  onCopy,
}: {
  emoji: string;
  js: string;
  desc: string;
  onCopy: (e: string) => void;
}) {
  return (
    <Card
      className="p-3 cursor-pointer hover:bg-accent transition-colors group"
      onClick={() => onCopy(emoji)}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-semibold">{js}</p>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </Card>
  );
}

function ExampleItem({
  example,
  onLoad,
}: {
  example: Example;
  onLoad: (code: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(example.code);
    setCopied(true);
    toast.success("Code copied");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      className="p-3 cursor-pointer hover:bg-accent transition-colors"
      onClick={() => onLoad(example.code)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold">{example.title}</h4>
          <Badge variant="outline" className="text-xs">
            {example.category}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 w-6 p-0"
        >
          {copied ? (
            <CheckCircle className="w-3 h-3 text-green-500" />
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mb-2">
        {example.description}
      </p>
      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-24">
        <code>{example.code}</code>
      </pre>
    </Card>
  );
}

export default function Sidebar() {
  const { setCode, syntaxMode } = useEditorStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["io", "variables"])
  );
  const [examples, setExamples] = useState<Example[]>([]);
  const [loadingExamples, setLoadingExamples] = useState(false);

  useEffect(() => {
    const fetchExamples = async () => {
      setLoadingExamples(true);
      try {
        const data = await apiClient.getExamples(syntaxMode);
        setExamples(data);
      } catch (error) {
        console.error("Failed to fetch examples:", error);
      } finally {
        setLoadingExamples(false);
      }
    };
    fetchExamples();
  }, [syntaxMode]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      newSet.has(section) ? newSet.delete(section) : newSet.add(section);
      return newSet;
    });
  }, []);

  const handleCopyEmoji = useCallback((emoji: string) => {
    navigator.clipboard.writeText(emoji);
    toast.success("Emoji copied");
  }, []);

  const handleLoadExample = useCallback(
    (code: string) => {
      setCode(code);
      toast.success("Example loaded");
    },
    [setCode]
  );

  const refreshExamples = async () => {
    setLoadingExamples(true);
    try {
      const data = await apiClient.getExamples(syntaxMode);
      setExamples(data);
      toast.success("Refreshed");
    } catch (error) {
      toast.error("Failed to refresh");
    } finally {
      setLoadingExamples(false);
    }
  };

  const categorizedEmojis = useMemo(() => EMOJI_SYNTAX, []);
  const groupedExamples = useMemo(() => {
    const groups: Record<string, Example[]> = {};
    examples.forEach((ex) => {
      if (!groups[ex.category]) groups[ex.category] = [];
      groups[ex.category].push(ex);
    });
    return groups;
  }, [examples]);

  return (
    <aside className="hidden md:flex md:flex-col w-80 lg:w-96 border-r bg-card/50 backdrop-blur-sm">
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold">Reference Guide</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {syntaxMode === "emoji" ? "Emoji" : "Markup"} syntax • Click to use
        </p>
      </div>

      <Tabs defaultValue="syntax" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-4 mt-3 grid w-auto grid-cols-2">
          <TabsTrigger value="syntax" className="text-sm">
            Syntax
          </TabsTrigger>
          <TabsTrigger value="examples" className="text-sm">
            Examples
          </TabsTrigger>
        </TabsList>

        {/* Syntax Reference */}
        <TabsContent
          value="syntax"
          className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden"
        >
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {syntaxMode === "emoji" ? (
                <>
                  {Object.entries(categorizedEmojis).map(
                    ([category, items]) =>
                      items.length > 0 && (
                        <SidebarSection
                          key={category}
                          title={
                            category.charAt(0).toUpperCase() +
                            category.slice(1).replace("-", " ")
                          }
                          count={items.length}
                          category={category}
                          icon={
                            category === "io"
                              ? Code2
                              : category === "control-flow"
                              ? Sparkles
                              : BookOpen
                          }
                          expandedSections={expandedSections}
                          toggleSection={toggleSection}
                        >
                          {items.map((item, idx) => (
                            <EmojiItem
                              key={idx}
                              emoji={item.emoji}
                              js={item.js}
                              desc={item.desc}
                              onCopy={handleCopyEmoji}
                            />
                          ))}
                        </SidebarSection>
                      )
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Code2 className="w-4 h-4" />
                      Basic Tags
                    </h3>
                    <div className="space-y-1 text-sm font-mono">
                      <div>&lt;print&gt;...&lt;/print&gt;</div>
                      <div>&lt;var name="x"&gt;...&lt;/var&gt;</div>
                      <div>&lt;function name="f"&gt;...&lt;/function&gt;</div>
                      <div>&lt;if condition="..."&gt;...&lt;/if&gt;</div>
                      <div>&lt;loop count="10"&gt;...&lt;/loop&gt;</div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Advanced Tags
                    </h3>
                    <div className="space-y-1 text-sm font-mono">
                      <div>&lt;class name="C"&gt;...&lt;/class&gt;</div>
                      <div>&lt;extend class="C"&gt;...&lt;/extend&gt;</div>
                      <div>&lt;async&gt;...&lt;/async&gt;</div>
                      <div>&lt;try&gt;...&lt;catch&gt;...&lt;/try&gt;</div>
                      <div>&lt;import from="..."&gt;...&lt;/import&gt;</div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="examples"
          className="flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden"
        >
          <div className="px-4 py-3 flex justify-between items-center border-b bg-background/50">
            <span className="text-sm font-medium text-muted-foreground">
              {examples.length} {examples.length === 1 ? "Example" : "Examples"}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshExamples}
              disabled={loadingExamples}
              className="h-8 w-8 p-0"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingExamples ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {loadingExamples ? (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
                  <p>Loading...</p>
                </div>
              ) : examples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No examples</p>
                </div>
              ) : (
                Object.entries(groupedExamples).map(([category, exs]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold mb-2 capitalize flex items-center gap-2">
                      <Badge variant="outline">{category}</Badge>
                      <span className="text-muted-foreground">
                        ({exs.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {exs.map((example, idx) => (
                        <ExampleItem
                          key={idx}
                          example={example}
                          onLoad={handleLoadExample}
                        />
                      ))}
                    </div>
                    <Separator className="my-4" />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
