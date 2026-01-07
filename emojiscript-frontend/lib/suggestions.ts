export type SuggestionCategory =
  | "control-flow"
  | "data-structure"
  | "function"
  | "variable"
  | "io"
  | "loop"
  | "conditional"
  | "class"
  | "operator"
  | "async";

export interface Suggestion {
  label: string;
  detail: string;
  documentation: string;
  insertText: string;
  category: SuggestionCategory;
  confidence: number;
  example?: string;
}

export interface MarkupTagInfo {
  tag: string;
  description: string;
  attributes: Array<{
    name: string;
    required: boolean;
    type: string;
    description: string;
  }>;
  example: string;
  category: SuggestionCategory;
}

// Comprehensive markup tag definitions
export const MARKUP_TAGS: MarkupTagInfo[] = [
  {
    tag: "print",
    description: "Output to console/terminal",
    attributes: [],
    example: '<print>"Hello, World!"</print>',
    category: "io",
  },
  {
    tag: "log",
    description: "Log message (alias for print)",
    attributes: [],
    example: '<log>"Debug message"</log>',
    category: "io",
  },
  {
    tag: "var",
    description: "Declare a mutable variable",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Variable name",
      },
      {
        name: "value",
        required: true,
        type: "any",
        description: "Initial value",
      },
      {
        name: "type",
        required: false,
        type: "string",
        description: "Type annotation (TS only)",
      },
    ],
    example: '<var name="count" value="0"/>',
    category: "variable",
  },
  {
    tag: "let",
    description: "Declare a block-scoped variable",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Variable name",
      },
      {
        name: "value",
        required: true,
        type: "any",
        description: "Initial value",
      },
      {
        name: "type",
        required: false,
        type: "string",
        description: "Type annotation (TS only)",
      },
    ],
    example: '<let name="username" value="\'Alice\'"/>',
    category: "variable",
  },
  {
    tag: "const",
    description: "Declare a constant",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Constant name",
      },
      { name: "value", required: true, type: "any", description: "Value" },
      {
        name: "type",
        required: false,
        type: "string",
        description: "Type annotation (TS only)",
      },
    ],
    example: '<const name="PI" value="3.14159"/>',
    category: "variable",
  },
  {
    tag: "function",
    description: "Define a function",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Function name",
      },
      {
        name: "params",
        required: false,
        type: "string",
        description: "Parameter list",
      },
      {
        name: "returns",
        required: false,
        type: "string",
        description: "Return type (TS only)",
      },
      {
        name: "async",
        required: false,
        type: "boolean",
        description: "Async function",
      },
    ],
    example:
      '<function name="greet" params="name">\n  <return>"Hello, " + name</return>\n</function>',
    category: "function",
  },
  {
    tag: "loop",
    description: "Iterate with various loop types",
    attributes: [
      {
        name: "var",
        required: false,
        type: "string",
        description: "Loop variable name",
      },
      {
        name: "from",
        required: false,
        type: "number",
        description: "Start value (range loop)",
      },
      {
        name: "to",
        required: false,
        type: "number",
        description: "End value (range loop)",
      },
      {
        name: "step",
        required: false,
        type: "number",
        description: "Step increment",
      },
      {
        name: "in",
        required: false,
        type: "string",
        description: "Iterable (for-of loop)",
      },
      {
        name: "times",
        required: false,
        type: "number",
        description: "Repeat n times",
      },
    ],
    example: '<loop var="i" from="0" to="10">\n  <print>i</print>\n</loop>',
    category: "loop",
  },
  {
    tag: "while",
    description: "While loop with condition",
    attributes: [
      {
        name: "condition",
        required: true,
        type: "boolean",
        description: "Loop condition",
      },
    ],
    example:
      '<while condition="x < 100">\n  <print>x</print>\n  x = x + 1\n</while>',
    category: "loop",
  },
  {
    tag: "if",
    description: "Conditional statement",
    attributes: [
      {
        name: "condition",
        required: true,
        type: "boolean",
        description: "Condition to test",
      },
    ],
    example: '<if condition="age >= 18">\n  <print>"Adult"</print>\n</if>',
    category: "conditional",
  },
  {
    tag: "else",
    description: "Else block (follows if)",
    attributes: [],
    example: '<else>\n  <print>"Minor"</print>\n</else>',
    category: "conditional",
  },
  {
    tag: "extend",
    description: "Define a class (with optional inheritance)",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Class name",
      },
      {
        name: "extends",
        required: false,
        type: "string",
        description: "Parent class",
      },
    ],
    example:
      '<extend name="Person">\n  <method name="greet" params="">\n    <return>"Hello!"</return>\n  </method>\n</extend>',
    category: "class",
  },
  {
    tag: "class",
    description: "Define a class (alias for extend)",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Class name",
      },
      {
        name: "extends",
        required: false,
        type: "string",
        description: "Parent class",
      },
    ],
    example: '<class name="Animal">\n  ...\n</class>',
    category: "class",
  },
  {
    tag: "method",
    description: "Define a class method",
    attributes: [
      {
        name: "name",
        required: true,
        type: "string",
        description: "Method name",
      },
      {
        name: "params",
        required: false,
        type: "string",
        description: "Parameter list",
      },
      {
        name: "returns",
        required: false,
        type: "string",
        description: "Return type (TS only)",
      },
      {
        name: "static",
        required: false,
        type: "boolean",
        description: "Static method",
      },
    ],
    example:
      '<method name="constructor" params="name">\n  this.name = name\n</method>',
    category: "function",
  },
  {
    tag: "import",
    description: "Import modules or libraries",
    attributes: [
      {
        name: "from",
        required: true,
        type: "string",
        description: "Module path",
      },
      {
        name: "items",
        required: false,
        type: "string",
        description: "Named imports",
      },
    ],
    example: '<import from="react" items="useState, useEffect"/>',
    category: "io",
  },
  {
    tag: "export",
    description: "Export values or components",
    attributes: [
      {
        name: "name",
        required: false,
        type: "string",
        description: "Export name",
      },
      {
        name: "default",
        required: false,
        type: "boolean",
        description: "Default export",
      },
    ],
    example: '<export name="MyComponent" default="true">\n  ...\n</export>',
    category: "io",
  },
  {
    tag: "return",
    description: "Return value from function",
    attributes: [
      {
        name: "value",
        required: false,
        type: "any",
        description: "Value to return",
      },
    ],
    example: "<return>result</return>",
    category: "control-flow",
  },
  {
    tag: "array",
    description: "Create an array",
    attributes: [
      {
        name: "items",
        required: false,
        type: "string",
        description: "Array elements",
      },
    ],
    example: '<array items="1, 2, 3, 4, 5"/>',
    category: "data-structure",
  },
  {
    tag: "object",
    description: "Create an object",
    attributes: [],
    example: '<object>name: "Alice", age: 25</object>',
    category: "data-structure",
  },
  {
    tag: "try",
    description: "Try block for error handling",
    attributes: [],
    example: "<try>\n  riskyOperation()\n</try>",
    category: "control-flow",
  },
  {
    tag: "catch",
    description: "Catch block (follows try)",
    attributes: [
      {
        name: "error",
        required: false,
        type: "string",
        description: "Error variable name",
      },
    ],
    example: '<catch error="e">\n  <print>e.message</print>\n</catch>',
    category: "control-flow",
  },
  {
    tag: "async",
    description: "Async function or block",
    attributes: [],
    example: "<async>\n  <await>fetchData()</await>\n</async>",
    category: "async",
  },
  {
    tag: "await",
    description: "Await async operation",
    attributes: [],
    example: "<await>promise</await>",
    category: "async",
  },
  {
    tag: "switch",
    description: "Switch statement",
    attributes: [
      {
        name: "on",
        required: true,
        type: "any",
        description: "Expression to match",
      },
    ],
    example:
      '<switch on="dayOfWeek">\n  <case value="1">Monday</case>\n</switch>',
    category: "conditional",
  },
  {
    tag: "case",
    description: "Case in switch (or match pattern)",
    attributes: [
      {
        name: "value",
        required: true,
        type: "any",
        description: "Value to match",
      },
    ],
    example:
      '<case value="\'Monday\'">\n  <print>"Start of week"</print>\n</case>',
    category: "conditional",
  },
  {
    tag: "break",
    description: "Break out of loop or switch",
    attributes: [],
    example: "<break/>",
    category: "control-flow",
  },
  {
    tag: "continue",
    description: "Continue to next iteration",
    attributes: [],
    example: "<continue/>",
    category: "control-flow",
  },
  {
    tag: "comment",
    description: "Add a comment",
    attributes: [],
    example: "<comment>This is a helpful comment</comment>",
    category: "io",
  },
];

