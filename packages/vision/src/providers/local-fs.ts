import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult
} from "@itemflow/shared";

export class LocalFileSystemStorageProvider implements StorageProvider {
  readonly name = "local-file-system";

  constructor(
    private readonly basePath: string = process.env.STORAGE_LOCAL_PATH ?? "./uploads"
  ) {}

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    if (input.buffer.length === 0) {
      throw new Error(`Cannot upload empty buffer for key "${input.key}".`);
    }

    const filePath = this.getUrl(input.key);
    const directoryPath = dirname(filePath);

    await mkdir(directoryPath, { recursive: true });
    await writeFile(filePath, input.buffer);

    return {
      key: input.key,
      url: filePath,
      sizeBytes: input.buffer.length
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getUrl(key);

    try {
      await unlink(filePath);
    } catch (error) {
      if (!isEnoentError(error)) {
        throw error;
      }
    }
  }

  getUrl(key: string): string {
    return join(this.basePath, key);
  }
}

function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
