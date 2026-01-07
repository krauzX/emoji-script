package transpiler

import (
	"fmt"
	"strings"
)

// transpileTag transpiles a single markup tag to the target language
func (p *MarkupParser) transpileTag(tag *MarkupTag) string {
	if tag == nil {
		return ""
	}

	switch strings.ToLower(tag.Name) {
	case "print", "log", "console":
		return p.transpilePrint(tag)
	case "var", "let", "const", "variable":
		return p.transpileVariable(tag)
	case "function", "func", "fn":
		return p.transpileFunction(tag)
	case "loop", "for", "foreach", "repeat":
		return p.transpileLoop(tag)
	case "while":
		return p.transpileWhile(tag)
	case "if", "condition":
		return p.transpileIf(tag)
	case "else":
		return p.transpileElse(tag)
	case "extend", "class":
		return p.transpileClass(tag)
	case "method":
		return p.transpileMethod(tag)
	case "import", "require", "use":
		return p.transpileImport(tag)
	case "export":
		return p.transpileExport(tag)
	case "return":
		return p.transpileReturn(tag)
	case "array", "list":
		return p.transpileArray(tag)
	case "object", "dict", "map":
		return p.transpileObject(tag)
	case "try":
		return p.transpileTry(tag)
	case "catch":
		return p.transpileCatch(tag)
	case "comment":
		return p.transpileComment(tag)
	case "async":
		return p.transpileAsync(tag)
	case "await":
		return p.transpileAwait(tag)
	case "switch", "match":
		return p.transpileSwitch(tag)
	case "case":
		return p.transpileCase(tag)
	case "break":
		return p.transpileBreak(tag)
	case "continue":
		return p.transpileContinue(tag)
	default:
		p.warnings = append(p.warnings, fmt.Sprintf("unknown tag: <%s>", tag.Name))
		return fmt.Sprintf("/* Unknown tag: <%s> */\n%s", tag.Name, tag.Content)
	}
}

// transpilePrint handles <print>, <log>, <console> tags
func (p *MarkupParser) transpilePrint(tag *MarkupTag) string {
	content := strings.TrimSpace(tag.Content)
	
	return fmt.Sprintf("%sconsole.log(%s);", p.indent(), content)
}

// transpileVariable handles <var>, <let>, <const> tags
func (p *MarkupParser) transpileVariable(tag *MarkupTag) string {
	name := tag.Attributes["name"]
	value := tag.Attributes["value"]
	varType := tag.Attributes["type"]
	
	if name == "" && tag.Content != "" {
		// Try to parse from content: name = value
		parts := strings.SplitN(tag.Content, "=", 2)
		if len(parts) == 2 {
			name = strings.TrimSpace(parts[0])
			value = strings.TrimSpace(parts[1])
		}
	}
	
	if err := p.validateIdentifier(name); err != nil {
		p.errors = append(p.errors, err.Error())
		return fmt.Sprintf("/* Invalid variable: %s */", err.Error())
	}
	
	p.scopeVars[name] = true
	
	keyword := "let"
	if tag.Name == "const" {
		keyword = "const"
	} else if tag.Name == "var" {
		keyword = "var"
	}
	
	switch p.targetLang {
	case "typescript":
		if varType != "" {
			return fmt.Sprintf("%s%s %s: %s = %s;", p.indent(), keyword, name, varType, value)
		}
		return fmt.Sprintf("%s%s %s = %s;", p.indent(), keyword, name, value)
	default:
		return fmt.Sprintf("%s%s %s = %s;", p.indent(), keyword, name, value)
	}
}

// transpileFunction handles <function>, <func>, <fn> tags
func (p *MarkupParser) transpileFunction(tag *MarkupTag) string {
	name := tag.Attributes["name"]
	params := tag.Attributes["params"]
	returnType := tag.Attributes["returns"]
	async := tag.Attributes["async"] == "true"
	
	if err := p.validateIdentifier(name); err != nil {
		p.errors = append(p.errors, fmt.Sprintf("invalid function name: %s", err.Error()))
		return fmt.Sprintf("/* Invalid function: %s */", err.Error())
	}
	
	body := strings.TrimSpace(tag.Content)
	
	switch p.targetLang {
	case "typescript":
		asyncKeyword := ""
		if async {
			asyncKeyword = "async "
		}
		if returnType != "" {
			return fmt.Sprintf("%s%sfunction %s(%s): %s {\n%s\n%s}", 
				p.indent(), asyncKeyword, name, params, returnType, p.indentBlock(body), p.indent())
		}
		return fmt.Sprintf("%s%sfunction %s(%s) {\n%s\n%s}", 
			p.indent(), asyncKeyword, name, params, p.indentBlock(body), p.indent())
	default:
		asyncKeyword := ""
		if async {
			asyncKeyword = "async "
		}
		return fmt.Sprintf("%s%sfunction %s(%s) {\n%s\n%s}", 
			p.indent(), asyncKeyword, name, params, p.indentBlock(body), p.indent())
	}
}