// Emoji reference for suggestions
export const EMOJI_REFERENCE = {
  variables: {
    "💾": "var/let - mutable variable",
    "🔒": "const - immutable constant",
    "📦": "package/bundle",
  },
  functions: {
    "⚡": "function/async",
    "🎯": "function definition",
    "🔙": "return statement",
  },
  loops: {
    "🔁": "for loop",
    "🔄": "while loop",
    "⏭️": "continue",
    "🏁": "break",
  },
  conditionals: {
    "❓": "if statement",
    "❌": "else statement",
    "✅": "true",
    "⛔": "false",
  },
  operators: {
    "➕": "addition/concatenation",
    "➖": "subtraction",
    "✖️": "multiplication",
    "➗": "division",
    "🟰": "equals (===)",
    "❗": "not equals (!==)",
    "⬆️": "greater than",
    "⬇️": "less than",
    "📈": "greater or equal",
    "📉": "less or equal",
  },
  io: {
    "📝": "console.log/print",
    "📺": "console.log/display",
    "📥": "import/input",
    "📤": "export/output",
  },
  dataStructures: {
    "📊": "array",
    "🎁": "object/new",
    "🔑": "key (object property)",
  },
};

/**
 * AI-powered context-aware suggestion engine
 */
export class SuggestionEngine {
  /**
   * Get suggestions based on current context and cursor position
   */
  getSuggestionsForMarkup(
    code: string,
    cursorPosition: number,
    syntaxMode: "emoji" | "markup" = "markup"
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];

