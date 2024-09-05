# decoder

## Description

Decoder package is a powerful command-line tool designed to analyze and document software projects. It uses AI-powered analysis to generate comprehensive project descriptions, including architecture overviews, key components, and detailed explanations of functions and dependencies. This tool is perfect for developers and architects who need to quickly understand or document complex codebases.

See more about it on my blog [here](https://hooshmand.net/decoder-script-summarise-application/).

## Order of Operation

1. Parses command-line arguments to get the project directory
2. Analyzes the project structure, reading files and creating a content summary
3. Generates a file tree of the project
4. Prompts the user to continue with the analysis
5. Uses AI to generate detailed descriptions of various aspects of the project
6. Saves the generated content and descriptions to files in an 'archive' folder

## Parameters

### Input parameters
- `directory`: (optional) The path to the project directory to analyze. If not provided, the script will display usage instructions.

### Output
The script generates two main outputs:
1. A content file containing the raw project structure and file contents
2. A detailed project description file in Markdown format

Both files are saved in an 'archive' folder with timestamps in their names.

## Usage 

To use the Decoder tool, install it globally via npm:

```bash
npm install -g decoder
```

Then run it from the command line:

```bash
decoder /path/to/your/project
```

The tool will analyze the project and generate detailed documentation.

## Test parameters

Here are some sample parameters for testing:

1. Analyze the current directory:
   ```
   decoder .
   ```

2. Analyze a specific project:
   ```
   decoder /path/to/your/project
   ```

3. Display usage instructions:
   ```
   decoder
   ```