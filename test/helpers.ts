import { PlatformAccessory } from 'homebridge';
import { jest } from '@jest/globals';

// Define types to replace 'any'
type ServiceMap = Record<string, jest.Mock>;
type CharacteristicMap = Record<string, jest.Mock>;
type LogFunction = jest.Mock;
type Logger = Record<'debug' | 'info' | 'warn' | 'error', LogFunction>;

// Functions moved above their usage to fix the linting error
function createMockServiceTypes(): ServiceMap {
  return {
    AccessoryInformation: jest.fn(),
    WindowCovering: jest.fn(),
  };
}

function createMockCharacteristicTypes(): CharacteristicMap {
  return {
    Name: jest.fn(),
    Manufacturer: jest.fn(),
    Model: jest.fn(),
    SerialNumber: jest.fn(),
    CurrentPosition: jest.fn(),
    TargetPosition: jest.fn(),
    PositionState: jest.fn(),
  };
}

export function createMockAPI() {
  const mockServiceTypes = createMockServiceTypes();
  const mockCharacteristicTypes = createMockCharacteristicTypes();

  return {
    Service: mockServiceTypes,
    Characteristic: {
      ...mockCharacteristicTypes,
      PositionState: {
        DECREASING: 0,
        INCREASING: 1,
        STOPPED: 2,
      },
    },
    hap: {
      Service: mockServiceTypes,
      Characteristic: mockCharacteristicTypes,
    },
  };
}

export function createMockAccessory(context: Record<string, unknown> = {}): PlatformAccessory {
  const mockService = {
    getCharacteristic: jest.fn().mockReturnThis(),
    setCharacteristic: jest.fn().mockReturnThis(),
    updateCharacteristic: jest.fn().mockReturnThis(),
  };

  return {
    UUID: 'test-uuid',
    displayName: 'Test Accessory',
    context,
    services: [mockService],
    getService: jest.fn(() => {
      return mockService;
    }),
    addService: jest.fn(() => mockService),
  } as unknown as PlatformAccessory;
}

export function createMockLogger(): Logger {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

export function createMockPlatform(config: Record<string, unknown> = {}) {
  return {
    log: createMockLogger(),
    config,
    api: createMockAPI(),
    Service: createMockAPI().Service,
    Characteristic: createMockAPI().Characteristic,
  };
}