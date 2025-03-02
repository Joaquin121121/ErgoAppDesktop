/**
 * Common constants used throughout the application
 */

// Navigation timing constants
export const NAVIGATION = {
  TRANSITION_DELAY: 300,
};

// Input validation constants
export const VALIDATION = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
    PATTERN: /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
  },
};

// Common tag names for input elements
export const INPUT_ELEMENTS = ["INPUT", "TEXTAREA", "SELECT"];

// Common class names
export const CLASSES = {
  BLUR: "blur-md pointer-events-none",
  TRANSITION: "transition-all duration-300 ease-in-out",
};

// Common style values
export const STYLES = {
  SIDEBAR_WIDTH: {
    EXPANDED: "224px",
    COLLAPSED: "128px",
  },
};

// Common HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
