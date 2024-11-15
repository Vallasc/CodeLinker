import * as fs from "node:fs";
import * as path from "node:path";
import minimatch from "minimatch";
import { IGNORE_FILE } from "../config";

interface IgnorePattern {
  pattern: string;
  negated: boolean;
}

/**
 * Checks if a file matches any of the specified extensions.
 * @param filePath The file path to check.
 * @param extensions The list of allowed extensions.
 * @returns True if the file matches any extension; false otherwise.
 */
const checkExtension = (path: string, extensions: string[]): boolean =>
  extensions.some((ext) => path.endsWith(ext));

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
        if(pattern.startsWith("!")){
          outPattern = outPattern.slice(1);
          negated = true
        }
        if(pattern.endsWith("/")){
          outPattern = outPattern + "**"
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
 * @param itemPath The path to evaluate.
 * @param ignorePatterns The list of ignore patterns.
 * @returns True if the path should be ignored; false otherwise.
 */
const shouldIgnore = (
  itemPath: string,
  ignorePatterns: IgnorePattern[],
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
 * @param inputPath The path to read.
 * @param extensions The list of file extensions to include.
 * @param ignoreFile The path to the ignore file (e.g., .gitignore).
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