// transpileLoop handles <loop>, <for>, <foreach>, <repeat> tags
func (p *MarkupParser) transpileLoop(tag *MarkupTag) string {
	variable := tag.Attributes["var"]
	from := tag.Attributes["from"]
	to := tag.Attributes["to"]
	step := tag.Attributes["step"]
	items := tag.Attributes["in"]
	times := tag.Attributes["times"]
	
	body := strings.TrimSpace(tag.Content)
	
	// Default step is 1
	if step == "" {
		step = "1"
	}
	
	switch p.targetLang {
	case "typescript", "javascript":
		if items != "" {
			// for...of loop
			if variable == "" {
				variable = "item"
			}
			return fmt.Sprintf("%sfor (const %s of %s) {\n%s\n%s}", 
				p.indent(), variable, items, p.indentBlock(body), p.indent())
		} else if times != "" {
			// repeat n times
			if variable == "" {
				variable = "i"
			}
			return fmt.Sprintf("%sfor (let %s = 0; %s < %s; %s++) {\n%s\n%s}", 
				p.indent(), variable, variable, times, variable, p.indentBlock(body), p.indent())
		} else if from != "" && to != "" {
			// range loop
			if variable == "" {
				variable = "i"
			}
			return fmt.Sprintf("%sfor (let %s = %s; %s < %s; %s += %s) {\n%s\n%s}", 
				p.indent(), variable, from, variable, to, variable, step, p.indentBlock(body), p.indent())
		}
		return fmt.Sprintf("%s/* Invalid loop configuration */", p.indent())
	
	default:
		// Default to JavaScript/TypeScript
		if items != "" {
			if variable == "" {
				variable = "item"
			}
			return fmt.Sprintf("%sfor (const %s of %s) {\n%s\n%s}", 
				p.indent(), variable, items, p.indentBlock(body), p.indent())
		} else if times != "" {
			if variable == "" {
				variable = "i"
			}
			return fmt.Sprintf("%sfor (let %s = 0; %s < %s; %s++) {\n%s\n%s}", 
				p.indent(), variable, variable, times, variable, p.indentBlock(body), p.indent())
		} else if from != "" && to != "" {
			if variable == "" {
				variable = "i"
			}
			return fmt.Sprintf("%sfor (let %s = %s; %s < %s; %s += %s) {\n%s\n%s}", 
				p.indent(), variable, from, variable, to, variable, step, p.indentBlock(body), p.indent())
		}
		return fmt.Sprintf("%s/* Invalid loop configuration */", p.indent())
	}
}

// transpileWhile handles <while> tags
func (p *MarkupParser) transpileWhile(tag *MarkupTag) string {
	condition := tag.Attributes["condition"]
	if condition == "" {
		condition = "true"
	}
	
	body := strings.TrimSpace(tag.Content)
	
	return fmt.Sprintf("%swhile (%s) {\n%s\n%s}", 
		p.indent(), condition, p.indentBlock(body), p.indent())
}

// transpileIf handles <if>, <condition> tags
func (p *MarkupParser) transpileIf(tag *MarkupTag) string {
	condition := tag.Attributes["condition"]
	if condition == "" && tag.Content != "" {
		// Try to extract condition from content
		parts := strings.SplitN(tag.Content, "\n", 2)
		if len(parts) > 0 {
			condition = strings.TrimSpace(parts[0])
		}
	}
	
	body := strings.TrimSpace(tag.Content)
	
	return fmt.Sprintf("%sif (%s) {\n%s\n%s}", 
		p.indent(), condition, p.indentBlock(body), p.indent())
}

// transpileElse handles <else> tags
func (p *MarkupParser) transpileElse(tag *MarkupTag) string {
	body := strings.TrimSpace(tag.Content)
	
	return fmt.Sprintf("%selse {\n%s\n%s}", 
		p.indent(), p.indentBlock(body), p.indent())
}

// transpileClass handles <extend>, <class> tags
func (p *MarkupParser) transpileClass(tag *MarkupTag) string {
	name := tag.Attributes["name"]
	extends := tag.Attributes["extends"]
	
	if err := p.validateIdentifier(name); err != nil {
		p.errors = append(p.errors, fmt.Sprintf("invalid class name: %s", err.Error()))
		return fmt.Sprintf("/* Invalid class: %s */", err.Error())
	}
	
	body := strings.TrimSpace(tag.Content)
	
	if extends != "" {
		return fmt.Sprintf("%sclass %s extends %s {\n%s\n%s}", 
			p.indent(), name, extends, p.indentBlock(body), p.indent())
	}
	return fmt.Sprintf("%sclass %s {\n%s\n%s}", 
		p.indent(), name, p.indentBlock(body), p.indent())
}