    // Get text before cursor
    const textBeforeCursor = code.substring(0, cursorPosition);
    const lastLine = textBeforeCursor.split("\n").pop() || "";

    // Check if user is typing a tag
    const tagMatch = lastLine.match(/<([a-z]*)$/i);

    if (tagMatch) {
      const partial = tagMatch[1].toLowerCase();

      // Filter tags that match the partial input
      const matchingTags = MARKUP_TAGS.filter((tag) =>
        tag.tag.toLowerCase().startsWith(partial)
      );

      return matchingTags.map((tag) => ({
        label: `<${tag.tag}>`,
        detail: tag.description,
        documentation: this.formatTagDocumentation(tag),
        insertText: this.generateTagInsertText(tag),
        category: tag.category,
        confidence: this.calculateConfidence(tag.tag, partial),
      }));
    }

    // Context-aware suggestions based on surrounding code
    suggestions.push(...this.getContextualSuggestions(code, cursorPosition));

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Get emoji suggestions
   */
  getSuggestionsForEmoji(code: string, cursorPosition: number): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const textBeforeCursor = code.substring(0, cursorPosition);
    const lastWord = textBeforeCursor.split(/\s+/).pop() || "";

    // Suggest emojis based on keyword proximity
    for (const [category, emojis] of Object.entries(EMOJI_REFERENCE)) {
      for (const [emoji, description] of Object.entries(emojis)) {
        suggestions.push({
          label: emoji,
          detail: description,
          documentation: `Category: ${category}\n${description}`,
          insertText: emoji,
          category: category as SuggestionCategory,
          confidence: this.calculateEmojiConfidence(
            emoji,
            description,
            lastWord
          ),
        });
      }
    }

