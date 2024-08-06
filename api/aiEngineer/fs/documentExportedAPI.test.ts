import { describe, expect, it } from "vitest";
import { documentExportedAPI } from "./documentExportedAPI";

describe.only("TypeScript API Documentation Generator", () => {
  it("should document a simple function", () => {
    const input = `
      /**
       * Adds two numbers.
       */
      export function add(a: number, b: number): number {
        return a + b;
      }
    `;
    const result = documentExportedAPI(input, "simple-function.ts");
    expect(result).toContain("function add(a: number, b: number): number");
  });

  it("should document an interface", () => {
    const input = `
/**
 * Represents a point in 2D space.
 */
export interface Point {
  x: number;
  y: number;
}
    `;
    const result = documentExportedAPI(input, "simple-interface.ts");
    expect(result).toContain("interface Point");
    expect(result).toContain("x: number;");
    expect(result).toContain("y: number;");
  });

  it("should document a generic class", () => {
    const input = `
      /**
       * A generic stack implementation.
       */
      export class Stack<T> {
        private items: T[] = [];

        push(item: T): void {
          this.items.push(item);
        }

        pop(): T | undefined {
          return this.items.pop();
        }
      }
    `;
    const result = documentExportedAPI(input, "generic-class.ts");
    expect(result).toContain("class Stack<T>");
    expect(result).toContain("push(item: T): void;");
    expect(result).toContain("pop(): T | undefined;");
    expect(result).not.toContain("private items: T[] = [];");
  });

  it("should document a type alias", () => {
    const input = `
      /**
       * Represents a numeric ID.
       */
      export type ID = number;
    `;
    const result = documentExportedAPI(input, "type-alias.ts");
    expect(result).toContain("type ID = number");
  });

  it("should document an enum", () => {
    const input = `
      /**
       * Represents different types of vehicles.
       */
      export enum VehicleType {
        Car,
        Truck,
        Motorcycle
      }
    `;
    const result = documentExportedAPI(input, "enum.ts");
    expect(result).toContain("enum VehicleType");
    expect(result).toContain("Car,");
    expect(result).toContain("Truck,");
    expect(result).toContain("Motorcycle");
  });

  it("should document a const variable", () => {
    const input = `
      /**
       * The maximum number of retries.
       */
      export const MAX_RETRIES = 3;
    `;
    const result = documentExportedAPI(input, "const-variable.ts");
    expect(result).toContain("MAX_RETRIES = 3");
  });

  it("should document an arrow function", () => {
    const input = `
      /**
       * Multiplies a number by two.
       */
      export const double = (x: number): number => x * 2;
    `;
    const result = documentExportedAPI(input, "arrow-function.ts");
    expect(result).toContain("double = function(x: number): number");
  });

  it("should document a React functional component", () => {
    const input = `
      import React from 'react';

      /**
       * Props for the Greeting component.
       */
      export interface GreetingProps {
        name: string;
      }

      /**
       * A simple greeting component.
       */
      export const Greeting: React.FC<GreetingProps> = ({ name }) => {
        return <h1>Hello, {name}!</h1>;
      };
    `;
    const result = documentExportedAPI(input, "react-component.tsx");
    expect(result).toContain("interface GreetingProps");
    expect(result).toContain("name: string;");
    expect(result).toContain("Greeting: React.FC<GreetingProps>");
  });

  it("should document a namespace", () => {
    const input = `
      /**
       * Utility functions for string manipulation.
       */
      export namespace StringUtils {
        export function capitalize(s: string): string {
          return s.charAt(0).toUpperCase() + s.slice(1);
        }
      }
    `;
    const result = documentExportedAPI(input, "namespace.ts");
    expect(result).toContain("namespace StringUtils");
    expect(result).toContain("function capitalize(s: string): string");
  });

  it("should handle multiple exports", () => {
    const input = `
      export const A = 1;
      export let B = 2;
      export function C() {}
      export interface D {}
      export type E = number;
      export enum F {}
      export class G {}
    `;
    const result = documentExportedAPI(input, "multiple-exports.ts");
    expect(result).toContain("A = 1");
    expect(result).toContain("B = 2");
    expect(result).toContain("function C()");
    expect(result).toContain("interface D");
    expect(result).toContain("type E = number");
    expect(result).toContain("enum F");
    expect(result).toContain("class G");
  });

  it("should not document non-exported items", () => {
    const input = `
      const A = 1;
      function B() {}
      export const C = 2;
    `;
    const result = documentExportedAPI(input, "non-exported.ts");
    expect(result).not.toContain("A = 1");
    expect(result).not.toContain("function B()");
    expect(result).toContain("C = 2");
  });
});