// transpileMethod handles <method> tags
func (p *MarkupParser) transpileMethod(tag *MarkupTag) string {
	name := tag.Attributes["name"]
	params := tag.Attributes["params"]
	returnType := tag.Attributes["returns"]
	static := tag.Attributes["static"] == "true"
	
	body := strings.TrimSpace(tag.Content)
	
	staticKeyword := ""
	if static {
		staticKeyword = "static "
	}
	
	if p.targetLang == "typescript" && returnType != "" {
		return fmt.Sprintf("%s%s%s(%s): %s {\n%s\n%s}", 
			p.indent(), staticKeyword, name, params, returnType, p.indentBlock(body), p.indent())
	}
	
	return fmt.Sprintf("%s%s%s(%s) {\n%s\n%s}", 
		p.indent(), staticKeyword, name, params, p.indentBlock(body), p.indent())
}

// indentBlock adds indentation to each line in a block
func (p *MarkupParser) indentBlock(block string) string {
	lines := strings.Split(block, "\n")
	indented := make([]string, len(lines))
	
	p.indentLevel++
	indent := p.indent()
	p.indentLevel--
	
	for i, line := range lines {
		if strings.TrimSpace(line) != "" {
			indented[i] = indent + line
		} else {
			indented[i] = ""
		}
	}
	
	return strings.Join(indented, "\n")
}

// Additional transpilation methods continue...
func (p *MarkupParser) transpileImport(tag *MarkupTag) string {
	module := tag.Attributes["from"]
	items := tag.Attributes["items"]
	
	if items != "" {
		return fmt.Sprintf("%simport { %s } from '%s';", p.indent(), items, module)
	}
	return fmt.Sprintf("%simport '%s';", p.indent(), module)
}

func (p *MarkupParser) transpileExport(tag *MarkupTag) string {
	name := tag.Attributes["name"]
	isDefault := tag.Attributes["default"] == "true"
	
	body := strings.TrimSpace(tag.Content)
	
	if isDefault {
		return fmt.Sprintf("%sexport default %s", p.indent(), body)
	}
	if name != "" {
		return fmt.Sprintf("%sexport const %s = %s;", p.indent(), name, body)
	}
	return fmt.Sprintf("%sexport %s", p.indent(), body)
}

func (p *MarkupParser) transpileReturn(tag *MarkupTag) string {
	value := strings.TrimSpace(tag.Content)
	if value == "" {
		value = tag.Attributes["value"]
	}
	
	return fmt.Sprintf("%sreturn %s;", p.indent(), value)
}

func (p *MarkupParser) transpileArray(tag *MarkupTag) string {
	items := tag.Attributes["items"]
	return fmt.Sprintf("[%s]", items)
}

func (p *MarkupParser) transpileObject(tag *MarkupTag) string {
	content := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("{ %s }", content)
}

func (p *MarkupParser) transpileTry(tag *MarkupTag) string {
	body := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%stry {\n%s\n%s}", p.indent(), p.indentBlock(body), p.indent())
}

func (p *MarkupParser) transpileCatch(tag *MarkupTag) string {
	errorVar := tag.Attributes["error"]
	if errorVar == "" {
		errorVar = "e"
	}
	
	body := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%scatch (%s) {\n%s\n%s}", p.indent(), errorVar, p.indentBlock(body), p.indent())
}

func (p *MarkupParser) transpileComment(tag *MarkupTag) string {
	content := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%s// %s", p.indent(), content)
}

func (p *MarkupParser) transpileAsync(tag *MarkupTag) string {
	body := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%sasync () => {\n%s\n%s}", p.indent(), p.indentBlock(body), p.indent())
}

func (p *MarkupParser) transpileAwait(tag *MarkupTag) string {
	expression := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%sawait %s", p.indent(), expression)
}

func (p *MarkupParser) transpileSwitch(tag *MarkupTag) string {
	expression := tag.Attributes["on"]
	body := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%sswitch (%s) {\n%s\n%s}", p.indent(), expression, p.indentBlock(body), p.indent())
}

func (p *MarkupParser) transpileCase(tag *MarkupTag) string {
	value := tag.Attributes["value"]
	body := strings.TrimSpace(tag.Content)
	return fmt.Sprintf("%scase %s:\n%s", p.indent(), value, p.indentBlock(body))
}

func (p *MarkupParser) transpileBreak(tag *MarkupTag) string {
	return fmt.Sprintf("%sbreak;", p.indent())
}

func (p *MarkupParser) transpileContinue(tag *MarkupTag) string {
	return fmt.Sprintf("%scontinue;", p.indent())
}
