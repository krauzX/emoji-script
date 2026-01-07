package transpiler

import (
	"fmt"
	"regexp"
	"strings"
)

// MarkupTag represents a parsed HTML-like tag
type MarkupTag struct {
	Name       string
	Attributes map[string]string
	Content    string
	Children   []MarkupTag
	Line       int
	Column     int
}

// MarkupParser handles the parsing and transpilation of HTML-like markup syntax
type MarkupParser struct {
	input        string
	position     int
	line         int
	column       int
	errors       []string
	warnings     []string
	targetLang   string
	indentLevel  int
	scopeVars    map[string]bool // Track variable scope
}

// NewMarkupParser creates a new parser instance
func NewMarkupParser(input, targetLang string) *MarkupParser {
	return &MarkupParser{
		input:      input,
		targetLang: targetLang,
		line:       1,
		column:     1,
		scopeVars:  make(map[string]bool),
	}
}

// Parse the complete markup document
func (p *MarkupParser) Parse() (string, error) {
	if strings.TrimSpace(p.input) == "" {
		return "", fmt.Errorf("empty input")
	}

	// First pass: Convert emojis to keywords if present
	p.input = p.convertEmojisToKeywords(p.input)

	// Second pass: Parse markup tags
	result := &strings.Builder{}
	
	for p.position < len(p.input) {
		if p.peek() == '<' {
			tag, err := p.parseTag()
			if err != nil {
				p.errors = append(p.errors, err.Error())
				p.advance()
				continue
			}
			
			transpiled := p.transpileTag(tag)
			result.WriteString(transpiled)
			result.WriteString("\n")
		} else if !p.isWhitespace(p.peek()) {
			// Handle raw code (non-markup)
			rawCode := p.parseRawCode()
			result.WriteString(rawCode)
			result.WriteString("\n")
		} else {
			p.advance()
		}
	}

	if len(p.errors) > 0 {
		return result.String(), fmt.Errorf("parsing errors: %s", strings.Join(p.errors, "; "))
	}

	return result.String(), nil
}

// parseTag parses a single markup tag
func (p *MarkupParser) parseTag() (*MarkupTag, error) {
	if p.peek() != '<' {
		return nil, fmt.Errorf("expected '<' at line %d, column %d", p.line, p.column)
	}
	
	p.advance() // consume '<'
	
	// Check for closing tag
	if p.peek() == '/' {
		return p.parseClosingTag()
	}
	
	// Parse tag name
	tagName := p.parseIdentifier()
	if tagName == "" {
		return nil, fmt.Errorf("expected tag name at line %d, column %d", p.line, p.column)
	}
	
	tag := &MarkupTag{
		Name:       tagName,
		Attributes: make(map[string]string),
		Line:       p.line,
		Column:     p.column,
	}
	
	// Parse attributes
	p.skipWhitespace()
	for p.peek() != '>' && p.peek() != '/' && p.position < len(p.input) {
		attrName := p.parseIdentifier()
		if attrName == "" {
			break
		}
		
		p.skipWhitespace()
		if p.peek() == '=' {
			p.advance()
			p.skipWhitespace()
			attrValue := p.parseAttributeValue()
			tag.Attributes[attrName] = attrValue
		} else {
			tag.Attributes[attrName] = "true"
		}
		p.skipWhitespace()
	}
	
	// Check for self-closing tag
	if p.peek() == '/' {
		p.advance()
		if p.peek() != '>' {
			return nil, fmt.Errorf("expected '>' after '/' at line %d, column %d", p.line, p.column)
		}
		p.advance()
		return tag, nil
	}
	
	if p.peek() != '>' {
		return nil, fmt.Errorf("expected '>' at line %d, column %d", p.line, p.column)
	}
	p.advance() // consume '>'
	
	// Parse content until closing tag, handling nested tags
	content := &strings.Builder{}
	startPos := p.position
	
	for p.position < len(p.input) {
		if p.peek() == '<' {
			// Check if it's a closing tag
			if p.peekNext() == '/' {
				// Peek ahead to see if it's OUR closing tag
				savedPos := p.position
				savedLine := p.line
				savedCol := p.column
				
				p.advance() // <
				p.advance() // /
				closingName := p.parseIdentifier()
				
				if closingName == tagName {
					// This is our closing tag
					p.skipWhitespace()
					if p.peek() != '>' {
						return nil, fmt.Errorf("expected '>' in closing tag at line %d", p.line)
					}
					p.advance() // consume '>'
					
					tag.Content = strings.TrimSpace(content.String())
					return tag, nil
				} else {
					// Not our closing tag, restore position and continue
					p.position = savedPos
					p.line = savedLine
					p.column = savedCol
					content.WriteByte(p.peek())
					p.advance()
				}
			} else {
				// It's a nested opening tag - parse it recursively
				nestedTag, err := p.parseTag()
				if err != nil {
					return nil, err
				}
				tag.Children = append(tag.Children, *nestedTag)
				// Add the transpiled nested tag to content
				content.WriteString(p.transpileTag(nestedTag))
			}
		} else {
			content.WriteByte(p.peek())
			p.advance()
		}
	}
	
	// If we reach here, no closing tag was found
	p.position = startPos
	return nil, fmt.Errorf("unclosed tag <%s> at line %d, column %d", tagName, tag.Line, tag.Column)
}

