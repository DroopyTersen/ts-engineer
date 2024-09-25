import { Form, FormMethod } from "@remix-run/react";

// "btn btn-secondary" or "btn-outline-primary"
interface ExtraProps {
  action?: string;
  /** Defaults to post */
  method?: FormMethod;
  /** Defaults to true */
  replace?: boolean;
}

export type FormButtonProps = React.HTMLProps<HTMLButtonElement> & ExtraProps;

export function FormButton({
  action,
  method = "post",
  replace = true,
  children,
  ...rest
}: FormButtonProps) {
  return (
    <Form action={action} method={method} replace={replace}>
      <button {...(rest as any)}>{children}</button>
    </Form>
  );
}
