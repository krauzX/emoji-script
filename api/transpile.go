package handler

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"emojiscript-backend/pkg/transpiler"
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
		now := time.Now()
		cutoff := now.Add(-CacheTTL)
		deleted := 0
		for k, v := range tc.cache {
			if v.timestamp.Before(cutoff) {
				delete(tc.cache, k)
				deleted++
				if deleted >= MaxCacheSize/4 {
					break
				}
			}
		}
		if len(tc.cache) >= MaxCacheSize {
			for k := range tc.cache {
				delete(tc.cache, k)
				break
			}
		}
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
	Output         string                 `json:"output"`
	TargetLanguage string                 `json:"targetLanguage"`
	Errors         []string               `json:"errors,omitempty"`
	Warnings       []string               `json:"warnings,omitempty"`
	Metadata       map[string]interface{} `json:"metadata,omitempty"`
	UsedMarkup     bool                   `json:"usedMarkup,omitempty"`
}

type Example struct {
	Title          string `json:"title"`
	Description    string `json:"description"`
	Code           string `json:"code"`
	Category       string `json:"category"`
	Syntax         string `json:"syntax"`
	TargetLanguage string `json:"targetLanguage,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	if origin == "https://emoji-script.vercel.app" || origin == "http://localhost:3000" || origin == "http://localhost:3001" {
		w.Header().Set("Access-Control-Allow-Origin", origin)
	} else {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := r.URL.Path

	if strings.HasSuffix(path, "/api/v1/health") || strings.HasSuffix(path, "/health") {
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy", "version": "1.0.0"})
		return
	}

	if strings.HasSuffix(path, "/api/v1/examples") || strings.HasSuffix(path, "/examples") {
		json.NewEncoder(w).Encode(map[string]interface{}{"examples": getExamples()})
		return
	}

	if r.Method != "POST" || (!strings.HasSuffix(path, "/api/v1/transpile") && !strings.HasSuffix(path, "/transpile")) {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}

	var req TranspileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		json.NewEncoder(w).Encode(TranspileResponse{
			Success: false,
			Errors:  []string{"Invalid request"},
		})
		return
	}

	if err := validateInput(req.Code); err != nil {
		json.NewEncoder(w).Encode(TranspileResponse{
			Success: false,
			Errors:  []string{err.Error()},
		})
		return
	}

	targetLang := strings.ToLower(req.TargetLanguage)
	if targetLang == "" {
		targetLang = "javascript"
	}

	if targetLang != "javascript" {
		json.NewEncoder(w).Encode(TranspileResponse{
			Success: false,
			Errors:  []string{"Only JavaScript is supported"},
		})
		return
	}

	useMarkup := req.UseMarkup || detectMarkupSyntax(req.Code)
	cacheKey := generateCacheKey(req.Code, targetLang, useMarkup)

	if cached, found := cache.Get(cacheKey); found {
		if cached.Metadata == nil {
			cached.Metadata = make(map[string]interface{})
		}
		cached.Metadata["cached"] = true
		json.NewEncoder(w).Encode(cached)
		return
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
			response := TranspileResponse{
				Success:        false,
				TargetLanguage: targetLang,
				Errors:         allErrors,
				Warnings:       warnings,
				UsedMarkup:     useMarkup,
			}
			json.NewEncoder(w).Encode(response)
			return
		}
	} else {
		output, err = transpileToLanguage(req.Code, targetLang)
		if err != nil {
			response := TranspileResponse{
				Success:        false,
				TargetLanguage: targetLang,
				Errors:         []string{err.Error()},
				UsedMarkup:     useMarkup,
			}
			json.NewEncoder(w).Encode(response)
			return
		}
	}

	if strings.TrimSpace(output) == "" {
		json.NewEncoder(w).Encode(TranspileResponse{
			Success: false,
			Errors:  []string{"Empty output"},
		})
		return
	}

	response := TranspileResponse{
		Success:        true,
		Output:         output,
		TargetLanguage: targetLang,
		Warnings:       warnings,
		UsedMarkup:     useMarkup,
		Metadata: map[string]interface{}{
			"cached": false,
		},
	}

	cache.Set(cacheKey, &response)
	json.NewEncoder(w).Encode(response)
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

func getExamples() []Example {
	return []Example{
		{
			Title:          "Hello World",
			Description:    "Classic greeting",
			Code:           "👋🌍",
			Category:       "basics",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Variables",
			Description:    "Declare and use variables",
			Code:           "📦 x = 5\n📦 y = 10\n➕ x y",
			Category:       "basics",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Conditions",
			Description:    "If-else statement",
			Code:           "❓ x > 5 {\n  📢 \"Greater\"\n} ❌ {\n  📢 \"Smaller\"\n}",
			Category:       "control-flow",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Loop",
			Description:    "For loop example",
			Code:           "🔄 i = 0; i < 10; i++ {\n  📢 i\n}",
			Category:       "control-flow",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Function",
			Description:    "Define and call a function",
			Code:           "🎯 greet(name) {\n  ↩️ \"Hello \" + name\n}\n📢 greet(\"World\")",
			Category:       "functions",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Array Operations",
			Description:    "Work with arrays",
			Code:           "📋 arr = [1, 2, 3, 4, 5]\n📢 arr[0]\n📏 arr",
			Category:       "data-structures",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Object Creation",
			Description:    "Create and use objects",
			Code:           "🎁 person = {\n  name: \"Alice\",\n  age: 30\n}\n📢 person.name",
			Category:       "data-structures",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Math Operations",
			Description:    "Perform calculations",
			Code:           "📦 result = (10 ➕ 5) ➖ 3 ✖️ 2\n📢 result",
			Category:       "basics",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "String Manipulation",
			Description:    "Work with strings",
			Code:           "📦 str = \"Hello\"\n📦 upper = str.toUpperCase()\n📢 upper",
			Category:       "basics",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
		{
			Title:          "Error Handling",
			Description:    "Try-catch example",
			Code:           "🛡️ {\n  📦 x = riskyOperation()\n  📢 x\n} 🚫 (err) {\n  📢 \"Error: \" + err\n}",
			Category:       "advanced",
			Syntax:         "emoji",
			TargetLanguage: "javascript",
		},
	}
}
