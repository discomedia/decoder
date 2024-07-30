# Decoder

An AI-powered project analysis tool that analyses files on the local directory and creates a project summary.

## Overview

Decoder is a command-line application designed to analyze and describe software projects. It generates comprehensive overviews of project directories, including structure, file contents, and overall architecture.

See more about it on my blog [here](https://hooshmand.net/decoder-script-summarise-application/).

## Features

- Analyzes project directories recursively
- Generates a raw content file of analyzed project files
- Produces a detailed Markdown description of the project
- Utilizes AI for intelligent project analysis

## Installation

1. Ensure you have Node.js installed
2. Clone this repository:
   ```
   git clone https://github.com/yourusername/decoder.git
   ```
3. Navigate to the project directory:
   ```
   cd decoder
   ```
4. Install dependencies:
   ```
   npm install
   ```
5. Create a `.env` file in the root directory and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Usage

1. Build the project:
   ```
   npm run build
   ```
2. Run Decoder:
   ```
   ./dist/decoder.js [path-to-project-directory]
   ```

## Output

Decoder generates two files:

1. `content-[foldername]-[timestamp].txt`: Raw content of analyzed project files
2. `project_description.md`: Detailed project description (created in the analyzed project directory)

## Project Structure

```
decoder/
├── decoder.ts       # Main application logic
├── decoder.js       # Compiled JavaScript version
├── package.json     # Project metadata and dependencies
└── tsconfig.json    # TypeScript configuration
```

## Dependencies

- @anthropic-ai/sdk: AI-powered project analysis
- commander: Command-line argument parsing
- dotenv: Environment variable loading
- TypeScript (dev dependency)

## Contributing

Contributions are welcome! Please feel free to submit a pull request.

## Future Improvements

- Enhance error handling
- Implement configurable file inclusion/exclusion rules
- Improve scalability for large projects
- Add unit tests
- Implement rate limiting for API calls
- Add progress indication for large projects
- Enhance output formatting

## License

[MIT License](LICENSE)

## Contact

For any questions or feedback, please open an issue on this repository.
