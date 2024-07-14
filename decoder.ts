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
  const excludedDirs = ['.git', 'node_modules', 'dist', 'build', 'target', 'out', 'bin', 'Pods', 'Images'];

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

async function generateDetailedDescription(projectContent: string): Promise<string> {
  const sections = [
    {
      title: "1. Overall Purpose and Functionality",
      prompt: "Provide a detailed explanation of what the application does, its main features, and its inputs and outputs. Discuss the problem it solves and its target users."
    },
    {
      title: "2. Application Architecture",
      prompt: "Describe in detail the application's architecture, including languages used, databases, APIs, and other components. Explain how these components interact and any notable design patterns or architectural decisions."
    },
    {
      title: "3. Folder and File Structure",
      prompt: "Create a comprehensive folder and file structure tree. For each file, provide a detailed description of its purpose and contents, including any key classes, functions, or data structures it contains."
    },
    {
      title: "4. Detailed File Analysis",
      prompt: "For each file in the project, provide an in-depth analysis including:\n" +
              "- The file's overall purpose and how it fits into the larger application\n" +
              "- A detailed description of each function, class, and significant code block\n" +
              "- Explanations of algorithms, data structures, and design patterns used\n" +
              "- Any notable optimizations or performance considerations"
    },
    {
      title: "5. Function and Object Deep Dive",
      prompt: "For each function and object in every file, provide an extensive breakdown including:\n" +
              "- Name and signature\n" +
              "- Detailed description of inputs, outputs, and side effects\n" +
              "- Comprehensive explanation of the function/object's purpose and how it contributes to the overall application\n" +
              "- Step-by-step explanation of how the function/object works\n" +
              "- Any edge cases, error handling, or special considerations\n" +
              "- Potential optimizations or alternative implementations"
    },
    {
      title: "6. Usage Instructions",
      prompt: "Provide detailed instructions on how to set up, configure, and use the application. Include any necessary environment setup, dependencies, build processes, and runtime instructions."
    },
    {
      title: "7. Weaknesses, Risks, and Improvements",
      prompt: "Conduct a thorough analysis of potential weaknesses, security risks, and areas for improvement in the application. Suggest specific enhancements, optimizations, or architectural changes that could benefit the project."
    }
  ];

  let fullDescription = '';

  for (const section of sections) {
    console.log(`Generating section: ${section.title}`);
    const prompt = `Analyze the following project content and ${section.prompt}

Here is the project structure and files:
<code>
${projectContent}
</code>

Provide a detailed and comprehensive response for this section. Do not summarize or omit details.`;

    const response = await anthropic.messages.create({
      model: AIModel,
      max_tokens: maxTokens,
      temperature: 0,
      system: "You are a senior software architect with extensive experience in code analysis, documentation, and technical communication. Your task is to provide an in-depth, detailed analysis of software projects, explaining them thoroughly for other senior developers and architects.",
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
      fullDescription += `${section.title}\n\n${response.content[0].text}\n\n`;
    } else {
      throw new Error('Unexpected response format');
    }
  }

  return fullDescription;
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
        await ensureArchiveFolder();

        console.log('Analyzing project structure...');
        const projectContent = await analyzeDirectory(directory);

        const folderName = getActualFolderName(directory);

        const contentFileName = `content-${folderName}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        const contentFilePath = path.join('archive', contentFileName);
        await fs.writeFile(contentFilePath, projectContent);
        console.log(`Project content saved to ${contentFilePath}`);

        console.log('Generating detailed project description...');
        const description = await generateDetailedDescription(projectContent);

        console.log('Detailed Project Description:');
        console.log(description);

        const outputFileName = `${folderName}-detailed-description-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
        const outputFilePath = path.join('archive', outputFileName);
        await fs.writeFile(outputFilePath, description);
        console.log(`Detailed description saved to ${outputFilePath}`);
      } catch (error) {
        console.error('An error occurred:', error);
      }
    });

  await program.parseAsync(process.argv);
}

main();