#!/usr/bin/env node

import { promises as fs } from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import { Anthropic, APIError } from "@anthropic-ai/sdk";
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const AIModel = process.env.AI_MODEL || "claude-3-5-sonnet-20240620";
const maxTokens = parseInt(process.env.MAX_TOKENS || "4000", 10);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const program = new Command();

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sections = [
  { title: "Project Overview", prompt: "provide a high-level overview of the project, its purpose, and main features." },
  { title: "Architecture and Design", prompt: "describe the overall architecture and design patterns used in the project." },
  { title: "Key Components", prompt: "Summarise, identify and explain the key objects, functions, and modules of the project." },
  { title: "Functions and Methods", prompt: "list and explain the main functions and methods of the project, explaining inputs, outputs, and algoritms." },
  { title: "Dependencies and External Libraries", prompt: "list and explain the main dependencies and external libraries used." }
];

/*{ title: "Potential Improvements", prompt: "suggest potential improvements or areas for refactoring." },
{ title: "Deployment and DevOps", prompt: "describe any deployment or DevOps-related configurations or scripts." },
{ title: "Documentation and Comments", prompt: "evaluate the quality and completeness of documentation and code comments." },
{ title: "Testing Strategy", prompt: "describe the testing strategy and coverage, if applicable." },
   { title: "Code Quality and Best Practices", prompt: "evaluate the code quality and adherence to best practices." },
{ title: "Security Considerations", prompt: "identify any security considerations or potential vulnerabilities." }
*/

// New function to check if a file should be included
async function shouldIncludeFile(filePath: string): Promise<boolean> {
  const includedExtensions = [
    '.js', '.mjs', '.ts', '.jsx', '.tsx', '.vue', '.py', '.rb', '.php', '.go', '.java', '.cs', '.cpp', '.h',
    '.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.md', '.txt', '.csv'
  ];
  const excludedFiles = ['.gitignore', 'package-lock.json', 'yarn.lock', 'DS_Store'];
  const excludedDirs = ['.git', '.expo', 'node_modules', 'dist', 'build', 'target', 'out', 'bin', 'Pods', 'Images.xcassets', 'generated', 'util', 'graphql', 'test_data', 'archive', 'input', 'output', 'test', 'ignore'];

  const ext = path.extname(filePath);
  const baseName = path.basename(filePath);
  const dirName = path.dirname(filePath);

  // Check if the file is in an excluded directory
  const pathSegments = filePath.split(path.sep);
  if (pathSegments.some(segment => excludedDirs.includes(segment))) {
    return false;
  }

  // Check if the file is explicitly excluded
  if (excludedFiles.includes(baseName)) {
    return false;
  }

  // Check if it's a directory
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return !excludedDirs.includes(baseName);
    }
  } catch (error) {
    console.error(`Error checking file stats for ${filePath}:`, error);
    return false;
  }

  // Check if the file has an included extension
  return includedExtensions.includes(ext);
}


// Updated analyzeDirectory function
async function analyzeDirectory(dir: string): Promise<{ content: string, fileTree: string }> {
  let content = '';
  let fileTree = '';
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (await shouldIncludeFile(fullPath)) {
      if (entry.isDirectory()) {
        const result = await analyzeDirectory(fullPath);
        content += result.content;
        fileTree += `Directory: ${fullPath}\n${result.fileTree}`;
      } else if (entry.isFile()) {
        content += `File: ${fullPath}\n`;
        fileTree += `File: ${fullPath}\n`;
        const fileContent = await fs.readFile(fullPath, 'utf-8');
        content += `Content:\n${fileContent}\n\n`;
      }
    }
  }

  return { content, fileTree };
}

async function generateDetailedDescription(projectContent: string): Promise<string> {
  let fullDescription = '';
  let remainingTokens = 40000; // Initialize with the max tokens per minute
  let resetTime = new Date().getTime() + 60000; // Initialize with current time + 1 minute

  for (const section of sections) {
    console.log(`Generating section: ${section.title}`);
    
    // Check if we need to wait
    const now = new Date().getTime();
    if (remainingTokens <= 0 || now >= resetTime) {
      const waitTime = Math.max(resetTime - now, 0);
      console.log(`Waiting ${Math.ceil(waitTime / 1000)} seconds for rate limit reset...`);
      for (let i = Math.ceil(waitTime / 1000); i > 0; i--) {
        process.stdout.write(`\rWaiting ${i} seconds...`);
        await wait(1000);
      }
      process.stdout.write('\n');
      remainingTokens = 40000; // Reset to max tokens after waiting
    }

    const prompt = `Analyze the following project content and ${section.prompt}

Here is the project structure and files:
<code>
${projectContent}
</code>

Provide a detailed and comprehensive response for this section. Do not summarize or omit details.`;

    try {
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
        
        // Update remaining tokens based on usage information
        if (response.usage) {
          remainingTokens -= response.usage.output_tokens;
        }

        // Note: We don't have access to the rate limit reset time from the response
        // You might need to implement a separate mechanism to track this
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      if (error instanceof APIError) {
        console.error('API Error:', error.message);
        if (error.status === 429) {
          console.log('Rate limit exceeded. Adjusting wait time...');
          remainingTokens = 0;
          // You might want to implement a backoff strategy here
          resetTime = new Date(Date.now() + 60000).getTime(); // Wait for 1 minute as a simple backoff
        }
      } else {
        console.error('An unexpected error occurred:', error);
      }
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

// New function to prompt the user for input
async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
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
        const { content, fileTree } = await analyzeDirectory(directory);

        const folderName = getActualFolderName(directory);

        const contentFileName = `content-${folderName}-${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
        const contentFilePath = path.join('archive', contentFileName);
        await fs.writeFile(contentFilePath, content);
        console.log(`Project content saved to ${contentFilePath}`);

        // Display the file tree
        console.log('File Tree:');
        console.log(fileTree);

        // Prompt the user to continue or abort
        const userResponse = await promptUser("Do you want to continue with analysis, or abort? (Press Enter to continue, type 'abort' to abort): ");
        if (userResponse.trim().toLowerCase() === 'abort') {
          console.log('Analysis aborted by user.');
          return;
        }

        console.log('Generating detailed project description...');
        const description = await generateDetailedDescription(content);

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