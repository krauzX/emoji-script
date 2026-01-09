package main

import (
	"crypto/sha256"
	"emojiscript-backend/pkg/transpiler"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/helmet"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
)

const (
	MaxCodeLength = 100000
	MaxCacheSize  = 1000
	CacheTTL      = time.Hour
)

type TranspileCache struct {
	mu    sync.RWMutex
	cache map[string]*CacheEntry
}

type CacheEntry struct {
	result    *TranspileResponse
	timestamp time.Time
}

var cache = &TranspileCache{cache: make(map[string]*CacheEntry)}

func (tc *TranspileCache) Get(key string) (*TranspileResponse, bool) {
	tc.mu.RLock()
	defer tc.mu.RUnlock()

	if entry, exists := tc.cache[key]; exists && time.Since(entry.timestamp) < CacheTTL {
		return entry.result, true
	}
	return nil, false
}

func (tc *TranspileCache) Set(key string, result *TranspileResponse) {
	tc.mu.Lock()
	defer tc.mu.Unlock()

	if len(tc.cache) >= MaxCacheSize {
		var oldestKey string
		var oldestTime time.Time
		for k, v := range tc.cache {
			if oldestKey == "" || v.timestamp.Before(oldestTime) {
				oldestKey, oldestTime = k, v.timestamp
			}
		}
		delete(tc.cache, oldestKey)
	}

	tc.cache[key] = &CacheEntry{result: result, timestamp: time.Now()}
}

type TranspileRequest struct {
	Code           string `json:"code"`
	TargetLanguage string `json:"targetLanguage,omitempty"`
	UseMarkup      bool   `json:"useMarkup,omitempty"`
}

