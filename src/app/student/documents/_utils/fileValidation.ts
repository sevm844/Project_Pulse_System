const allowedExtensions = [".pdf", ".doc", ".docx"];
const maxFileSize = 10 * 1024 * 1024;

export function validateDocumentFile(file: File | null | undefined) {
  if (!file) {
    return "Please select a file before uploading.";
  }

  const fileName = file.name.toLowerCase();
  const hasValidExtension = allowedExtensions.some((extension) =>
    fileName.endsWith(extension),
  );

  if (!hasValidExtension) {
    return "Invalid file type. Only PDF, DOC, and DOCX files are allowed.";
  }

  if (file.size > maxFileSize) {
    return "File is too large. Maximum file size is 10MB.";
  }

  return "";
}
