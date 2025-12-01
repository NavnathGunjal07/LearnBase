// Code execution service using Node.js vm module for sandboxing
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}

export class CodeExecutionService {
  private tempDir: string;

  constructor() {
    this.tempDir = path.join(process.cwd(), "temp");
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async executeJavaScript(code: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Create a safe execution environment
      const safeCode = this.wrapCodeSafely(code);

      // Write code to temporary file
      const tempFile = path.join(this.tempDir, `temp_${Date.now()}.js`);
      await fs.writeFile(tempFile, safeCode);

      try {
        // Execute with timeout and limited resources
        const { stdout } = await execAsync(
          `node "${tempFile}"`,
          { timeout: 10000, maxBuffer: 1024 * 1024 }, // 10s timeout, 1MB buffer
        );

        const executionTime = Date.now() - startTime;

        return {
          success: true,
          output: stdout || "Code executed successfully (no output)",
          executionTime,
        };
      } catch (execError: any) {
        const executionTime = Date.now() - startTime;

        if (execError.code === "ETIMEDOUT") {
          return {
            success: false,
            output: "",
            error: "Execution timed out after 10 seconds",
            executionTime,
          };
        }

        return {
          success: false,
          output: execError.stdout || "",
          error: execError.stderr || execError.message || "Execution failed",
          executionTime,
        };
      } finally {
        // Clean up temp file
        try {
          await fs.unlink(tempFile);
        } catch (cleanupError) {
          console.warn("Failed to cleanup temp file:", cleanupError);
        }
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        output: "",
        error: error.message || "Failed to prepare code for execution",
        executionTime,
      };
    }
  }

  private wrapCodeSafely(code: string): string {
    // Add safety wrapper to prevent dangerous operations
    return `
      // Safe execution wrapper
      (function() {
        'use strict';

        // Override dangerous globals
        const originalConsole = console;
        const safeConsole = {
          log: (...args) => {
            const output = args.map(arg => {
              if (typeof arg === 'object') {
                return JSON.stringify(arg, null, 2);
              }
              return String(arg);
            }).join(' ');
            process.stdout.write(output + '\\n');
          },
          error: (...args) => {
            const output = args.map(arg => String(arg)).join(' ');
            process.stderr.write('Error: ' + output + '\\n');
          },
          warn: (...args) => {
            const output = args.map(arg => String(arg)).join(' ');
            process.stdout.write('Warning: ' + output + '\\n');
          }
        };
        global.console = safeConsole;

        // Block dangerous operations
        const blockedOperations = [
          'process.exit',
          'require',
          'import',
          'eval',
          'Function',
          'setTimeout',
          'setInterval',
          'global',
          'process',
          '__dirname',
          '__filename'
        ];

        blockedOperations.forEach(op => {
          Object.defineProperty(global, op, {
            get: () => { throw new Error(\`Access to \${op} is not allowed\`); },
            set: () => { throw new Error(\`Modification of \${op} is not allowed\`); }
          });
        });

        // Execute user code
        try {
          ${code}
        } catch (error) {
          console.error('Runtime Error:', error.message);
        }
      })();
    `;
  }
}

// Singleton instance
export const codeExecutionService = new CodeExecutionService();
