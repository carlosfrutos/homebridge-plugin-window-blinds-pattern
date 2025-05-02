import { TextEncoder, TextDecoder } from 'util';
import { jest } from '@jest/globals';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock node-fetch
// jest.mock('node-fetch', () => ({
//   __esModule: true,
//   default: jest.fn().mockImplementation(() => 
//     Promise.resolve({
//       ok: true,
//       text: () => Promise.resolve('50'),
//     }),
//   ),
// }));