// parseClosingTag parses a closing tag like </print>
func (p *MarkupParser) parseClosingTag() (*MarkupTag, error) {
	if p.peek() != '<' {
		return nil, fmt.Errorf("expected '<'")
	}
	p.advance()
	
	if p.peek() != '/' {
		return nil, fmt.Errorf("expected '/'")
	}
	p.advance()
	
	tagName := p.parseIdentifier()
	if tagName == "" {
		return nil, fmt.Errorf("expected tag name in closing tag")
	}
	
	p.skipWhitespace()
	if p.peek() != '>' {
		return nil, fmt.Errorf("expected '>' in closing tag")
	}
	p.advance()
	
	return &MarkupTag{Name: tagName}, nil
}

// parseIdentifier parses an identifier (tag name or attribute name)
func (p *MarkupParser) parseIdentifier() string {
	result := &strings.Builder{}
	
	for p.position < len(p.input) {
		ch := p.peek()
		if (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || 
		   (ch >= '0' && ch <= '9') || ch == '-' || ch == '_' {
			result.WriteByte(ch)
			p.advance()
		} else {
			break
		}
	}
	
	return result.String()
}

// parseAttributeValue parses an attribute value (quoted or unquoted)
func (p *MarkupParser) parseAttributeValue() string {
	p.skipWhitespace()
	
	if p.peek() == '"' || p.peek() == '\'' {
		quote := p.peek()
		p.advance()
		
		result := &strings.Builder{}
		for p.position < len(p.input) && p.peek() != quote {
			if p.peek() == '\\' {
				p.advance()
				if p.position < len(p.input) {
					result.WriteByte(p.peek())
					p.advance()
				}
			} else {
				result.WriteByte(p.peek())
				p.advance()
			}
		}
		
		if p.peek() == quote {
			p.advance()
		}
		
		return result.String()
	}
	
	// Unquoted value
	result := &strings.Builder{}
	for p.position < len(p.input) {
		ch := p.peek()
		if ch != '>' && ch != ' ' && ch != '\t' && ch != '\n' && ch != '\r' {
			result.WriteByte(ch)
			p.advance()
		} else {
			break
		}
	}
	
	return result.String()
}

// parseRawCode parses code outside of markup tags
func (p *MarkupParser) parseRawCode() string {
	result := &strings.Builder{}
	
	for p.position < len(p.input) && p.peek() != '<' {
		result.WriteByte(p.peek())
		p.advance()
	}
	
	return strings.TrimSpace(result.String())
}

// Helper methods
func (p *MarkupParser) peek() byte {
	if p.position >= len(p.input) {
		return 0
	}
	return p.input[p.position]
}

func (p *MarkupParser) peekNext() byte {
	if p.position+1 >= len(p.input) {
		return 0
	}
	return p.input[p.position+1]
}

func (p *MarkupParser) advance() {
	if p.position < len(p.input) {
		if p.input[p.position] == '\n' {
			p.line++
			p.column = 1
		} else {
			p.column++
		}
		p.position++
	}
}

func (p *MarkupParser) isWhitespace(ch byte) bool {
	return ch == ' ' || ch == '\t' || ch == '\n' || ch == '\r'
}

func (p *MarkupParser) skipWhitespace() {
	for p.position < len(p.input) && p.isWhitespace(p.peek()) {
		p.advance()
	}
}

// convertEmojisToKeywords converts emoji syntax to keyword equivalents
func (p *MarkupParser) convertEmojisToKeywords(input string) string {
	emojiMap := map[string]string{
		"💾": "var",
		"🔒": "const",
		"📝": "log",
		"🔢": "number",
		"📊": "array",
		"📦": "object",
		"⚡": "function",
		"🔁": "loop",
		"❓": "if",
		"✅": "true",
		"❌": "false",
		"➕": "+",
		"➖": "-",
		"✖️": "*",
		"➗": "/",
	}
	
	result := input
	for emoji, keyword := range emojiMap {
		result = strings.ReplaceAll(result, emoji, keyword)
	}
	
	return result
}

// GetErrors returns all parsing errors
func (p *MarkupParser) GetErrors() []string {
	return p.errors
}

// GetWarnings returns all parsing warnings
func (p *MarkupParser) GetWarnings() []string {
	return p.warnings
}

// indent returns the current indentation string
func (p *MarkupParser) indent() string {
	return strings.Repeat("  ", p.indentLevel)
}

// sanitizeExpression removes dangerous patterns
func (p *MarkupParser) sanitizeExpression(expr string) string {
	// Remove potentially dangerous patterns
	dangerous := []string{
		"eval(",
		"Function(",
		"__proto__",
		"constructor",
	}
	
	result := expr
	for _, pattern := range dangerous {
		if strings.Contains(strings.ToLower(result), strings.ToLower(pattern)) {
			p.warnings = append(p.warnings, fmt.Sprintf("potentially unsafe pattern detected: %s", pattern))
			result = strings.ReplaceAll(result, pattern, "/* UNSAFE: "+pattern+" */")
		}
	}
	
	return result
}

// escapeString properly escapes a string for the target language
func (p *MarkupParser) escapeString(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, "\"", "\\\"")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\r")
	s = strings.ReplaceAll(s, "\t", "\\t")
	return s
}

// validateIdentifier ensures an identifier is valid
func (p *MarkupParser) validateIdentifier(name string) error {
	if name == "" {
		return fmt.Errorf("empty identifier")
	}
	
	if matched, _ := regexp.MatchString("^[a-zA-Z_][a-zA-Z0-9_]*$", name); !matched {
		return fmt.Errorf("invalid identifier: %s", name)
	}
	
	// Check reserved words
	reserved := []string{"if", "else", "for", "while", "function", "return", "const", "let", "var"}
	for _, word := range reserved {
		if name == word {
			return fmt.Errorf("'%s' is a reserved keyword", name)
		}
	}
	
	return nil
}
