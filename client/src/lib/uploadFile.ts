import { toast } from "sonner";

/**
 * Upload a file to S3 via the backend
 * The backend will handle the S3 upload and return the URL
 */
export async function uploadFileToS3(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.url);
          } catch (e) {
            reject(new Error("Invalid response from server"));
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("POST", "/api/upload");
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);
    });
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
