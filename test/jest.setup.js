import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// Mock fetch for tests
globalThis.fetch = jest.fn();
globalThis.AbortController = jest.fn();