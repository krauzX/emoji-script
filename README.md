# EmojiScript

A transpiler that converts emoji-based and markup-based code to JavaScript.

## Architecture

- **Frontend**: Next.js 16 + React 19 (emojiscript-frontend/)
- **Backend**: Go with AST-based transpiler (emojiscript-backend/)
- **Serverless API**: Vercel functions using shared transpiler (api/)
- **Caching**: SHA-256 based LRU (1000 entries, 1 hour TTL)
- **Validation**: Input sanitization, dangerous pattern detection
- **Features**: 15+ tag types, scope tracking, error/warning collection

## Local Development

### Backend (Full Server)

```bash
cd emojiscript-backend
go run cmd/server/main.go
```

Server runs on `http://localhost:3001` with rate limiting, CORS, and full middleware stack.

### Frontend

```bash
cd emojiscript-frontend
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:3000`.

## Features

### Emoji Syntax

40+ emoji mappings: `📦` → const, `🎯` → function, `🔁` → for, `❓` → if, `⚡` → async, etc.

### Markup Syntax

AST-based parser with 15+ tags:

- Variables: `<var>`, `<let>`, `<const>`
- Functions: `<function>`, `<arrow>`
- Control: `<if>`, `<else>`, `<switch>`, `<case>`
- Loops: `<loop>`, `<while>`, `<break>`, `<continue>`
- Classes: `<class>`, `<method>`, `<constructor>`
- Async: `<async>`, `<await>`
- Error Handling: `<try>`, `<catch>`, `<finally>`
- Modules: `<import>`, `<export>`

### Validation

- Syntax mode detection (prevents mixing emoji and markup)
- Input length limits (100KB max)
- Dangerous pattern detection (eval, exec, subprocess)
- Error/warning collection with line numbers

## Tech Stack

- **Frontend**: Next.js 16, React 19, Monaco Editor, Tailwind CSS, shadcn/ui
- **Backend**: Go 1.23, Fiber v2.52
- **Transpiler**: Custom AST parser with scope tracking
- **Deployment**: Vercel serverless (Go runtime)

## Project Structure

````
api/                           # Vercel serverless functions
  transpile.go                 # Handler (imports emojiscript-backend)
  go.mod                       # Uses local module replace

emojiscript-backend/           # Production transpiler
  pkg/transpiler/
    markup_parser.go          # AST parser (432 lines)
    markup_transpiler.go      # Tag handlers (412 lines)
  cmd/server/main.go          # Full Fiber server for local dev

emojiscript-frontend/          # Next.js app
  app/
  components/
  lib/

```bash
# Clone the repository
git clone <repo-url>
cd Grave

# Install Go dependencies
cd emojiscript-backend
go mod download

# Start Go backend
go run cmd/server/main.go

# In another terminal, start Next.js frontend
cd ../emojiscript-frontend
pnpm install
pnpm dev
````

Visit `http://localhost:3000` to start coding! 🎉

## 📝 Language Syntax

EmojiScript supports **two syntax modes**:

### 1️⃣ **HTML-Like Markup** (Recommended)

```html
<!-- Print -->
<print>"Hello, World! 🌍"</print>

<!-- Variables -->
<const name="PI" value="3.14159" />
<var name="count" value="0" />

<!-- Function -->
<function name="greet" params="name">
  <return>"Hello, " + name</return>
</function>

<!-- Loop -->
<loop var="i" from="0" to="10">
  <print>i</print>
</loop>

<!-- Conditional -->
<if condition="age >= 18">
  <print>"Adult"</print>
</if>
<else>
  <print>"Minor"</print>
</else>

<!-- Class -->
<extend name="Person">
  <method name="constructor" params="name"> this.name = name </method>
</extend>
```

### 2️⃣ **Emoji Syntax**

```
💾 x 👉 42          // let x = 42;
💾 name 👉 "Alice"  // let name = "Alice";
🔒 PI 👉 3.14       // const PI = 3.14;
```

