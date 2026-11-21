/**
 * Vitest global setup file.
 *
 * Extends expect() with custom DOM matchers from @testing-library/jest-dom
 * (e.g. toBeInTheDocument, toHaveTextContent, toBeDisabled).
 */
import '@testing-library/jest-dom';
import { JSDOM } from 'jsdom';

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: new JSDOM('', { url: 'http://localhost/' }).window.localStorage,
});

beforeEach(() => {
  localStorage.clear();
});
