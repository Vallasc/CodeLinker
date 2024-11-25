import * as fs from "node:fs";
import * as path from "node:path";
import minimatch from "minimatch";
import { IGNORE_FILE } from "../config";
import { Extension, Language } from "../types";

interface IgnorePattern {
  pattern: string;
  negated: boolean;
}

const extToLanguageMap: { [key in Extension]: Language } = {
  ".js": "JavaScript",
  ".ts": "TypeScript",
  ".java": "Java",
  ".md": "Markdown",
  ".html": "HTML",
};

/**
 * Checks if a file matches any of the specified extensions.
 * @param filePath - The file path to check.
 * @param extensions - The list of allowed extensions.
 * @returns True if the file matches any extension; false otherwise.
 */
const checkExtension = (path: string, extensions: string[]): boolean =>
  extensions.some((ext) => path.toLowerCase().endsWith(ext));

/**
 * Loads ignore patterns from a configuration file (e.g., .gitignore-like file).
 * Filters out comments and empty lines.
 */
const loadIgnorePatterns = async (
  ignoreFile: string
): Promise<IgnorePattern[]> => {
  try {
    const content = await fs.promises.readFile(ignoreFile, "utf-8");
    return content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#")) // Skip comments and empty lines
      .map((pattern) => {
        let outPattern = pattern;
        let negated = false;
        // Remove "!" for negated patterns
        if (pattern.startsWith("!")) {
          outPattern = outPattern.slice(1);
          negated = true;
        }
        if (pattern.endsWith("/")) {
          outPattern = outPattern + "**";
        }
        return {
          pattern: outPattern,
          negated,
        };
      });
  } catch (err) {
    console.warn(
      `Ignore file "${ignoreFile}" not found. Proceeding without ignoring.`
    );
    return [];
  }
};

/**
 * Determines whether a path should be ignored based on the provided ignore patterns.
 * @param itemPath - The path to evaluate.
 * @param ignorePatterns - The list of ignore patterns.
 * @returns True if the path should be ignored; false otherwise.
 */
const shouldIgnore = (
  itemPath: string,
  ignorePatterns: IgnorePattern[]
): boolean => {
  let ignored = false;
  for (const { pattern, negated } of ignorePatterns) {
    if (minimatch(itemPath, pattern, { dot: true })) {
      ignored = !negated; // Apply negation if needed
    }
  }

  return ignored;
};

let ignorePatterns: IgnorePattern[] | null = null;

/**
 * Recursively reads a path (file or directory) and returns a list of files
 * that match the specified extensions, while respecting ignore patterns.
 * @param inputPath - The path to read.
 * @param extensions - The list of file extensions to include.
 * @param ignoreFile - The path to the ignore file (e.g., .gitignore).
 * @returns A promise resolving to a list of matching file paths.
 */
export const readPath = async (
  inputPath: string,
  extensions: string[]
): Promise<string[]> => {
  if (!ignorePatterns) ignorePatterns = await loadIgnorePatterns(IGNORE_FILE);

  const stats = await fs.promises.stat(inputPath);
  let files: string[] = [];

  if (stats.isFile()) {
    // if it is a single file check the extension
    if (
      checkExtension(inputPath, extensions) &&
      !shouldIgnore(inputPath, ignorePatterns)
    )
      files.push(inputPath);
  } else if (stats.isDirectory()) {
    const items = await fs.promises.readdir(inputPath, {
      withFileTypes: true,
    });
    for (const item of items) {
      const itemPath = path.join(inputPath, item.name);
      // Recursively read subdirectories
      files = files.concat(await readPath(itemPath, extensions));
    }
  }
  return files;
};

/**
 * Reads the content of a file.
 *
 * @param filePath - The path to the file to be read.
 * @returns A promise that resolves with the content of the file as a string.
 */
export const readFileAsString = async (filePath: string): Promise<string> => {
  return fs.promises.readFile(filePath, "utf-8");
};

/**
 * Writes content to a file.
 *
 * @param filePath - The path to the file to be written to.
 * @param content - The content to write to the file.
 * @returns A promise that resolves when the file is successfully written.
 */
export const writeFile = (filePath: string, content: string): Promise<void> => {
  return fs.promises.writeFile(filePath, content, "utf-8");
};


export const filePathToExtension = (filePath: string): Extension => {
  return path.extname(filePath).toLowerCase() as Extension;
};

/**
 * Maps a file path to its corresponding programming language based on its extension.
 *
 * @param path - The file path to evaluate.
 * @returns The corresponding programming language.
 * @throws An error if the file extension is not recognized.
 */
export const filePathToLanguage = (path: string): Language => {
  const ext = filePathToExtension(path);
  // Check if the extension exists in the map
  if (!(ext in extToLanguageMap)) {
    return "Unknown";
  }
  return extToLanguageMap[ext as Extension];
};