    return suggestions
      .filter((s) => s.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Get contextual suggestions based on code structure
   */
  private getContextualSuggestions(
    code: string,
    cursorPosition: number
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const textBeforeCursor = code.substring(0, cursorPosition);

    // Check if inside a function
    const insideFunction = this.isInsideTag(textBeforeCursor, "function");
    if (insideFunction) {
      suggestions.push({
        label: "<return>",
        detail: "Return a value from the function",
        documentation: "Returns a value from the current function",
        insertText: "<return>$1</return>",
        category: "control-flow",
        confidence: 0.9,
      });
    }

    // Check if inside a class
    const insideClass =
      this.isInsideTag(textBeforeCursor, "extend") ||
      this.isInsideTag(textBeforeCursor, "class");
    if (insideClass) {
      suggestions.push({
        label: "<method>",
        detail: "Define a class method",
        documentation: "Creates a new method in the class",
        insertText: '<method name="$1" params="$2">\n  $3\n</method>',
        category: "function",
        confidence: 0.95,
      });
    }

    // Check if after an if statement
    const hasIf = textBeforeCursor.includes("</if>");
    if (hasIf && !textBeforeCursor.includes("<else>")) {
      suggestions.push({
        label: "<else>",
        detail: "Else block",
        documentation: "Alternative execution path when if condition is false",
        insertText: "<else>\n  $1\n</else>",
        category: "conditional",
        confidence: 0.85,
      });
    }

    return suggestions;
  }

  /**
   * Check if cursor is inside a specific tag
   */
  private isInsideTag(text: string, tagName: string): boolean {
    const openCount = (text.match(new RegExp(`<${tagName}[^>]*>`, "gi")) || [])
      .length;
    const closeCount = (text.match(new RegExp(`</${tagName}>`, "gi")) || [])
      .length;
    return openCount > closeCount;
  }

  /**
   * Format tag documentation
   */
  private formatTagDocumentation(tag: MarkupTagInfo): string {
    let doc = `**${tag.tag}** - ${tag.description}\n\n`;

    if (tag.attributes.length > 0) {
      doc += "**Attributes:**\n";
      for (const attr of tag.attributes) {
        const required = attr.required ? "**(required)**" : "(optional)";
        doc += `- \`${attr.name}\` ${required}: ${attr.description}\n`;
      }
      doc += "\n";
    }

    doc += `**Example:**\n\`\`\`\n${tag.example}\n\`\`\``;

    return doc;
  }

  /**
   * Generate smart insert text with placeholders
   */
  private generateTagInsertText(tag: MarkupTagInfo): string {
    const requiredAttrs = tag.attributes.filter((a) => a.required);

    if (requiredAttrs.length === 0) {
      // Self-closing or content-based tag
      if (["print", "log", "return", "comment"].includes(tag.tag)) {
        return `<${tag.tag}>$1</${tag.tag}>`;
      }
      return `<${tag.tag}/>`;
    }

    // Generate attributes with placeholders
    let attrs = "";
    requiredAttrs.forEach((attr, index) => {
      attrs += ` ${attr.name}="$${index + 1}"`;
    });

    // Check if tag typically has content
    if (
      ["function", "loop", "if", "while", "extend", "class", "method"].includes(
        tag.tag
      )
    ) {
      return `<${tag.tag}${attrs}>\n  $${requiredAttrs.length + 1}\n</${
        tag.tag
      }>`;
    }

    return `<${tag.tag}${attrs}/>`;
  }

  /**
   * Calculate confidence score for tag suggestion
   */
  private calculateConfidence(tagName: string, partial: string): number {
    if (partial === "") return 0.5;

    if (tagName.startsWith(partial)) {
      const ratio = partial.length / tagName.length;
      return 0.5 + ratio * 0.5; // 0.5 to 1.0
    }

    return 0;
  }

  /**
   * Calculate confidence for emoji suggestions
   */
  private calculateEmojiConfidence(
    emoji: string,
    description: string,
    context: string
  ): number {
    if (!context) return 0.4;

    const contextLower = context.toLowerCase();
    const descLower = description.toLowerCase();

    // Check for keyword matches
    const keywords = descLower.split(/[\s/]+/);
    let maxConfidence = 0.3;

    for (const keyword of keywords) {
      if (contextLower.includes(keyword)) {
        maxConfidence = Math.max(maxConfidence, 0.8);
      } else if (
        keyword.includes(contextLower) ||
        contextLower.includes(keyword.substring(0, 3))
      ) {
        maxConfidence = Math.max(maxConfidence, 0.6);
      }
    }

    return maxConfidence;
  }
}

export const suggestionEngine = new SuggestionEngine();
