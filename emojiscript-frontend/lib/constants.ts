export const EMOJI_SYNTAX = {
  variables: [
    { emoji: "📦", js: "const", desc: "Constant variable" },
    { emoji: "🔢", js: "let", desc: "Mutable variable" },
    { emoji: "📌", js: "var", desc: "Variable (old style)" },
  ],
  functions: [
    { emoji: "🎯", js: "function", desc: "Function declaration" },
    { emoji: "➡️", js: "=>", desc: "Arrow function" },
    { emoji: "🔙", js: "return", desc: "Return statement" },
  ],
  control: [
    { emoji: "❓", js: "if", desc: "If statement" },
    { emoji: "❌", js: "else", desc: "Else statement" },
    { emoji: "🔁", js: "for", desc: "For loop" },
    { emoji: "🔄", js: "while", desc: "While loop" },
    { emoji: "🎪", js: "switch", desc: "Switch statement" },
    { emoji: "🎯", js: "case", desc: "Case statement" },
    { emoji: "🏁", js: "break", desc: "Break statement" },
    { emoji: "⏭️", js: "continue", desc: "Continue statement" },
  ],
  operators: [
    { emoji: "➕", js: "+", desc: "Addition" },
    { emoji: "➖", js: "-", desc: "Subtraction" },
    { emoji: "✖️", js: "*", desc: "Multiplication" },
    { emoji: "➗", js: "/", desc: "Division" },
    { emoji: "🟰", js: "===", desc: "Strict equality" },
    { emoji: "❗", js: "!==", desc: "Strict inequality" },
    { emoji: "⬆️", js: ">", desc: "Greater than" },
    { emoji: "⬇️", js: "<", desc: "Less than" },
    { emoji: "📈", js: ">=", desc: "Greater or equal" },
    { emoji: "📉", js: "<=", desc: "Less or equal" },
    { emoji: "🔗", js: "&&", desc: "Logical AND" },
    { emoji: "🔀", js: "||", desc: "Logical OR" },
    { emoji: "🚫", js: "!", desc: "Logical NOT" },
  ],
  values: [
    { emoji: "✅", js: "true", desc: "Boolean true" },
    { emoji: "⛔", js: "false", desc: "Boolean false" },
    { emoji: "📍", js: "null", desc: "Null value" },
    { emoji: "❔", js: "undefined", desc: "Undefined value" },
  ],
  io: [
    { emoji: "📝", js: "console.log", desc: "Console log" },
    { emoji: "📥", js: "import", desc: "Import statement" },
    { emoji: "📤", js: "export", desc: "Export statement" },
  ],
  async: [
    { emoji: "⚡", js: "async", desc: "Async function" },
    { emoji: "⏳", js: "await", desc: "Await expression" },
  ],
  objects: [
    { emoji: "🎁", js: "new", desc: "New instance" },
    { emoji: "🗑️", js: "delete", desc: "Delete property" },
    { emoji: "📊", js: "typeof", desc: "Type of operator" },
    { emoji: "🔍", js: "in", desc: "In operator" },
    { emoji: "🔐", js: "class", desc: "Class declaration" },
    { emoji: "🎨", js: "extends", desc: "Class inheritance" },
    { emoji: "🌟", js: "static", desc: "Static method" },
    { emoji: "🔧", js: "constructor", desc: "Constructor method" },
    { emoji: "🎭", js: "this", desc: "This keyword" },
  ],
  error: [
    { emoji: "💥", js: "throw", desc: "Throw error" },
    { emoji: "🛡️", js: "try", desc: "Try block" },
    { emoji: "🚨", js: "catch", desc: "Catch block" },
    { emoji: "🏆", js: "finally", desc: "Finally block" },
  ],
};

export const EXAMPLES = [
  {
    title: "Hello World",
    description: "Basic console log",
    code: '📝("Hello, EmojiScript! 🎉")',
  },
  {
    title: "Variables",
    description: "Declare constants and variables",
    code: '📦 name 🟰 "EmojiScript"\n🔢 version 🟰 1.0\n📝(name, version)',
  },
  {
    title: "Function",
    description: "Define and call a function",
    code: '🎯 greet(name) {\n  🔙 "Hello, " ➕ name\n}\n📝(greet("World"))',
  },
  {
    title: "Conditional",
    description: "If-else statement",
    code: '📦 age 🟰 25\n❓ (age ⬆️ 18) {\n  📝("Adult")\n} ❌ {\n  📝("Minor")\n}',
  },
  {
    title: "Loop",
    description: "For loop example",
    code: "🔁 (🔢 i 🟰 0; i ⬇️ 5; i➕➕) {\n  📝(i)\n}",
  },
  {
    title: "Arrow Function",
    description: "Modern function syntax",
    code: "📦 square 🟰 (x) ➡️ x ✖️ x\n📝(square(5))",
  },
  {
    title: "Array Operations",
    description: "Working with arrays",
    code: "📦 numbers 🟰 [1, 2, 3, 4, 5]\n📦 doubled 🟰 numbers.map(n ➡️ n ✖️ 2)\n📝(doubled)",
  },
  {
    title: "Class",
    description: "Object-oriented programming",
    code: '🔐 Person {\n  🔧(name, age) {\n    🎭.name 🟰 name\n    🎭.age 🟰 age\n  }\n  \n  greet() {\n    🔙 `Hi, I\'m ${🎭.name}`\n  }\n}\n\n📦 person 🟰 🎁 Person("Alice", 30)\n📝(person.greet())',
  },
];
