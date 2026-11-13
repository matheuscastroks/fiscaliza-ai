function countDesignAdditions(text) {
  return {
    radiusLiterals: (text.match(/border\w*Radius:\s*[1-9]\d*\b(?!\s*[/*+-])/g) || []).length,
    rgbaColors: (text.match(/rgba\s*\(/g) || []).length,
    fontWeightLiterals: (text.match(/fontWeight:\s*(?:['"](?:[1-9]00|normal|bold)['"]|[1-9]00\b)/g) || []).length,
  };
}
module.exports = { countDesignAdditions };
