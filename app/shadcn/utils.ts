import { type ClassValue, clsx } from "clsx";
import { createElement, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ForwardRefComponent<T extends keyof JSX.IntrinsicElements> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<JSX.IntrinsicElements[T]> & React.RefAttributes<T>
  >;

export function tw<TElementType extends keyof JSX.IntrinsicElements>(
  element: TElementType,
  classNames: string
): ForwardRefComponent<TElementType> {
  // Return a react forward ref component of the specified element
  return forwardRef<any, any>(({ className, ...props }, ref) => {
    return createElement(element, {
      ref,
      className: cn(classNames, className),
      ...props,
    });
  }) as any;
}
