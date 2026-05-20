import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { LocalFileSystemStorageProvider } from "./local-fs.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(async (directoryPath) => {
      await rm(directoryPath, { recursive: true, force: true });
    })
  );
});

describe("LocalFileSystemStorageProvider", () => {
  it("upload() schreibt Datei und gibt korrektes Ergebnis zurück", async () => {
    const basePath = await createTemporaryDirectory();
    const provider = new LocalFileSystemStorageProvider(basePath);
    const buffer = Buffer.from("hello itemflow");

    const result = await provider.upload({
      key: "asset-1/image.txt",
      mimeType: "text/plain",
      fileName: "image.txt",
      sizeBytes: buffer.length,
      buffer
    });

    const writtenBuffer = await readFile(join(basePath, "asset-1/image.txt"));

    expect(writtenBuffer.equals(buffer)).toBe(true);
    expect(result).toEqual({
      key: "asset-1/image.txt",
      url: join(basePath, "asset-1/image.txt"),
      sizeBytes: buffer.length
    });
  });

  it("upload() erstellt verschachtelte Verzeichnisse wenn nötig", async () => {
    const basePath = await createTemporaryDirectory();
    const provider = new LocalFileSystemStorageProvider(basePath);

    await provider.upload({
      key: "nested/deep/folder/photo.bin",
      mimeType: "application/octet-stream",
      fileName: "photo.bin",
      sizeBytes: 3,
      buffer: Buffer.from([1, 2, 3])
    });

    await expect(access(join(basePath, "nested/deep/folder/photo.bin"))).resolves.toBeUndefined();
  });

  it("delete() löscht existierende Datei", async () => {
    const basePath = await createTemporaryDirectory();
    const provider = new LocalFileSystemStorageProvider(basePath);
    const key = "delete-me/file.txt";
    const filePath = join(basePath, key);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, "remove me", { encoding: "utf8" });

    await provider.delete(key);

    await expect(access(filePath)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("delete() wirft keinen Fehler bei nicht existierender Datei", async () => {
    const basePath = await createTemporaryDirectory();
    const provider = new LocalFileSystemStorageProvider(basePath);

    await expect(provider.delete("missing/file.txt")).resolves.toBeUndefined();
  });

  it("getUrl() gibt den erwarteten Pfad zurück", async () => {
    const basePath = await createTemporaryDirectory();
    const provider = new LocalFileSystemStorageProvider(basePath);

    expect(provider.getUrl("photos/item.jpg")).toBe(join(basePath, "photos/item.jpg"));
  });
});

async function createTemporaryDirectory(): Promise<string> {
  const directoryPath = await mkdtemp(join(tmpdir(), "itemflow-local-fs-"));

  temporaryDirectories.push(directoryPath);

  return directoryPath;
}
