import * as fs from 'fs';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { Locator, expect } from '@playwright/test';

// PIXELMATCH VISUAL TESTING

export async function diffScreenshots(
  screenshotA: Buffer,
  screenshotB: Buffer,
  ignoreSizeDifference = false
) {
  const oldPNG = PNG.sync.read(screenshotA);
  const newPNG = PNG.sync.read(screenshotB);

  // If the dimensions are different and we're ignoring size differences, let the test pass.
  if (
    ignoreSizeDifference &&
    (oldPNG.width !== newPNG.width || oldPNG.height !== newPNG.height)
  ) {
    return 2; // Return 2 since we use greater than this will show us that test is passing, Steve don't kill me pls
  }

  const diff = pixelmatch(
    oldPNG.data,
    newPNG.data,
    null,
    oldPNG.width,
    oldPNG.height
  );

  return diff;
}

//Function for taking screenshot
export async function captureScreenshot(element: Locator) {
  const screenshotBuffer = await element.screenshot();
  return screenshotBuffer;
}

/**
 * Function for comparing screenshots
 * @param filename - The filename of the reference screenshot we want to load
 */
export function loadReferenceScreenshot(filename: string): Buffer {
  const pathToScreenshot = `${__dirname}/../reference-screenshots/${filename}`;
  return fs.readFileSync(pathToScreenshot);
}

/**
 * Function for comparing screenshots
 * @param img1 - Image for comparison (usually a screenshot loaded from our reference-screenshots folder)
 * @param img2 - Image for comparison (usually a screenshot taken from the browser)
 * @param threshold - The threshold for the comparison, 0.1 is the default but we usually need to increase it
 */

export function compareScreenshots(
  img1: Buffer,
  img2: Buffer,
  threshold = 0.1
): number {
  const png1 = PNG.sync.read(img1);
  const png2 = PNG.sync.read(img2);

  const { width, height } = png1;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(
    png1.data,
    png2.data,
    diff.data,
    width,
    height,
    { threshold }
  );

  if (numDiffPixels > 0) {
    diff.pack().pipe(fs.createWriteStream('diff.png'));
  }

  return numDiffPixels;
}

// Function for taking element screenshot
export async function takeElementScreenshot(element: Locator) {
  const elementScreenshot = element;
  await expect(elementScreenshot).toHaveScreenshot();
}

// Function for comparing element screenshot
export async function compareElementScreenshot(
  element: Locator,
  filename: string,
  thresholdValue = 0.2 // No type annotation needed
) {
  await expect(element).toHaveScreenshot(filename, {
    threshold: thresholdValue,
  });
}
