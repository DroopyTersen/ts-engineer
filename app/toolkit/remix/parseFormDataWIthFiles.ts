import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";

export interface RemixFile extends File {
  filepath: string;
}

export const parseFormDataWithFiles = async (request: Request) => {
  const uploadHandler = unstable_composeUploadHandlers(
    unstable_createFileUploadHandler({
      maxPartSize: 1_000_000_000,
      avoidFileConflicts: true,
      file: ({ filename }) => filename,
    }),
    // parse everything else into memory
    unstable_createMemoryUploadHandler()
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  let files: Record<string, RemixFile> = {};

  let data: any = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "object") {
      files[key] = value as RemixFile;
    } else {
      data[key] = value;
    }
  }
  return {
    formData: data,
    files,
  };
};