type TranspileResponse struct {
	Success        bool                   `json:"success"`
	JavaScript     string                 `json:"javascript,omitempty"`
	TypeScript     string                 `json:"typescript,omitempty"`
	Python         string                 `json:"python,omitempty"`
	Rust           string                 `json:"rust,omitempty"`
	GDScript       string                 `json:"gdscript,omitempty"`
	TargetLanguage string                 `json:"targetLanguage"`
	Output         string                 `json:"output"`
	Errors         []string               `json:"errors,omitempty"`
	Warnings       []string               `json:"warnings,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	UsedMarkup     bool                   `json:"usedMarkup,omitempty"`
}

type ValidateResponse struct {
	Valid  bool     `json:"valid"`
	Errors []string `json:"errors,omitempty"`
}

type HealthResponse struct {
	Status  string `json:"status"`
	Version string `json:"version"`
}

func validateInput(code string) error {
	if len(code) == 0 {
		return fmt.Errorf("code cannot be empty")
	}
	if len(code) > MaxCodeLength {
		return fmt.Errorf("code exceeds maximum length")
	}

	dangerousPatterns := []string{"eval(", "exec(", "__import__", "subprocess", "os.system"}
	lower := strings.ToLower(code)
	for _, pattern := range dangerousPatterns {
		if strings.Contains(lower, pattern) {
			return fmt.Errorf("unsafe pattern detected")
		}
	}
	return nil
}

func generateCacheKey(code, lang string, markup bool) string {
	hash := sha256.Sum256([]byte(fmt.Sprintf("%s:%s:%t", code, lang, markup)))
	return hex.EncodeToString(hash[:])
}

func detectMarkupSyntax(code string) bool {
	tags := []string{"<print", "<var", "<let", "<const", "<function", "<loop", "<if", "<class"}
	lower := strings.ToLower(code)
	for _, tag := range tags {
		if strings.Contains(lower, tag) {
			return true
		}
	}
	return false
}

func transpileWithMarkup(code, targetLang string) (string, []string, []string, error) {
	parser := transpiler.NewMarkupParser(code, targetLang)
	output, err := parser.Parse()
	return output, parser.GetErrors(), parser.GetWarnings(), err
}

func transpileToLanguage(code, targetLang string) (string, error) {
	emojiMap := map[string]string{
		"📦": "const", "🔢": "let", "🎯": "function", "➡️": "=>", "🔁": "for", "❓": "if",
		"❌": "else", "✅": "true", "⛔": "false", "🔙": "return", "📝": "console.log",
		"➕": "+", "➖": "-", "✖️": "*", "➗": "/", "🟰": "===", "❗": "!==",
		"⬆️": ">", "⬇️": "<", "📈": ">=", "📉": "<=", "🔗": "&&", "🔀": "||",
		"🚫": "!", "📥": "import", "📤": "export", "🔄": "while", "⚡": "async",
		"⏳": "await", "🎁": "new", "🗑️": "delete", "📊": "typeof", "🔍": "in",
		"🎪": "switch", "🔘": "case", "🏁": "break", "⏭️": "continue", "💥": "throw",
		"🛡️": "try", "🚨": "catch", "🏆": "finally", "🔐": "class", "🎨": "extends",
		"🌟": "static", "🔧": "constructor", "🎭": "this", "📍": "null", "❔": "undefined",
	}

	result := code
	for emoji, keyword := range emojiMap {
		result = strings.ReplaceAll(result, emoji, keyword)
	}

	return result, nil
}

func main() {
	godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	app := fiber.New(fiber.Config{
		AppName:      "EmojiScript API",
		ServerHeader: "EmojiScript",
		Prefork:      false,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(recover.New())
	app.Use(helmet.New())
	app.Use(limiter.New(limiter.Config{
		Max:        100,
		Expiration: time.Minute,
		SkipFailedRequests: true,
		SkipSuccessfulRequests: false,
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Rate limit exceeded. Please try again later.",
			})
		},
		Next: func(c *fiber.Ctx) bool {
			return c.Path() == "/api/v1/health"
		},
	}))
	app.Use(logger.New(logger.Config{
		Format:     "${time} | ${status} | ${latency} | ${method} ${path}\n",
		TimeFormat: "15:04:05",
	}))

	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		origins = "http://localhost:3000,http://localhost:3001,https://emoji-script.vercel.app"
	}

	app.Use(cors.New(cors.Config{
		AllowOrigins:     origins,
		AllowHeaders:     "Origin,Content-Type,Accept",
		AllowMethods:     "GET,POST,OPTIONS",
		AllowCredentials: true,
		MaxAge:           3600,
	}))

	api := app.Group("/api/v1")

	api.Get("/api/v1/health", func(c *fiber.Ctx) error {
		return c.JSON(HealthResponse{Status: "healthy", Version: "1.0.0"})
	})

	api.Post("/api/v1/transpile", func(c *fiber.Ctx) error {
		start := time.Now()

		var req TranspileRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(TranspileResponse{
				Success: false,
				Errors:  []string{"Invalid request"},
			})
		}

		if err := validateInput(req.Code); err != nil {
			return c.Status(400).JSON(TranspileResponse{
				Success: false,
				Errors:  []string{err.Error()},
			})
		}

		targetLang := strings.ToLower(req.TargetLanguage)
		if targetLang == "" {
			targetLang = "javascript"
		}

		if targetLang != "javascript" {
			return c.Status(400).JSON(TranspileResponse{
				Success: false,
				Errors:  []string{"Invalid target language. Only 'javascript' is supported."},
			})
		}

		useMarkup := req.UseMarkup || detectMarkupSyntax(req.Code)

		cacheKey := generateCacheKey(req.Code, targetLang, useMarkup)
		if cached, found := cache.Get(cacheKey); found {
			cached.Metadata["cached"] = true
			return c.JSON(cached)
		}

		var output string
		var errors, warnings []string
		var err error

		if useMarkup {
			output, errors, warnings, err = transpileWithMarkup(req.Code, targetLang)
			if err != nil || len(errors) > 0 {
				allErrors := errors
				if err != nil {
					allErrors = append(allErrors, err.Error())
				}
				return c.Status(400).JSON(TranspileResponse{
					Success:        false,
					TargetLanguage: targetLang,
					Errors:         allErrors,
					Warnings:       warnings,
					UsedMarkup:     useMarkup,
				})
			}
		} else {
			output, err = transpileToLanguage(req.Code, targetLang)
			if err != nil {
				return c.Status(400).JSON(TranspileResponse{
					Success:        false,
					TargetLanguage: targetLang,
					Errors:         []string{err.Error()},
					UsedMarkup:     useMarkup,
				})
			}
		}

		if strings.TrimSpace(output) == "" {
			return c.Status(500).JSON(TranspileResponse{
				Success: false,
				Errors:  []string{"Empty output"},
			})
		}

		response := TranspileResponse{
			Success:        true,
			Output:         output,
			TargetLanguage: targetLang,
			UsedMarkup:     useMarkup,
			Warnings:       warnings,
			Metadata: map[string]interface{}{
				"transpileTime": time.Since(start).Milliseconds(),
				"cached":        false,
			},
		}

		response.JavaScript = output

		cache.Set(cacheKey, &response)
		return c.JSON(response)
	})

	api.Post("/api/v1/validate", func(c *fiber.Ctx) error {
		var req TranspileRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(ValidateResponse{Valid: false, Errors: []string{"Invalid request"}})
		}

		errors := []string{}
		if req.Code == "" {
			errors = append(errors, "Code cannot be empty")
		}

		braceCount, parenCount := 0, 0
		for _, char := range req.Code {
			switch char {
			case '{':
				braceCount++
			case '}':
				braceCount--
			case '(':
				parenCount++
			case ')':
				parenCount--
			}
		}

		if braceCount != 0 {
			errors = append(errors, "Unbalanced braces")
		}
		if parenCount != 0 {
			errors = append(errors, "Unbalanced parentheses")
		}

		return c.JSON(ValidateResponse{Valid: len(errors) == 0, Errors: errors})
	})

	api.Get("/api/v1/examples", func(c *fiber.Ctx) error {
		syntax := c.Query("syntax", "emoji")
		examples := []fiber.Map{}

		if syntax == "markup" {
			examples = []fiber.Map{
				{"title": "Hello World", "description": "Basic console output", "code": "<print>\"Hello, World!\"</print>", "syntax": "markup", "category": "basics"},
				{"title": "Variables", "description": "Declare variables and constants", "code": "<const name=\"user\" value=\"'Alice'\"/>\n<let name=\"age\" value=\"25\"/>\n<let name=\"active\" value=\"true\"/>", "syntax": "markup", "category": "basics"},
				{"title": "Function", "description": "Function with parameters", "code": "<function name=\"greet\" params=\"name\">\n  <return>\"Hello, \" + name</return>\n</function>\n<print>greet(\"World\")</print>", "syntax": "markup", "category": "functions"},
				{"title": "Arrow Function", "description": "Arrow function syntax", "code": "<const name=\"add\" value=\"(a, b) => a + b\"/>\n<print>add(5, 3)</print>", "syntax": "markup", "category": "functions"},
				{"title": "If/Else", "description": "Conditional logic", "code": "<let name=\"age\" value=\"20\"/>\n<if condition=\"age >= 18\">\n  <print>\"Adult\"</print>\n</if>\n<else>\n  <print>\"Minor\"</print>\n</else>", "syntax": "markup", "category": "control"},
				{"title": "For Loop", "description": "Loop from 0 to 5", "code": "<loop var=\"i\" from=\"0\" to=\"5\">\n  <print>i</print>\n</loop>", "syntax": "markup", "category": "loops"},
				{"title": "ForEach Loop", "description": "Iterate over array", "code": "<const name=\"items\" value=\"['apple', 'banana', 'orange']\"/>\n<loop var=\"item\" in=\"items\">\n  <print>item</print>\n</loop>", "syntax": "markup", "category": "loops"},
				{"title": "While Loop", "description": "Loop while condition is true", "code": "<let name=\"count\" value=\"0\"/>\n<while condition=\"count < 3\">\n  <print>count</print>\n  count++\n</while>", "syntax": "markup", "category": "loops"},
				{"title": "Class", "description": "Create a class with methods", "code": "<class name=\"Person\">\n  <method name=\"constructor\" params=\"name\">\n    this.name = name\n  </method>\n  <method name=\"greet\">\n    <return>\"Hi, \" + this.name</return>\n  </method>\n</class>\n<const name=\"p\" value=\"new Person('Alice')\"/>\n<print>p.greet()</print>", "syntax": "markup", "category": "classes"},
				{"title": "Array Map", "description": "Transform array with map", "code": "<const name=\"nums\" value=\"[1, 2, 3, 4, 5]\"/>\n<const name=\"doubled\" value=\"nums.map(n => n * 2)\"/>\n<print>doubled</print>", "syntax": "markup", "category": "arrays"},
				{"title": "Array Filter", "description": "Filter array elements", "code": "<const name=\"nums\" value=\"[1, 2, 3, 4, 5]\"/>\n<const name=\"evens\" value=\"nums.filter(n => n % 2 === 0)\"/>\n<print>evens</print>", "syntax": "markup", "category": "arrays"},
				{"title": "Async Function", "description": "Async/await pattern", "code": "<function name=\"fetchData\" params=\"url\" async=\"true\">\n  <const name=\"response\" value=\"await fetch(url)\"/>\n  <return>await response.json()</return>\n</function>", "syntax": "markup", "category": "async"},
			}
		} else {
			examples = []fiber.Map{
				{"title": "Hello World", "description": "Print to console", "code": "📝(\"Hello, World!\")", "syntax": "emoji", "category": "basics"},
				{"title": "Variables", "description": "Declare variables", "code": "📦 name 🟰 \"EmojiScript\"\n🔢 age 🟰 25\n🔢 active 🟰 ✅", "syntax": "emoji", "category": "basics"},
				{"title": "Function", "description": "Function with return", "code": "🎯 greet(name) {\n  🔙 \"Hello, \" ➕ name\n}\n📝(greet(\"World\"))", "syntax": "emoji", "category": "functions"},
				{"title": "Arrow Function", "description": "Arrow function", "code": "📦 add 🟰 (a, b) ➡️ a ➕ b\n📝(add(5, 3))", "syntax": "emoji", "category": "functions"},
				{"title": "If/Else", "description": "Conditional statement", "code": "📦 age 🟰 20\n❓ (age ⬆️🟰 18) {\n  📝(\"Adult\")\n} ❌ {\n  📝(\"Minor\")\n}", "syntax": "emoji", "category": "control"},
				{"title": "For Loop", "description": "Loop through numbers", "code": "🔁 (🔢 i 🟰 0; i ⬇️ 5; i➕➕) {\n  📝(i)\n}", "syntax": "emoji", "category": "loops"},
				{"title": "While Loop", "description": "Loop with condition", "code": "🔢 count 🟰 0\n🔄 (count ⬇️ 3) {\n  📝(count)\n  count➕➕\n}", "syntax": "emoji", "category": "loops"},
				{"title": "Class", "description": "Create a class", "code": "🔐 Person {\n  🔧(name) {\n    🎭.name 🟰 name\n  }\n  greet() {\n    🔙 \"Hi, \" ➕ 🎭.name\n  }\n}\n📦 p 🟰 🎁 Person(\"Alice\")\n📝(p.greet())", "syntax": "emoji", "category": "classes"},
				{"title": "Array Map", "description": "Map over array", "code": "📦 nums 🟰 [1, 2, 3, 4, 5]\n📦 doubled 🟰 nums.map(n ➡️ n ✖️ 2)\n📝(doubled)", "syntax": "emoji", "category": "arrays"},
				{"title": "Array Filter", "description": "Filter array", "code": "📦 nums 🟰 [1, 2, 3, 4, 5]\n📦 evens 🟰 nums.filter(n ➡️ n % 2 🟰🟰 0)\n📝(evens)", "syntax": "emoji", "category": "arrays"},
				{"title": "Async Function", "description": "Async operation", "code": "⚡ 🎯 fetchData(url) {\n  📦 response 🟰 ⏳ fetch(url)\n  🔙 ⏳ response.json()\n}", "syntax": "emoji", "category": "async"},
			}
		}

		return c.JSON(examples)
	})

	log.Printf("🚀 EmojiScript API running on port %s\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start: %v\n", err)
	}
}