### Functions

```
⚡ greet 📥 name 📦
  💬 "Hello, " ➕ name
📦
// function greet(name) { return "Hello, " + name; }
```

### Control Flow

```
❓ x 🟰 10 📦
  💬 "Ten!"
📦 🔄 ❓ x ⬆️ 10 📦
  💬 "More than ten"
📦 🔄 📦
  💬 "Less than ten"
📦
// if (x === 10) { return "Ten!"; } else if (x > 10) { return "More than ten"; } else { return "Less than ten"; }
```

### Loops

```
🔄 💾 i 👉 0 ⏸️ i ⬇️ 10 ⏸️ i ➕➕ 📦
  📺 i
📦
// for (let i = 0; i < 10; i++) { console.log(i); }

🔁 x ⬇️ 100 📦
  📺 x
  x 👉 x ➕ 1
📦
// while (x < 100) { console.log(x); x = x + 1; }
```

### Objects & Arrays

```
💾 person 👉 🎁
  🔑 name 👉 "Bob"
  🔑 age 👉 30
🎁

💾 numbers 👉 📊 1, 2, 3, 4, 5 📊
```

### Advanced Features

```
// Async/Await
⏳ ⚡ fetchData 📥 url 📦
  💾 response 👉 ⏰ fetch 📞 url 📞
  💬 ⏰ response.json 📞 📞
📦

// Classes
🏛️ Person 📦
  🔧 📥 name, age 📦
    🔗 .name 👉 name
    🔗 .age 👉 age
  📦

  ⚡ greet 📦
    💬 "Hello, I'm " ➕ 🔗 .name
  📦
📦

// Try/Catch
🛡️ 📦
  💾 data 👉 JSON.parse 📞 input 📞
📦 🚫 error 📦
  📺 "Error: " ➕ error
📦
```

## 🏗️ Architecture

```
┌─────────────────────────────────────┐
│       Next.js Frontend (TS)         │
│  - Monaco Editor Integration        │
│  - Real-time Preview                │
│  - Shareable Links                  │
└────────────┬────────────────────────┘
             │ REST API
┌────────────▼────────────────────────┐
│      Go Backend (Transpiler)        │
│  - Lexer: Tokenization              │
│  - Parser: AST Generation           │
│  - Code Generator: JS Output        │
│  - AI Suggestion Engine             │
└─────────────────────────────────────┘
```

## 🔧 Tech Stack

### Backend

- **Go 1.22+** - High-performance transpiler
- **Fiber v2** - Lightning-fast HTTP framework
- **Zap** - Structured logging
- **Validator v10** - Input validation

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Monaco Editor** - VS Code-like experience
- **TailwindCSS** - Styling
- **Zustand** - State management
- **React Query** - API data fetching

## 📚 API Documentation

### POST `/api/v1/transpile`

Transpile emoji code to JavaScript.

**Request:**

```json
{
  "code": "💾 x 👉 42\n📺 x",
  "sourceMap": false
}
```

**Response:**

```json
{
  "success": true,
  "javascript": "let x = 42;\nconsole.log(x);",
  "sourceMap": null,
  "metadata": {
    "linesOfCode": 2,
    "transpileTime": "2.3ms"
  }
}
```

### POST `/api/v1/suggest`

Get AI-powered emoji suggestions.

**Request:**

```json
{
  "context": "💾 x 👉 42\n",
  "cursorPosition": 14
}
```

**Response:**

```json
{
  "suggestions": [
    {
      "emoji": "📺",
      "description": "console.log()",
      "category": "output",
      "confidence": 0.95
    },
    {
      "emoji": "❓",
      "description": "if statement",
      "category": "control-flow",
      "confidence": 0.87
    }
  ]
}
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

## 📄 License

MIT © 2025

## 🎉 Examples

Check out the [examples/](./examples/) directory for sample EmojiScript programs!

---

Made with 💖 and emojis
