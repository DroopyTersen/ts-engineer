import { describe, expect, it } from "vitest";
import { defineTemplate } from "./defineTemplate";

describe("Template String Type Extractor", () => {
  describe("defineTemplate function", () => {
    it("should correctly format a simple template string", () => {
      const template = defineTemplate("Hello, {name}!");
      const result = template.formatString({ name: "Alice" });
      expect(result).toBe("Hello, Alice!");
    });

    it("should handle multiple variables in a template string", () => {
      const template = defineTemplate(
        "Hello, {name}! Your order #{orderId} will arrive in {eta} minutes."
      );
      const result = template.formatString({
        name: "Bob",
        orderId: "12345",
        eta: "30",
      });
      expect(result).toBe(
        "Hello, Bob! Your order #12345 will arrive in 30 minutes."
      );
    });

    it("should handle repeated variables in a template string", () => {
      const template = defineTemplate(
        "{name} likes {food}. {name} really likes {food}!"
      );
      const result = template.formatString({
        name: "Charlie",
        food: "pizza",
      });
      expect(result).toBe("Charlie likes pizza. Charlie really likes pizza!");
    });

    it("should handle a template string with no variables", () => {
      const template = defineTemplate("This is a static string.");
      const result = template.formatString({});
      expect(result).toBe("This is a static string.");
    });

    it("should handle a template string with variables at the start and end", () => {
      const template = defineTemplate("{greeting} world {punctuation}");
      const result = template.formatString({
        greeting: "Hello",
        punctuation: "!",
      });
      expect(result).toBe("Hello world !");
    });

    it("should handle empty string values for variables", () => {
      const template = defineTemplate("Name: '{name}', Age: '{age}'");
      const result = template.formatString({
        name: "",
        age: "",
      });
      expect(result).toBe("Name: '', Age: ''");
    });

    it("should handle variables with special characters in their values", () => {
      const template = defineTemplate("{message}");
      const result = template.formatString({
        message: "Hello, {world}!",
      });
      expect(result).toBe("Hello, {world}!");
    });

    it("should handle a template string with only one variable", () => {
      const template = defineTemplate("{content}");
      const result = template.formatString({
        content: "This is the entire content.",
      });
      expect(result).toBe("This is the entire content.");
    });

    it("should handle a template string that is multiple lines", () => {
      const template = defineTemplate(`START
{content}
END`);
      const result = template.formatString({
        content: "MIDDLE",
      });
      expect(result).toBe("START\nMIDDLE\nEND");
    });
  });

  describe("Type safety", () => {
    it("should enforce type safety for template parameters", () => {
      const template = defineTemplate("Hello, {name}!");

      // @ts-expect-error
      template.formatString({}); // Missing 'name' parameter

      // @ts-expect-error
      template.formatString({ name: "Alice", extra: "param" }); // Extra parameter

      // This should compile without errors
      template.formatString({ name: "Alice" });
    });

    it("should not allow extra properties in the params object", () => {
      const template = defineTemplate("Hello, {name}!");

      // @ts-expect-error
      template.formatString({ name: "Alice", extra: "unused" });
    });
  });

  describe("Edge cases", () => {
    it("should handle a template string with adjacent variables", () => {
      const template = defineTemplate("Adjacent: {var1}{var2}");
      const result = template.formatString({
        var1: "Hello",
        var2: "World",
      });
      expect(result).toBe("Adjacent: HelloWorld");
    });

    it("should handle a template string with nested curly braces", () => {
      const template = defineTemplate("Nested: { {var} }");
      const result = template.formatString({
        // @ts-expect-error
        var: "content",
      });
      expect(result).toBe("Nested: { content }");
    });

    it("should handle a template string with escaped curly braces", () => {
      const template = defineTemplate("Escaped: \\{{var}\\}");
      const result = template.formatString({
        // @ts-expect-error
        var: "content",
      });
      expect(result).toBe("Escaped: {content}");
    });

    it("should handle very long template strings", () => {
      const longTemplate = defineTemplate(
        "{start}" + "x".repeat(1000) + "{end}"
      );
      const result = longTemplate.formatString({
        start: "Begin",
        end: "Finish",
      });
      expect(result).toBe("Begin" + "x".repeat(1000) + "Finish");
    });

    it("should handle unicode characters in variable names", () => {
      const template = defineTemplate("Unicode: {variablé}");
      const result = template.formatString({
        variablé: "value",
      });
      expect(result).toBe("Unicode: value");
    });
  });

  describe("Multiple template instances", () => {
    it("should allow multiple template instances with different variables", () => {
      const template1 = defineTemplate("Hello, {name}!");
      const template2 = defineTemplate("Goodbye, {person}!");

      const result1 = template1.formatString({ name: "Alice" });
      const result2 = template2.formatString({ person: "Bob" });

      expect(result1).toBe("Hello, Alice!");
      expect(result2).toBe("Goodbye, Bob!");
    });

    it("should not mix up variables between different templates", () => {
      const template1 = defineTemplate("Template1: {var1}");
      const template2 = defineTemplate("Template2: {var2}");

      // @ts-expect-error
      template1.formatString({ var2: "Wrong variable" });

      // @ts-expect-error
      template2.formatString({ var1: "Wrong variable" });

      // Correct usage
      const result1 = template1.formatString({ var1: "Correct" });
      const result2 = template2.formatString({ var2: "Also correct" });

      expect(result1).toBe("Template1: Correct");
      expect(result2).toBe("Template2: Also correct");
    });
  });

  describe("Advanced edge cases", () => {
    it("should handle a template with only variable placeholders", () => {
      const template = defineTemplate("{var1}{var2}{var3}");
      const result = template.formatString({
        var1: "No",
        var2: "Spaces",
        var3: "Here",
      });
      expect(result).toBe("NoSpacesHere");
    });

    it("should handle a template with numeric variable names", () => {
      const template = defineTemplate("{1} + {2} = {result}");
      const result = template.formatString({
        1: "2",
        2: "2",
        result: "4",
      });
      expect(result).toBe("2 + 2 = 4");
    });

    it("should handle a template with very large number of variables", () => {
      const vars = Array.from({ length: 1000 }, (_, i) => `{var${i}}`).join("");
      const template = defineTemplate(vars);
      const params = Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`var${i}`, i.toString()])
      );
      const result = template.formatString(params);
      expect(result).toBe(
        Array.from({ length: 1000 }, (_, i) => i.toString()).join("")
      );
    });

    it("should handle a template with variable names that are JavaScript keywords", () => {
      const template = defineTemplate("{class} {function} {const}");
      const result = template.formatString({
        class: "My",
        function: "Special",
        const: "Template",
      });
      expect(result).toBe("My Special Template");
    });
  });

  describe("Error handling", () => {
    it("should skip a paramaterizing when a variable is missing", () => {
      const template = defineTemplate("Hello, {name}!");
      // @ts-expect-error
      const result = template.formatString({});

      expect(result).toBe("Hello, {name}!");
    });

    it("should handle a template with an unclosed variable", () => {
      const template = defineTemplate("Unclosed: {variable");
      const result = template.formatString({ variable: "value" });
      // Decide how you want to handle this case and adjust the expectation
      expect(result).toBe("Unclosed: {variable");
    });

    it("should handle a template with an unopened variable", () => {
      const template = defineTemplate("Unopened: variable}");
      const result = template.formatString({});
      // Decide how you want to handle this case and adjust the expectation
      expect(result).toBe("Unopened: variable}");
    });
  });

  describe("Performance", () => {
    it("should handle repeated formatting of the same template efficiently", () => {
      const template = defineTemplate("Hello, {name}!");
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        template.formatString({ name: "Alice" });
      }
      const end = performance.now();
      expect(end - start).toBeLessThan(1000); // Adjust threshold as needed
    });
  });

  describe("Internationalization", () => {
    it("should handle non-Latin characters in template and variables", () => {
      const template = defineTemplate(
        "こんにちは、{名前}さん！{年齢}歳ですね。"
      );
      const result = template.formatString({
        名前: "田中",
        年齢: "30",
      });
      expect(result).toBe("こんにちは、田中さん！30歳ですね。");
    });

    it("should handle right-to-left languages", () => {
      const template = defineTemplate("مرحبا {name}! عمرك {age} سنة.");
      const result = template.formatString({
        name: "محمد",
        age: "25",
      });
      expect(result).toBe("مرحبا محمد! عمرك 25 سنة.");
    });
  });

  describe("Security", () => {
    it("should not allow arbitrary code execution through template variables", () => {
      const template = defineTemplate("{dangerousInput}");
      const result = template.formatString({
        dangerousInput: "${alert('XSS')}",
      });
      expect(result).toBe("${alert('XSS')}");
    });
  });
});
