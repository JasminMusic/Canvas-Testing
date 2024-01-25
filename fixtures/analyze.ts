import { expect, Locator, Page } from '@playwright/test';
import { createWorker } from 'tesseract.js';
import { ImageAnnotatorClient } from '@google-cloud/vision';

import { getColorDifference, rgbToHex } from './colors';

const client = new ImageAnnotatorClient();

// GOOGLE AI VISION API
export interface ImageLabel {
  description: string;
  score: number;
}

/**
 * Analyse the screenshot of an element that we took using the takeScreenshot function
 * @param image - The image to analyze, we can put the takeScreenshot function here
 * @param expectedLabels - The labels we expect to see in the image
 * @param OnlyHighestProbability - If true, we will only check the highest probability label, if false, we will check all labels
 */
export async function extractLabelsFromImage(
  image: Buffer
): Promise<ImageLabel[]> {
  const [result] = await client.labelDetection(image);
  const labels = result.labelAnnotations || [];

  const filteredLabels = labels.filter(
    (label): label is { description: string; score: number } => !!label.score
  );

  filteredLabels.sort((a, b) => b.score - a.score);

  return filteredLabels;
}

/**
 * Extract text description labels of an image
 * @param image - The image to analyze, we can put the takeScreenshot function here
 * @param expectedLabels - The labels we expect to see in the image
 * @param OnlyHighestProbability - If true, we will only check the highest probability label, if false, we will check all labels
 */
export async function assertImageContainsLabels(
  image: Buffer,
  expectedLabels: string[],
  onlyHighestProbability = false
): Promise<void> {
  const labels = await extractLabelsFromImage(image);

  if (onlyHighestProbability) {
    const highestProbabilityLabel = labels[0];
    expect(expectedLabels).toContain(highestProbabilityLabel.description);
  } else {
    const labelDescriptions = labels.map(label => label.description);
    // console.log(labelDescriptions);
    expect(labelDescriptions).toEqual(expect.arrayContaining(expectedLabels));
  }
}

/**
 * Analyse the screenshot of an element that we took using the takeScreenshot function
 * @param size - The size of the corner in pixels
 * @param locator - The locator of the element to take a screenshot of
 * @param R - The red value of the color we want to check
 * @param G - The green value of the color we want to check
 * @param B - The blue value of the color we want to check
 */
export async function analyzeElementCornerScreenshots(
  page: Page,
  size: number,
  locator: Locator,
  R: number,
  G: number,
  B: number
): Promise<void> {
  const cornerSize = size; // in pixels

  // Navigate to a webpage and find the target element
  await locator.waitFor();

  // Get the dimensions and position of the canvas element
  const dimensions = await locator.boundingBox();
  const x = dimensions?.x ?? 0;
  const y = dimensions?.y ?? 0;
  const width = dimensions?.width ?? 0;
  const height = dimensions?.height ?? 0;

  // Define the corner coordinates
  const topLeft = { x, y };
  const topRight = { x: x + width - cornerSize, y };
  const bottomLeft = { x, y: y + height - cornerSize };
  const bottomRight = {
    x: x + width - cornerSize,
    y: y + height - cornerSize,
  };

  // Define the corner screenshot configurations
  const cornerScreenshots = [
    {
      name: 'top-left',
      x: topLeft.x,
      y: topLeft.y,
      width: cornerSize,
      height: cornerSize,
    },
    {
      name: 'top-right',
      x: topRight.x,
      y: topRight.y,
      width: cornerSize,
      height: cornerSize,
    },
    {
      name: 'bottom-left',
      x: bottomLeft.x,
      y: bottomLeft.y,
      width: cornerSize,
      height: cornerSize,
    },
    {
      name: 'bottom-right',
      x: bottomRight.x,
      y: bottomRight.y,
      width: cornerSize,
      height: cornerSize,
    },
  ];

  // Analyze the corner colors using Google Cloud Vision API
  const client = new ImageAnnotatorClient();

  for (const { x, y, width, height } of cornerScreenshots) {
    const cornerScreenshot = await page.screenshot({
      clip: { x, y, width, height },
    });
    const [cornerResult] = await client.imageProperties(cornerScreenshot);
    const cornerColors =
      cornerResult.imagePropertiesAnnotation?.dominantColors?.colors;
    // console.log(`${name} corner colors:`, cornerColors);

    const colorToCheck = cornerColors?.[0].color;

    expect(colorToCheck).not.toBeFalsy();

    const colorDifference = await getColorDifference(
      rgbToHex(R, G, B),
      rgbToHex(
        colorToCheck?.red || 0,
        colorToCheck?.green || 0,
        colorToCheck?.blue || 0
      )
    );

    expect(colorDifference).toBeLessThan(2);
  }
}

