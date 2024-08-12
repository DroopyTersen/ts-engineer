import { describe, expect, it } from "vitest";
import { applyFileEdit } from "./applyFileEdit";
import { FileEdit } from "./applyFileEdit.schema";

describe("applyFileEdit", () => {
  // Test helper function
  function testFileEdit(
    originalContent: string,
    edit: FileEdit,
    expectedContent: string
  ) {
    const result = applyFileEdit(edit, originalContent);
    expect(result).toBe(expectedContent);
  }

  describe("TypeScript (.ts) file operations", () => {
    const tsContent = `
import { useReducer } from 'react';

function Counter() {
  const [count, setCount] = useReducer(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}

export default Counter;
    `.trim();

    it("should insert a comment after import statement", () => {
      const edit: FileEdit = {
        file: "Counter.ts",
        operations: [
          {
            type: "insert",
            pattern: "import.*?;",
            content: "\n// This is a Counter component",
            position: "after",
          },
        ],
      };

      const expected = tsContent.replace(
        "import { useReducer } from 'react';",
        "import { useReducer } from 'react';\n// This is a Counter component"
      );

      testFileEdit(tsContent, edit, expected);
    });

    it("should replace useState with useReducer", () => {
      const edit: FileEdit = {
        file: "Counter.ts",
        operations: [
          {
            type: "replace",
            pattern: "useState",
            content: "useReducer",
          },
        ],
      };

      const expected = tsContent.replace(/useState/g, "useReducer");
      testFileEdit(tsContent, edit, expected);
    });

    it("should delete the export statement", () => {
      const edit: FileEdit = {
        file: "Counter.ts",
        operations: [
          {
            type: "delete",
            pattern: "export default Counter;",
          },
        ],
      };

      const expected = tsContent.replace("export default Counter;", "");
      testFileEdit(tsContent, edit, expected);
    });
  });

  describe("React (.tsx) file operations", () => {
    const tsxContent = `
import React from 'react';

const App: React.FC = React.memo(() => {
  return (
    <div className="app">
      <h1>Hello, World!</h1>
    </div>
  );
});

export default App;
    `.trim();

    it("should wrap the component with a React.memo", () => {
      const edit: FileEdit = {
        file: "App.tsx",
        operations: [
          {
            type: "insert",
            pattern: "const App: React\\.FC = \\(\\) => {",
            content: "React.memo(",
            position: "before",
          },
          {
            type: "insert",
            pattern: "};$",
            content: ");",
            position: "after",
          },
        ],
      };

      const expected = tsxContent.replace(
        /const App: React\.FC = \(\) => {[\s\S]*?};/,
        'const App: React.FC = React.memo(() => {\n  return (\n    <div className="app">\n      <h1>Hello, World!</h1>\n    </div>\n  );\n});'
      );

      testFileEdit(tsxContent, edit, expected);
    });

    it("should append a prop types declaration", () => {
      const edit: FileEdit = {
        file: "App.tsx",
        operations: [
          {
            type: "insert",
            pattern: "$",
            content: "\n\nApp.propTypes = {\n  // Add prop types here\n};",
            position: "after",
          },
        ],
      };

      const expected =
        tsxContent + "\n\nApp.propTypes = {\n  // Add prop types here\n};";
      testFileEdit(tsxContent, edit, expected);
    });
  });

  describe("CSS file operations", () => {
    const cssContent = `
.container {
  max-width: 1200px;
  margin: 0 auto;
}

.button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
}
    `.trim();

    it("should insert a new CSS rule", () => {
      const edit: FileEdit = {
        file: "styles.css",
        operations: [
          {
            type: "insert",
            pattern: "\\.container {[\\s\\S]*?}",
            content: "\n\n.wrapper {\n  padding: 20px;\n}",
            position: "after",
          },
        ],
      };

      const expected = cssContent.replace(
        "}",
        "}\n\n.wrapper {\n  padding: 20px;\n}"
      );

      testFileEdit(cssContent, edit, expected);
    });

    it("should replace a property value", () => {
      const edit: FileEdit = {
        file: "styles.css",
        operations: [
          {
            type: "replace",
            pattern: "max-width: 1200px;",
            content: "max-width: 100%;",
          },
        ],
      };

      const expected = cssContent.replace(
        "max-width: 1200px;",
        "max-width: 100%;"
      );
      testFileEdit(cssContent, edit, expected);
    });
  });

  describe("SCSS file operations", () => {
    const scssContent = `
$primary-color: #007bff;

@mixin button-styles {
  padding: 10px 20px;
  border-radius: 4px;
}

.button {
  background-color: $primary-color;
  color: white;
  @include button-styles;
}
    `.trim();

    it("should prepend a comment", () => {
      const edit: FileEdit = {
        file: "styles.scss",
        operations: [
          {
            type: "insert",
            pattern: "^",
            content: "// Main styles for the application\n\n",
            position: "before",
          },
        ],
      };

      const expected = "// Main styles for the application\n\n" + scssContent;
      testFileEdit(scssContent, edit, expected);
    });
    it("should wrap a mixin with a media query", () => {
      const edit: FileEdit = {
        file: "styles.scss",
        operations: [
          {
            type: "insert",
            pattern: "@mixin button-styles {",
            content: "@media (min-width: 768px) {\n",
            position: "before",
          },
          {
            type: "insert",
            pattern: "@mixin button-styles\\s*{[\\s\\S]*?}",
            content: "\n}",
            position: "after",
          },
        ],
      };

      const expected = `
$primary-color: #007bff;

@media (min-width: 768px) {
@mixin button-styles {
  padding: 10px 20px;
  border-radius: 4px;
}
}

.button {
  background-color: $primary-color;
  color: white;
  @include button-styles;
}
`.trim();

      testFileEdit(scssContent, edit, expected);
    });
  });

  describe("C# file operations", () => {
    const csharpContent = `
using System;

namespace MyApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Hello, World!");
        }
    }
}
    `.trim();

    it("should insert a new method", () => {
      const edit: FileEdit = {
        file: "Program.cs",
        operations: [
          {
            type: "insert",
            pattern:
              "public static void Main\\(string\\[\\] args\\)[\\s\\S]*?}",
            content:
              '\n\n        public static void SayGoodbye()\n        {\n            Console.WriteLine("Goodbye, World!");\n        }',
            position: "after",
          },
        ],
      };

      const expected = csharpContent.replace(
        "}",
        '}\n\n        public static void SayGoodbye()\n        {\n            Console.WriteLine("Goodbye, World!");\n        }'
      );

      testFileEdit(csharpContent, edit, expected);
    });

    it("should replace the namespace", () => {
      const edit: FileEdit = {
        file: "Program.cs",
        operations: [
          {
            type: "replace",
            pattern: "namespace MyApp",
            content: "namespace MyNewApp",
          },
        ],
      };

      const expected = csharpContent.replace(
        "namespace MyApp",
        "namespace MyNewApp"
      );
      testFileEdit(csharpContent, edit, expected);
    });
  });

  describe("Python file operations", () => {
    const pythonContent = `
import random

def generate_random_number():
    return random.randint(1, 100)

if __name__ == "__main__":
    print(f"Random number: {generate_random_number()}")
    `.trim();

    it("should insert a new function", () => {
      const edit: FileEdit = {
        file: "random_generator.py",
        operations: [
          {
            type: "insert",
            pattern:
              "def generate_random_number\\(\\):(?:[\\s\\S]*?)\\n(?=\\s*if __name__)",
            content:
              "\n\ndef generate_random_string(length=10):\n    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=length))\n",
            position: "after",
          },
        ],
      };

      const expected = pythonContent.replace(
        'if __name__ == "__main__":',
        "\ndef generate_random_string(length=10):\n    return ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=length))\n\nif __name__ == \"__main__\":"
      );

      testFileEdit(pythonContent, edit, expected);
    });

    it("should replace the print statement", () => {
      const edit: FileEdit = {
        file: "random_generator.py",
        operations: [
          {
            type: "replace",
            pattern:
              'print\\(f"Random number: {generate_random_number\\(\\)}"\\)',
            content: 'print(f"Generated number: {generate_random_number()}")',
          },
        ],
      };

      const expected = pythonContent.replace(
        'print(f"Random number: {generate_random_number()}")',
        'print(f"Generated number: {generate_random_number()}")'
      );

      testFileEdit(pythonContent, edit, expected);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty content", () => {
      const edit: FileEdit = {
        file: "empty.txt",
        operations: [
          {
            type: "insert",
            pattern: "$",
            content: "Some content",
            position: "after",
          },
        ],
      };

      testFileEdit("", edit, "Some content");
    });

    it("should handle non-matching patterns", () => {
      const content = "Hello, World!";
      const edit: FileEdit = {
        file: "test.txt",
        operations: [
          {
            type: "replace",
            pattern: "Non-existent pattern",
            content: "Replacement",
          },
        ],
      };

      testFileEdit(content, edit, content);
    });

    it("should throw an error for unsupported operation types", () => {
      const content = "Test content";
      const edit: FileEdit = {
        file: "test.txt",
        operations: [
          {
            type: "unsupported" as any,
            pattern: ".*",
            content: "Invalid",
          },
        ],
      };

      expect(() => applyFileEdit(edit, content)).toThrow(
        "Unsupported operation type: unsupported"
      );
    });
  });
});
