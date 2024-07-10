#!/usr/bin/env node

import { promises as fs } from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { Anthropic } from "@anthropic-ai/sdk";
import dotenv from 'dotenv';

dotenv.config();

const AIModel = process.env.AI_MODEL || "claude-3-5-sonnet-20240620";
const maxTokens = parseInt(process.env.MAX_TOKENS || "4000", 10);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const program = new Command();

// New function to check if a file should be included
async function shouldIncludeFile(filePath: string): Promise<boolean> {
  const includedExtensions = [
    '.js', '.ts', '.jsx', '.tsx', '.vue', '.py', '.rb', '.php', '.go', '.java', '.cs', '.cpp', '.h',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.md', '.txt', '.csv'
  ];
  const excludedFiles = ['.gitignore', 'package-lock.json', 'yarn.lock'];
  const excludedDirs = ['.git', 'node_modules', 'dist', 'build', 'target', 'out', 'bin'];

  const ext = path.extname(filePath);
  const baseName = path.basename(filePath);
  const dirName = path.dirname(filePath);

  // Check if the file is in an excluded directory
  if (excludedDirs.some(dir => dirName.includes(dir))) {
    return false;
  }

  // Check if the file is explicitly excluded
  if (excludedFiles.includes(baseName) || baseName === '.DS_Store') {
    return false;
  }

  // Check if the file has an included extension
  return includedExtensions.includes(ext);
}

// Updated analyzeDirectory function
async function analyzeDirectory(dir: string): Promise<string> {
  let content = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      content += await analyzeDirectory(fullPath);
    } else if (entry.isFile() && await shouldIncludeFile(fullPath)) {
      content += `File: ${fullPath}\n`;
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      content += `Content:\n${fileContent}\n\n`;
    }
  }

  return content;
}

async function generateDescription(projectContent: string): Promise<string> {
  const prompt = `You will be analyzing a folder of files. Each file contains code or other information. You will be creating an application overview describing the entire application.

Here is the project structure and files being analysed:
<code>
${projectContent}
</code>

Based on that document, create a comprehensive project overview, including

1. Overall purpose and functionality. What does the application do? What are its inputs and outputs?
2. Application architecture, including language, database, and other components
3. Folder and file structure tree, with a one-line description of the purpose and contents of each file.
4. Description of contents of each file. For each file include a description of functions and objects in each file, summarising
- Name
- Purpose (what it does in the overall application)
- How it works
- Inputs and outputs
5. Usage an instructions for the application
6. Potential weaknesses, risks, and areas for improvement.

Ensure your analysis is thorough, accurate, and clear, targeted to someone who may not be familiar with code or application development.`;

  const response = await anthropic.messages.create({
    model: AIModel,
    max_tokens: maxTokens,
    temperature: 0,
    system: "You are a software engineering manager, experienced in both coding, documentation, and communication. You are an expert in understanding software projects and code and explaining them in human terms for other software engineering managers and executive teams.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  });

  if (response.content[0].type === 'text') {
    return response.content[0].text;
  } else {
    throw new Error('Unexpected response format');
  }
}

// New function to create the archive folder if it doesn't exist
async function ensureArchiveFolder(): Promise<void> {
  const archivePath = path.join(process.cwd(), 'archive');
  try {
    await fs.access(archivePath);
  } catch (error) {
    await fs.mkdir(archivePath);
  }
}

// New function to get the actual folder name
function getActualFolderName(directory: string): string {
  const resolvedPath = path.resolve(directory);
  return path.basename(resolvedPath);
}

async function main() {
  program
    .argument('[directory]', 'Project directory to analyze')
    .action(async (directory) => {
      if (!directory) {
        console.log("Usage: ./decoder [folder-to-analyse]");
        return;
      }

      try {
        // Ensure the archive folder exists
        await ensureArchiveFolder();

        console.log('Analyzing project structure...');
        const projectContent = await analyzeDirectory(directory);

        // Get the actual folder name
        const folderName = getActualFolderName(directory);

        // Save content to a file in the archive folder
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const contentFileName = `content-${folderName}-${timestamp}.txt`;
        const contentFilePath = path.join('archive', contentFileName);
        await fs.writeFile(contentFilePath, projectContent);
        console.log(`Project content saved to ${contentFilePath}`);

        console.log('Generating project description...');
        const description = await generateDescription(projectContent);

        console.log('Project Description:');
        console.log(description);

        // Save description to a file in the archive folder
        const outputFileName = `${folderName}-decoder-description-${timestamp}.md`;
        const outputFilePath = path.join('archive', outputFileName);
        await fs.writeFile(outputFilePath, description);
        console.log(`Description saved to ${outputFilePath}`);
      } catch (error) {
        console.error('An error occurred:', error);
      }
    });

  await program.parseAsync(process.argv);
}

main();