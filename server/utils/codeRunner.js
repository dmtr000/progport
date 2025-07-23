import { fileURLToPath } from 'url';
import { dirname } from 'path';
import childProcess from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class CodeRunner {
  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'code-runner');
    this.initTempDir();
    this.checkCompilers();
  }

  async initTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Error creating temp directory:', error);
    }
  }

  async checkCompilers() {
    this.availableCompilers = {
      python: await this.isCommandAvailable('python --version'),
      javascript: await this.isCommandAvailable('node --version'),
      java: await this.isCommandAvailable('javac -version')
    };
  }

  async isCommandAvailable(command) {
    try {
      await new Promise((resolve, reject) => {
        childProcess.exec(command, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
      return true;
    } catch {
      return false;
    }
  }

  getFileExtension(language) {
    const extensions = {
      python: 'py',
      javascript: 'js',
      java: 'java',
      cpp: 'cpp',
      'c++': 'cpp',
      csharp: 'cs',
      'c#': 'cs',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      kotlin: 'kt',
      swift: 'swift'
    };
    return extensions[language.toLowerCase()] || 'txt';
  }

  getExecutionCommand(language, filePath) {
    const commands = {
      python: {
        cmd: 'python',
        args: [filePath]
      },
      javascript: {
        cmd: 'node',
        args: [filePath]
      },
      java: {
        compile: {
          cmd: 'javac',
          args: [filePath]
        },
        run: {
          cmd: 'java',
          args: ['-cp', path.dirname(filePath), path.basename(filePath, '.java')]
        }
      }
    };
    return commands[language.toLowerCase()];
  }

  prepareCode(code, language) {
    // Функция для экранирования специальных символов в строковых литералах
    const escapeStringLiterals = (code) => {
      let inString = false;
      let stringChar = '';
      let escaped = false;
      let result = '';
      
      for (let i = 0; i < code.length; i++) {
        const char = code[i];
        
        if (escaped) {
          result += char;
          escaped = false;
          continue;
        }
        
        if (char === '\\') {
          escaped = true;
          result += char;
          continue;
        }
        
        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar) {
          inString = false;
        }
        
        result += char;
      }
      
      return result;
    };

    switch (language.toLowerCase()) {
      case 'javascript':
        return `
const console = {
  log: function(...args) {
    process.stdout.write(args.join(' ') + '\\n');
  },
  error: function(...args) {
    process.stderr.write(args.join(' ') + '\\n');
  }
};

try {
  ${escapeStringLiterals(code)}
} catch (error) {
  console.error(error.message);
}`;
      case 'python':
        // Добавляем правильные отступы для Python
        const indentedCode = escapeStringLiterals(code)
          .split('\n')
          .map(line => '    ' + line)  // Добавляем 4 пробела в начало каждой строки
          .join('\n');
        
        return `import sys
import traceback

try:
${indentedCode}
except Exception as e:
    print(traceback.format_exc(), file=sys.stderr)
    sys.exit(1)`;
      case 'java':
        const className = this.extractJavaClassName(code) || 'Main';
        if (!code.includes('public class')) {
          return `
public class ${className} {
    ${escapeStringLiterals(code)}
}`;
        }
        return escapeStringLiterals(code);
      default:
        return escapeStringLiterals(code);
    }
  }

  extractJavaClassName(code) {
    const classMatch = code.match(/public\s+class\s+(\w+)/);
    return classMatch ? classMatch[1] : null;
  }

  async runCode(code, language, input = '') {
    // Проверяем доступность компилятора
    if (!this.availableCompilers[language.toLowerCase()]) {
      throw new Error(`${language} is not available on this system. Please install ${language} and add it to your PATH.`);
    }

    const extension = this.getFileExtension(language);
    const fileName = `${uuidv4()}.${extension}`;
    const filePath = path.join(this.tempDir, fileName);

    try {
      const preparedCode = this.prepareCode(code, language);
      await fs.writeFile(filePath, preparedCode, 'utf8');

      const result = await this.executeCode(filePath, language, input);
      await this.cleanup(filePath, language);

      return result;
    } catch (error) {
      await this.cleanup(filePath, language);
      throw error;
    }
  }

  async cleanup(filePath, language) {
    try {
      await fs.unlink(filePath).catch(() => {});
      if (language.toLowerCase() === 'java') {
        const className = this.extractJavaClassName(await fs.readFile(filePath, 'utf8')) || 'Main';
        await fs.unlink(path.join(path.dirname(filePath), `${className}.class`)).catch(() => {});
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async executeCode(filePath, language, input) {
    return new Promise(async (resolve, reject) => {
      const command = this.getExecutionCommand(language, filePath);
      if (!command) {
        reject(new Error(`Unsupported language: ${language}`));
        return;
      }

      const spawnProcess = (cmd, args) => {
        return new Promise((resolveSpawn, rejectSpawn) => {
          const proc = childProcess.spawn(cmd, args, {
            env: {
              ...process.env,
              PYTHONIOENCODING: 'utf-8',
              PYTHONUNBUFFERED: '1'
            }
          });

          let output = '';
          let errorOutput = '';

          const timeout = setTimeout(() => {
            proc.kill();
            rejectSpawn(new Error('Execution timeout'));
          }, 5000);

          if (input) {
            proc.stdin.write(input);
            proc.stdin.end();
          }

          proc.stdout.on('data', (data) => {
            // Preserve newlines by replacing them with a special marker
            output += data.toString().replace(/\r\n/g, '\n');
          });

          proc.stderr.on('data', (data) => {
            errorOutput += data.toString().replace(/\r\n/g, '\n');
          });

          proc.on('error', (error) => {
            clearTimeout(timeout);
            rejectSpawn(new Error(`Failed to execute: ${error.message}`));
          });

          proc.on('close', (code) => {
            clearTimeout(timeout);
            if (code !== 0) {
              rejectSpawn(new Error(errorOutput || 'Execution failed'));
            } else {
              // Trim only whitespace at the start and end, but preserve newlines in between
              resolveSpawn(output.replace(/^\s+|\s+$/g, ''));
            }
          });
        });
      };

      try {
        if (command.compile) {
          await spawnProcess(command.compile.cmd, command.compile.args);
          const output = await spawnProcess(command.run.cmd, command.run.args);
          resolve(output);
        } else {
          const output = await spawnProcess(command.cmd, command.args);
          resolve(output);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  validateDynamicSum(output) {
    // Разделяем вывод на строки и удаляем пустые строки
    const lines = output.split('\n').filter(line => line.trim() !== '');
    
    // Проверяем, что есть три строки
    if (lines.length !== 3) {
      return {
        passed: false,
        error: 'Программа должна вывести ровно три числа: два слагаемых и их сумму'
      };
    }

    // Пытаемся преобразовать все строки в числа
    try {
      const num1 = parseFloat(lines[0]);
      const num2 = parseFloat(lines[1]);
      const sum = parseFloat(lines[2]);

      // Проверяем, что все значения являются числами
      if (isNaN(num1) || isNaN(num2) || isNaN(sum)) {
        return {
          passed: false,
          error: 'Все выведенные значения должны быть числами'
        };
      }

      // Проверяем правильность суммы
      if (Math.abs((num1 + num2) - sum) < 0.0001) { // Используем погрешность для чисел с плавающей точкой
        return {
          passed: true,
          output: `${num1}\n${num2}\n${sum}`
        };
      } else {
        return {
          passed: false,
          error: `Сумма чисел ${num1} и ${num2} должна быть равна ${num1 + num2}, а не ${sum}`
        };
      }
    } catch (error) {
      return {
        passed: false,
        error: 'Ошибка при обработке чисел: ' + error.message
      };
    }
  }

  async validateTestCases(code, language, testCases) {
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const output = await this.runCode(code, language, testCase.input);
        const passed = output === testCase.expectedOutput;
        results.push({
          passed,
          input: testCase.input,
          output,
          expectedOutput: testCase.expectedOutput,
          description: testCase.description
        });
      } catch (error) {
        results.push({
          passed: false,
          input: testCase.input,
          error: error.message,
          description: testCase.description,
          expectedOutput: testCase.expectedOutput
        });
      }
    }
    
    return results;
  }
}

const codeRunner = new CodeRunner();
export default codeRunner; 