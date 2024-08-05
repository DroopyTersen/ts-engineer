import { json } from "@remix-run/node";
import { ZodError } from "zod";
import { formDataToObject } from "../utils/formDataToObj";

export const tryParseActionError = (err: any, formData: any) => {
  console.log("🚀 | tryParseActionError | err:", err, "tpe", typeof err);
  // check if formData is type FormData and convert to object if so
  let submittedValues = formDataToObject(formData);
  // loop through th error properties and log them
  if ("issues" in err) {
    let zodError = err as ZodError;
    let errors = zodError?.issues?.map((issue) => ({
      path: issue.path.join("."),
      message: `${issue.message}`,
    }));
    let formErrors = errors.reduce((acc: Record<string, string>, error) => {
      acc[error.path] = error.message;
      return acc;
    }, {});
    return json({ errors, submittedValues, formErrors }, { status: 400 });
  }
  let parsedError = tryParseMessage(err);
  if (parsedError) {
    return json({ formErrors: parsedError, submittedValues }, { status: 400 });
  }
  return json(
    {
      errors: [
        {
          path: "root",
          message: err.message,
        },
      ],
      submittedValues,
    },
    { status: 500 }
  );
};

let tryParseMessage = (error: any) => {
  try {
    let parsedError = JSON.parse(error.message);
    return parsedError;
  } catch {
    return null;
  }
};
