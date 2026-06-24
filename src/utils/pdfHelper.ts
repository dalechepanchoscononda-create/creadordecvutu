export function oklchToRgb(l: number, c: number, h: number, a: number = 1): string {
  // Convert hue from degrees to radians
  const hRad = (h * Math.PI) / 180;
  const a_val = c * Math.cos(hRad);
  const b_val = c * Math.sin(hRad);

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

export function replaceOklchWithRgb(cssString: string): string {
  if (!cssString || !cssString.includes("oklch")) return cssString;
  const oklchRegex = /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/g;
  return cssString.replace(oklchRegex, (match, lStr, cStr, hStr, aStr) => {
    let l = parseFloat(lStr);
    if (lStr.includes("%")) {
      l /= 100;
    }
    const c = parseFloat(cStr);
    const h = parseFloat(hStr);
    let a = 1;
    if (aStr) {
      a = parseFloat(aStr);
      if (aStr.includes("%")) {
        a /= 100;
      }
    }
    return oklchToRgb(l, c, h, a);
  });
}

export function convertOklchToRgbForElementTree(realEl: any, cloneEl: any) {
  if (!realEl || !cloneEl) return;

  const colorProps = [
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "fill",
    "stroke",
    "box-shadow",
    "text-shadow"
  ];

  if (realEl.nodeType === 1 && cloneEl.nodeType === 1) {
    const computed = window.getComputedStyle(realEl);
    for (const prop of colorProps) {
      const val = computed.getPropertyValue(prop);
      if (val && val.includes("oklch")) {
        const converted = replaceOklchWithRgb(val);
        cloneEl.style.setProperty(prop, converted, "important");
      }
    }

    // Also handle computed style values for custom SVGs if needed
    if (realEl.tagName.toLowerCase() === "svg") {
      const fill = computed.getPropertyValue("fill");
      if (fill && fill.includes("oklch")) {
        cloneEl.setAttribute("fill", replaceOklchWithRgb(fill));
      }
      const stroke = computed.getPropertyValue("stroke");
      if (stroke && stroke.includes("oklch")) {
        cloneEl.setAttribute("stroke", replaceOklchWithRgb(stroke));
      }
    }
  }

  // Handle children recursively
  const realChildren = Array.from(realEl.children || []);
  const cloneChildren = Array.from(cloneEl.children || []);
  for (let i = 0; i < realChildren.length; i++) {
    if (realChildren[i] && cloneChildren[i]) {
      convertOklchToRgbForElementTree(realChildren[i], cloneChildren[i]);
    }
  }
}
