#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs/promises");
var path = require("path");
var commander_1 = require("commander");
var sdk_1 = require("@anthropic-ai/sdk");
var dotenv = require("dotenv");
// Load environment variables from .env file
dotenv.config();
// Initialize Anthropic AI client
var anthropic = new sdk_1.Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
function readGitignore(projectDir) {
    return __awaiter(this, void 0, void 0, function () {
        var gitignorePath, gitignoreContent, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    gitignorePath = path.join(projectDir, '.gitignore');
                    return [4 /*yield*/, fs.readFile(gitignorePath, 'utf-8')];
                case 1:
                    gitignoreContent = _a.sent();
                    return [2 /*return*/, gitignoreContent.split('\n').filter(function (line) { return line.trim() !== '' && !line.startsWith('#'); })];
                case 2:
                    error_1 = _a.sent();
                    console.log('No .gitignore file found. Proceeding without ignored files.');
                    return [2 /*return*/, []];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function isIgnored(filePath, ignoredPatterns) {
    return ignoredPatterns.some(function (pattern) {
        if (pattern.endsWith('/')) {
            return filePath.includes(pattern);
        }
        return filePath.endsWith(pattern) || filePath.includes("/".concat(pattern, "/"));
    });
}
function analyzeDirectory(dir, ignoredPatterns) {
    return __awaiter(this, void 0, void 0, function () {
        var content, entries, _i, entries_1, entry, fullPath, _a, fileContent;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    content = '';
                    return [4 /*yield*/, fs.readdir(dir, { withFileTypes: true })];
                case 1:
                    entries = _b.sent();
                    _i = 0, entries_1 = entries;
                    _b.label = 2;
                case 2:
                    if (!(_i < entries_1.length)) return [3 /*break*/, 7];
                    entry = entries_1[_i];
                    fullPath = path.join(dir, entry.name);
                    if (isIgnored(fullPath, ignoredPatterns)) {
                        console.log("Ignored: ".concat(fullPath));
                        return [3 /*break*/, 6];
                    }
                    if (!entry.isDirectory()) return [3 /*break*/, 4];
                    content += "Directory: ".concat(fullPath, "\n");
                    _a = content;
                    return [4 /*yield*/, analyzeDirectory(fullPath, ignoredPatterns)];
                case 3:
                    content = _a + _b.sent();
                    return [3 /*break*/, 6];
                case 4:
                    if (!entry.isFile()) return [3 /*break*/, 6];
                    content += "File: ".concat(fullPath, "\n");
                    return [4 /*yield*/, fs.readFile(fullPath, 'utf-8')];
                case 5:
                    fileContent = _b.sent();
                    content += "Content:\n".concat(fileContent, "\n\n");
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [2 /*return*/, content];
            }
        });
    });
}
function generateDescription(projectContent) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prompt = "You will be analyzing a folder of files. Each file contains code or other information. You will be creating an application overview describing the entire application.\n\nHere is the project structure and files being analysed:\n<code>\n".concat(projectContent, "\n</code>\n\nBased on that document, create a comprehensive project overview, including\n\n1. Overall purpose and functionality. What does the application do? What are its inputs and outputs?\n2. Application architecture, including language, database, and other components\n3. Folder and file structure tree, with a one-line description of the purpose and contents of each file.\n4. Description of contents of each file. For each file include a description of functions and objects in each file, summarising\n- Name\n- Purpose (what it does in the overall application)\n- How it works\n- Inputs and outputs\n5. Usage an instructions for the application\n6. Potential weaknesses, risks, and areas for improvement.\n\nEnsure your analysis is thorough, accurate, and clear, targeted to someone who may not be familiar with code or application development.");
                    return [4 /*yield*/, anthropic.messages.create({
                            model: "claude-3-sonnet-20240620",
                            max_tokens: 4000,
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
                        })];
                case 1:
                    response = _a.sent();
                    if (response.content[0].type === 'text') {
                        return [2 /*return*/, response.content[0].text];
                    }
                    else {
                        throw new Error('Unexpected response format');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var projectDir, ignoredPatterns, projectContent, timestamp, folderName, contentFileName, description, outputFile, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    commander_1.program
                        .argument('<directory>', 'Project directory to analyze')
                        .parse(process.argv);
                    projectDir = commander_1.program.args[0];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    console.log('Reading .gitignore...');
                    return [4 /*yield*/, readGitignore(projectDir)];
                case 2:
                    ignoredPatterns = _a.sent();
                    console.log('Analyzing project structure...');
                    return [4 /*yield*/, analyzeDirectory(projectDir, ignoredPatterns)];
                case 3:
                    projectContent = _a.sent();
                    timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    folderName = path.basename(projectDir);
                    contentFileName = "content-".concat(folderName, "-").concat(timestamp, ".txt");
                    return [4 /*yield*/, fs.writeFile(contentFileName, projectContent)];
                case 4:
                    _a.sent();
                    console.log("Project content saved to ".concat(contentFileName));
                    console.log('Generating project description...');
                    return [4 /*yield*/, generateDescription(projectContent)];
                case 5:
                    description = _a.sent();
                    console.log('Project Description:');
                    console.log(description);
                    outputFile = path.join(projectDir, 'project_description.md');
                    return [4 /*yield*/, fs.writeFile(outputFile, description)];
                case 6:
                    _a.sent();
                    console.log("Description saved to ".concat(outputFile));
                    return [3 /*break*/, 8];
                case 7:
                    error_2 = _a.sent();
                    console.error('An error occurred:', error_2);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
main();
