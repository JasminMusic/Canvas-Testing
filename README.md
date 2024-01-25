# Visual Testing and Image Analysis Toolkit

This repository contains a collection of TypeScript files for visual testing and image analysis using various libraries such as @playwright/test, tesseract.js, @google-cloud/vision, and pixelmatch. The toolkit offers a wide range of functionalities including text extraction, logo detection, color comparison, and screenshot comparison.

### Key Features

**Image Label Extraction**: Using Google Cloud Vision API to analyze images and extract labels.

**Color Analysis**: Functions to compare and analyze colors in different formats.

**Text Extraction**: Implements OCR with Google Cloud Vision and Tesseract.js to extract text from images.

**Logo Detection**: Extracts logos from images using Google Cloud Vision API.

**Screenshot Comparison**: Compares screenshots for visual differences using Pixelmatch.

### Getting Started

Prerequisites Node.js TypeScript Google Cloud Vision API access Playwright Test

### Installation

Clone the repository. Install the necessary dependencies: bash Copy code npm install Set up your environment with Google Cloud Vision API credentials.

### Usage Examples

```
import { analyzeElementCornerScreenshots, extractTextWithGoogleVision } from './analyze';
import { rgbToHex, areTheseColorsVisuallyTheSame } from './colors';
import { diffScreenshots, captureScreenshot } from './visual';

// Example: Analyze corner colors of an element
await analyzeElementCornerScreenshots(page, 50, locator, 255, 0, 0);

// Example: Check if two colors are visually the same
const visuallySame = await areTheseColorsVisuallyTheSame('#ff0000', '#fe0000');

// Example: Capture a screenshot
const screenshot = await captureScreenshot(element);

// Example: Diff two screenshots
const numDiffPixels = await diffScreenshots(screenshotA, screenshotB);
Contributing
Contributions are welcome!
```

License This project is licensed under the MIT License.

Disclaimer This project is not officially affiliated with Google Cloud Vision, Tesseract.js, Playwright, or Pixelmatch. These tools and libraries are used under their respective licenses.
