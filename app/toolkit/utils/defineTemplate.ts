type ExtractVariableNames<T extends string> =
  T extends `${string}{${infer Param}}${infer Rest}`
    ? Param | ExtractVariableNames<Rest>
    : never;

type TemplateParams<T extends string> = {
  [K in ExtractVariableNames<T>]: string;
};

export function defineTemplate<T extends string>(template: T) {
  return {
    formatString: (params: TemplateParams<T>): string => {
      return template.replace(
        /\\?{([\w\u00C0-\uFFFF]+)}|\\{|\\}/g,
        (match, key) => {
          if (match === "\\{") return "{";
          if (match === "\\}") return "}";
          if (match.startsWith("\\")) return match.slice(1);
          return params[key as keyof typeof params] ?? match;
        }
      );
    },
  };
}

// // Example usage
// const template =
//   "Hello, {name}! Your order #{orderId} will arrive in {eta} minutes.";
// const templateFormatter = defineTemplate(template);

// // Example
// const result = templateFormatter.formatString({
//   name: "Alice",
//   orderId: "12345",
//   eta: "30",
// });

// console.log(result);
