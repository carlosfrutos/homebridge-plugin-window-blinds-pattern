import { Logging } from 'homebridge';
import { jest } from '@jest/globals';

/**
 * Creates a mock Homebridge API
 */
export function createMockAPI(): any {
  return {
    hap: {
      Service: createMockServiceTypes(),
      Characteristic: createMockCharacteristicTypes(),
      uuid: {
        generate: jest.fn().mockReturnValue('test-uuid'),
      },
    },
    registerPlatform: jest.fn(),
    registerAccessory: jest.fn(),
    publishExternalAccessories: jest.fn(),
    registerPlatformAccessories: jest.fn(),
    updatePlatformAccessories: jest.fn(),
    unregisterPlatformAccessories: jest.fn(),
    on: jest.fn(),
    user: {
      configPath: jest.fn().mockReturnValue('/mock/config/path'),
      storagePath: jest.fn().mockReturnValue('/mock/storage/path'),
      persistPath: jest.fn().mockReturnValue('/mock/persist/path'),
      cachedAccessoriesPath: jest.fn().mockReturnValue('/mock/accessories/path'),
    },
    version: 1.8,
    platformAccessory: jest.fn().mockImplementation((displayName, uuid) => {
      return {
        displayName,
        UUID: uuid,
        context: {},
        getService: jest.fn(),
        addService: jest.fn(),
      };
    }),
  };
}

/**
 * Creates mock Service types for testing
 */
export function createMockServiceTypes(): any {
  const mockService = {
    getCharacteristic: jest.fn().mockImplementation(() => ({
      onGet: jest.fn().mockReturnThis(),
      onSet: jest.fn().mockReturnThis(),
    })),
    setCharacteristic: jest.fn().mockReturnThis(),
    updateCharacteristic: jest.fn().mockReturnThis(),
  };

  // Create constructor functions for each service type
  const WindowCovering = jest.fn().mockImplementation(() => mockService);
  const AccessoryInformation = jest.fn().mockImplementation(() => mockService);

  return {
    WindowCovering,
    AccessoryInformation,
  };
}

/**
 * Creates mock Characteristic types for testing
 */
export function createMockCharacteristicTypes(): any {
  return {
    CurrentPosition: jest.fn(),
    PositionState: {
      INCREASING: 1,
      DECREASING: 0,
      STOPPED: 2,
    },
    TargetPosition: jest.fn(),
    Name: jest.fn(),
    Manufacturer: jest.fn(),
    Model: jest.fn(),
    SerialNumber: jest.fn(),
  };
}

/**
 * Creates a mock logger object
 */
export function createMockLogger(): Logging {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    success: jest.fn(),
  } as unknown as Logging;
}