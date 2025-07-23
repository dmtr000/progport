import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string;
}

// Определяем поддерживаемые языки
export const SUPPORTED_LANGUAGES = {
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  java: 'Java',
  cpp: 'C++',
  csharp: 'C#',
  php: 'PHP',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
  kotlin: 'Kotlin',
  swift: 'Swift'
} as const;

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'python',
  theme = 'vs-dark',
  height = '400px'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isScrollingEditor = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      if (!editorRef.current) return;

      const editorElement = editorRef.current.getDomNode();
      if (!editorElement) return;

      const { scrollTop, scrollHeight, clientHeight } = editorElement;
      const isAtTop = scrollTop === 0;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;

      // Если редактор в крайней позиции и скроллим дальше, разрешаем прокрутку страницы
      if ((isAtTop && e.deltaY < 0) || (isAtBottom && e.deltaY > 0)) {
        if (isScrollingEditor) {
          e.preventDefault();
          isScrollingEditor = false;
        }
      } else {
        e.preventDefault();
        isScrollingEditor = true;
        
        // Прокручиваем редактор
        const newScrollTop = scrollTop + e.deltaY;
        editorElement.scrollTop = newScrollTop;

        // Сбрасываем флаг через небольшую задержку
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          isScrollingEditor = false;
        }, 50);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      // Нормализуем переводы строк для Windows
      const normalizedValue = value.replace(/\r\n/g, '\n');
      onChange(normalizedValue);
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 4,
    insertSpaces: true,
    autoIndent: 'advanced' as const,
    formatOnPaste: true,
    formatOnType: true,
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
    autoIndentOnPaste: true,
    wordWrap: 'on' as const,
    wrappingIndent: 'indent' as const,
    detectIndentation: false,
    useTabStops: true,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    suggest: {
      snippetsPreventQuickSuggestions: false
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Регистрируем сниппеты в зависимости от языка
    const registerLanguageSnippets = (lang: string) => {
      const snippets: any = {
        python: [
          {
            label: 'print',
            insertText: 'print(${1:})',
            documentation: 'Print to console'
          },
          {
            label: 'def',
            insertText: 'def ${1:function_name}(${2:parameters}):\n\t${3:pass}',
            documentation: 'Function definition'
          },
          {
            label: 'class',
            insertText: 'class ${1:ClassName}:\n\tdef __init__(self):\n\t\t${2:pass}',
            documentation: 'Class definition'
          }
        ],
        javascript: [
          {
            label: 'console.log',
            insertText: 'console.log(${1:});',
            documentation: 'Log to console'
          },
          {
            label: 'function',
            insertText: 'function ${1:name}(${2:params}) {\n\t${3:}\n}',
            documentation: 'Function definition'
          },
          {
            label: 'class',
            insertText: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3:}\n\t}\n}',
            documentation: 'Class definition'
          }
        ],
        java: [
          {
            label: 'sout',
            insertText: 'System.out.println(${1:});',
            documentation: 'Print to console'
          },
          {
            label: 'class',
            insertText: 'public class ${1:ClassName} {\n\t${2:}\n}',
            documentation: 'Class definition'
          },
          {
            label: 'main',
            insertText: 'public static void main(String[] args) {\n\t${1:}\n}',
            documentation: 'Main method'
          }
        ],
        cpp: [
          {
            label: 'cout',
            insertText: 'std::cout << ${1:} << std::endl;',
            documentation: 'Print to console'
          },
          {
            label: 'class',
            insertText: 'class ${1:ClassName} {\npublic:\n\t${2:}\n};',
            documentation: 'Class definition'
          },
          {
            label: 'main',
            insertText: 'int main() {\n\t${1:}\n\treturn 0;\n}',
            documentation: 'Main function'
          }
        ]
      };

      if (snippets[lang]) {
        monaco.languages.registerCompletionItemProvider(lang, {
          provideCompletionItems: () => {
            return {
              suggestions: snippets[lang].map((snippet: any) => ({
                ...snippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
              }))
            };
          }
        });
      }
    };

    // Регистрируем сниппеты для текущего языка
    registerLanguageSnippets(language);

    // Устанавливаем отступы в зависимости от языка
    const indentationRules = {
      python: 4,
      javascript: 2,
      typescript: 2,
      java: 4,
      cpp: 4,
      csharp: 4,
      php: 4,
      ruby: 2,
      go: 4,
      rust: 4,
      kotlin: 4,
      swift: 4
    };

    editor.getModel()?.updateOptions({
      insertSpaces: true,
      tabSize: indentationRules[language as keyof typeof indentationRules] || 4
    });
  };

  return (
    <div 
      ref={containerRef}
      className="rounded-lg overflow-hidden border border-gray-200"
      style={{ 
        position: 'relative',
        overscrollBehavior: 'contain'
      }}
    >
      <Editor
        height={height}
        defaultLanguage={language}
        language={language}
        theme={theme}
        value={value}
        onChange={handleEditorChange}
        options={editorOptions}
        onMount={handleEditorDidMount}
        className="w-full"
      />
    </div>
  );
};

export default CodeEditor; 