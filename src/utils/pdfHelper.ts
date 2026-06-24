export function oklabToRgb(l: number, a_val: number, b_val: number, a: number = 1): string {
  const l_lms = l + 0.3963377774 * a_val + 0.2158037573 * b_val;
  const m_lms = l - 0.1055613458 * a_val - 0.0638541728 * b_val;
  const s_lms = l - 0.0894841775 * a_val - 1.2914855480 * b_val;

  const l_cube = l_lms * l_lms * l_lms;
  const m_cube = m_lms * m_lms * m_lms;
  const s_cube = s_lms * s_lms * s_lms;

  const r_lin = 4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
  const g_lin = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
  const b_lin = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

  const toSrgb = (x: number) => {
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  };

  const r = Math.max(0, Math.min(255, Math.round(toSrgb(r_lin) * 255)));
  const g = Math.max(0, Math.min(255, Math.round(toSrgb(g_lin) * 255)));
  const b = Math.max(0, Math.min(255, Math.round(toSrgb(b_lin) * 255)));

  if (a === 1) {
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
}

export function oklchToRgb(l: number, c: number, h: number, a: number = 1): string {
  // Convert hue from degrees to radians
  const hRad = (h * Math.PI) / 180;
  const a_val = c * Math.cos(hRad);
  const b_val = c * Math.sin(hRad);
  return oklabToRgb(l, a_val, b_val, a);
}

export function replaceOklchWithRgb(cssString: string): string {
  if (!cssString) return cssString;
  let result = cssString;

  // Pattern matches oklch(L C H) or oklch(L C H / A) or with commas like oklch(L, C, H, A)
  // Supports values like 0.5, 50%, deg, rad, turns, grad, etc.
  if (result.includes("oklch")) {
    const oklchRegex = /oklch\(\s*([^\s,)]+)(?:\s+|,\s*)([^\s,)]+)(?:\s+|,\s*)([^\s,/)]+)(?:\s*[\/,]\s*([^\s)]+))?\s*\)/g;
    result = result.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
      try {
        let l = parseFloat(lStr);
        if (lStr.includes("%")) l /= 100;

        let c = parseFloat(cStr);
        if (cStr.includes("%")) c /= 100;

        let h = parseFloat(hStr);
        if (hStr.includes("rad")) {
          h = (h * 180) / Math.PI;
        } else if (hStr.includes("grad")) {
          h = h * 0.9;
        } else if (hStr.includes("turn")) {
          h = h * 360;
        }

        let a = 1;
        if (aStr) {
          a = parseFloat(aStr);
          if (aStr.includes("%")) a /= 100;
        }

        if (isNaN(l) || isNaN(c) || isNaN(h)) {
          return match;
        }

        return oklchToRgb(l, c, h, a);
      } catch (err) {
        console.warn("Failed parsing oklch:", match, err);
        return match;
      }
    });
  }

  if (result.includes("oklab")) {
    const oklabRegex = /oklab\(\s*([^\s,)]+)(?:\s+|,\s*)([^\s,)]+)(?:\s+|,\s*)([^\s,/)]+)(?:\s*[\/,]\s*([^\s)]+))?\s*\)/g;
    result = result.replace(oklabRegex, (match, lStr, aStrVal, bStrVal, aStr) => {
      try {
        let l = parseFloat(lStr);
        if (lStr.includes("%")) l /= 100;

        let aVal = parseFloat(aStrVal);
        if (aStrVal.includes("%")) aVal /= 100;

        let bVal = parseFloat(bStrVal);
        if (bStrVal.includes("%")) bVal /= 100;

        let a = 1;
        if (aStr) {
          a = parseFloat(aStr);
          if (aStr.includes("%")) a /= 100;
        }

        if (isNaN(l) || isNaN(aVal) || isNaN(bVal)) {
          return match;
        }

        return oklabToRgb(l, aVal, bVal, a);
      } catch (err) {
        console.warn("Failed parsing oklab:", match, err);
        return match;
      }
    });
  }

  return result;
}

export function convertOklchToRgbForElementTree(realEl: any, cloneEl: any) {
  if (!realEl || !cloneEl) return;

  if (realEl.nodeType === 1 && cloneEl.nodeType === 1) {
    try {
      const computed = window.getComputedStyle(realEl);
      // Iterate through all CSS properties returned by computed style
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        const val = computed.getPropertyValue(prop);
        if (val && (val.includes("oklch") || val.includes("oklab"))) {
          const converted = replaceOklchWithRgb(val);
          cloneEl.style.setProperty(prop, converted, "important");
        }
      }
    } catch (e) {
      console.warn("Error mapping computed colors for element:", realEl, e);
    }

    try {
      // Also handle computed style values for custom SVGs if needed
      if (realEl.tagName.toLowerCase() === "svg") {
        const computed = window.getComputedStyle(realEl);
        const fill = computed.getPropertyValue("fill");
        if (fill && (fill.includes("oklch") || fill.includes("oklab"))) {
          cloneEl.setAttribute("fill", replaceOklchWithRgb(fill));
        }
        const stroke = computed.getPropertyValue("stroke");
        if (stroke && (stroke.includes("oklch") || stroke.includes("oklab"))) {
          cloneEl.setAttribute("stroke", replaceOklchWithRgb(stroke));
        }
      }
    } catch (e) {
      console.warn("Error mapping SVG properties for element:", realEl, e);
    }
  }

  // Handle children recursively safely
  try {
    const realChildren = Array.from(realEl.children || []);
    const cloneChildren = Array.from(cloneEl.children || []);
    for (let i = 0; i < realChildren.length; i++) {
      if (realChildren[i] && cloneChildren[i]) {
        convertOklchToRgbForElementTree(realChildren[i], cloneChildren[i]);
      }
    }
  } catch (e) {
    console.warn("Error processing children recursively:", realEl, e);
  }
}
