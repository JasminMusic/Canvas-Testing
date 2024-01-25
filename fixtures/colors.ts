import { diff, rgb_to_lab } from 'color-diff';

function hexToRgb(hex: string) {
  if (hex.length === 4 && hex[0] === '#') {
    //hex shorthand
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }

  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function componentToHex(c: number) {
  const hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
}

export function rgbToHex(r: number, g: number, b: number) {
  return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

/** Return the difference between two hex colors
 *  Anything <= 2 is pretty much visually identical
 */
export async function getColorDifference(colorA: string, colorB: string) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);

  if (!a) {
    throw new Error(`colorA: ${colorA} is not a valid color hex`);
  }

  if (!b) {
    throw new Error(`colorB: ${colorB} is not a valid color hex`);
  }

  return diff(
    rgb_to_lab({ R: a.r, G: a.g, B: a.b }),
    rgb_to_lab({ R: b.r, G: b.g, B: b.b })
  );
}

export async function areTheseColorsVisuallyTheSame(
  colorA: string,
  colorB: string
) {
  const diff = await getColorDifference(colorA, colorB);
  return diff <= 2;
}
