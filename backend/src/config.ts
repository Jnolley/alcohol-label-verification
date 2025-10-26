/**
 * Centralized configuration for the Label Verification Backend
 * All configurable constants and thresholds are defined here
 */

const config = {
  /**
   * Image Validation Configuration
   */
  image: {
    maxFileSizeMB: 10, // Maximum file size in megabytes
    allowedFormats: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  },

  /**
   * OCR Configuration
   */
  ocr: {
    minConfidence: 30, // Minimum OCR confidence percentage (0-100)
    minTextLength: 3, // Minimum number of characters to extract
    warningConfidenceThreshold: 60, // Log warning if confidence is below this
    language: 'eng', // Tesseract language model to use
  },

  /**
   * Verification Configuration
   */
  verification: {
    fuzzyMatchThreshold: 90, // Minimum similarity % for fuzzy matching (0-100)
    alcoholContentTolerance: 0.0, // Allowed difference in ABV percentage (exact match)
    brandNameMinWordMatch: 0.99, // Minimum percentage of brand words that must match (99%)
    productTypeMinKeywordMatch: 1, // Minimum number of product type keywords that must match
    governmentWarningMinSections: 7, // Number of required sections for government warning (7 = 100%)
  },

  /**
   * Required Government Warning Text
   * As specified by TTB regulations
   */
  requiredTexts: {
    governmentWarning:
      'GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.',

    governmentWarningSections: [
      'GOVERNMENT WARNING',
      'SURGEON GENERAL',
      'WOMEN SHOULD NOT DRINK ALCOHOLIC BEVERAGES DURING PREGNANCY',
      'RISK OF BIRTH DEFECTS',
      'CONSUMPTION OF ALCOHOLIC BEVERAGES IMPAIRS YOUR ABILITY TO DRIVE',
      'OPERATE MACHINERY',
      'MAY CAUSE HEALTH PROBLEMS',
    ],
  },

  /**
   * Logging Configuration
   */
  logging: {
    enabled: process.env.LOG_ENABLED !== 'false', // Enable/disable logging
    level: process.env.LOG_LEVEL || 'info', // Log level: 'debug', 'info', 'warn', 'error'
    logRequests: process.env.LOG_REQUESTS !== 'false', // Log all verification requests
    logOCRResults: process.env.LOG_OCR_RESULTS !== 'false', // Log OCR extraction details
    logFieldChecks: process.env.LOG_FIELD_CHECKS !== 'false', // Log individual field verification results
  },

  /**
   * Server Configuration
   */
  server: {
    port: process.env.PORT || 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:4200',
  },

  /**
   * Admin Configuration
   * Simple hardcoded credentials for MVP admin access
   */
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
} as const;

export default config;