/**
 * Extracts the text of an element using google ocr and returns it as a lowercase string array
 *
 * @param element - The selector of the element to take a screenshot of
 */
export async function extractTextWithGoogleVision(element: Locator) {
  await element.waitFor();

  const screenshotBuffer = await element.screenshot();

  const [result] = await client.documentTextDetection({
    image: {
      content: screenshotBuffer.toString('base64'),
    },
  });

  if (!result.fullTextAnnotation?.text) {
    return { text: '', array: [] };
  }

  const lowercase = result.fullTextAnnotation.text.toLowerCase();

  return { text: lowercase, array: lowercase.split('\n') };
}

/**
 * @param locator - The locator of the element to take a screenshot of
 * @param text - The text we expect to see in the image
 * @deprecated - use extractTextWithGoogleVision and check the returned array
 */
export async function ocrWithGoogleVision(
  locator: Locator,
  text: string,
  noText?: boolean
) {
  await locator.waitFor();

  const screenshotBuffer = await locator.screenshot();
  const request = {
    image: {
      content: screenshotBuffer.toString('base64'),
    },
  };
  const [result] = await client.documentTextDetection(request);
  const fullTextAnnotation = result.fullTextAnnotation;

  if (noText) {
    // If noText is true, throw an error if any text is found in the screenshot
    if (fullTextAnnotation && fullTextAnnotation.text) {
      throw new Error(
        `Text detected in the image but noText flag was set. Annotations: ${fullTextAnnotation.text}`
      );
    }
  } else {
    // If noText is false or not provided, throw an error if no text is found in the screenshot
    if (!fullTextAnnotation || !fullTextAnnotation.text) {
      throw new Error('No text detected in the image');
    }
    expect(fullTextAnnotation.text?.toLowerCase()).toContain(
      text.toLowerCase()
    );
  }
}

// This function will detect the dominant color of an element on the page
export async function detectElementDominantColor(
  locator: Locator
): Promise<string> {
  // Capture the element's screenshot
  await locator.waitFor();

  const imageBuffer = await locator.screenshot();

  // Send the image to Google Cloud Vision API
  const [result] = await client.imageProperties({
    image: { content: imageBuffer },
  });

  // Extract the dominant color
  const dominantColor =
    result.imagePropertiesAnnotation?.dominantColors?.colors?.[0];

  if (!dominantColor?.color) {
    throw new Error('Unable to detect dominant color');
  }
  // console.log(dominantColor);
  // Return the dominant color as a HEX string, or null if not found
  return `#${(dominantColor.color?.red ?? 0).toString(16)}${(
    dominantColor.color?.green ?? 0
  ).toString(16)}${(dominantColor.color?.blue ?? 0).toString(16)}`;
}

//TESSERACT OCR
export async function detectTextFromElement(locator: Locator): Promise<string> {
  // Wait for the element to be present on the page
  await locator.waitFor();

  // Take a screenshot of the element
  const screenshot = await locator.screenshot();

  // Initialize the Tesseract.js worker
  const worker = createWorker({
    // logger: (m) => console.log(m),
  });

  // Load the necessary Tesseract.js languages and perform OCR
  await (await worker).load();
  await (await worker).loadLanguage('eng');
  await (await worker).initialize('eng');
  const {
    data: { text },
  } = await (await worker).recognize(screenshot as Buffer);

  // Clean up and return the recognized text
  await (await worker).terminate();
  return text.trim();
}

/**
 * Extract logos from an image
 * @param image - The image buffer to analyze
 */
export async function extractLogosFromImage(
  image: Buffer
): Promise<{ description: string; score: number }[]> {
  const [result] = await client.logoDetection({ image: { content: image } });
  const logos = result.logoAnnotations || [];

  return logos
    .filter(
      logo =>
        logo.description !== null &&
        logo.description !== undefined &&
        logo.score !== null &&
        logo.score !== undefined
    )
    .map(logo => ({
      description: logo.description as string,
      score: logo.score as number,
    }));
}

/**
 * Assert that an image contains specific logos
 * @param image - The image buffer to analyze
 * @param expectedLogos - The logos expected to be found in the image
 */
export async function assertImageContainsLogos(
  image: Buffer,
  expectedLogos: string[]
): Promise<void> {
  const logos = await extractLogosFromImage(image);
  const logoDescriptions = logos.map(logo => logo.description);
  expectedLogos.forEach(expectedLogo => {
    expect(logoDescriptions).toContain(expectedLogo);
  });
}
