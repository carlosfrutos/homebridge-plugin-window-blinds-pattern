import { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import { WindowBlindsPatternHomebridgePlatform } from './platform.js';
import fetch from 'node-fetch';

// Default constants for window blinds
const DEF_MIN_OPEN = 0;
const DEF_MAX_OPEN = 100;
const DEF_TIMEOUT = 5000;

/**
 * Extract value from a string using a regex pattern
 */
function extractValueFromPattern(pattern: RegExp, string: string, position = 1): string {
  const matchArray = string.match(pattern);

  if (matchArray === null) { // pattern didn't match at all
    throw new Error(`Pattern didn't match (value: '${string}', pattern: '${pattern}')`);
  } else if (position >= matchArray.length) {
    throw new Error('Couldn\'t find any group which can be extracted. The specified group from which the data should be extracted was out of bounds');
  } else {
    return matchArray[position];
  }
}

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WindowBlindsPatternPlatformAccessory {
  private readonly service: Service;

  // Configuration properties
  private readonly name: string;
  private readonly debug: boolean;
  private readonly model: string;
  private readonly manufacturer: string;
  private readonly outputValueMultiplier: number;
  private readonly urlSetTargetPosition: string;
  private readonly urlGetCurrentPosition: string;
  private readonly statusPattern: RegExp;
  private readonly matchingGroup: number;
  private readonly serial: string;
  private readonly timeout: number;
  private readonly minOpen: number;
  private readonly maxOpen: number;

  // Window blinds state variables
  private currentPosition = 0;
  private targetPosition = 100;
  private readonly positionState: CharacteristicValue;

  constructor(
    private readonly platform: WindowBlindsPatternHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Get device configuration from context
    const device = accessory.context.device;

    // Initialize configuration properties from device context
    this.name = device.displayName ?? 'Window Blinds';
    this.debug = device.debug ?? false;
    this.model = device.model ?? 'nodeMCU based DIY motorised blinds';
    this.manufacturer = device.manufacturer ?? '@carlosfrutos';
    this.outputValueMultiplier = device.outputValueMultiplier ?? 1;
    this.urlSetTargetPosition = device.urlSetTargetPosition;
    this.urlGetCurrentPosition = device.urlGetCurrentPosition;

    // Initialize status pattern from configuration, default to "(\d+)"
    this.statusPattern = /(\d+)/;
    if (device.statusPattern) {
      if (typeof device.statusPattern === 'string') {
        try {
          this.statusPattern = new RegExp(device.statusPattern);
        } catch (error) {
          this.platform.log.warn(`Invalid regex pattern provided. Using default pattern. ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        this.platform.log.warn('Property \'statusPattern\' was given in an unsupported type. Using default one!');
      }
    }

    // Initialize matching group from configuration
    this.matchingGroup = 1;
    if (device.matchingGroup) {
      if (typeof device.matchingGroup === 'number' && Number.isInteger(device.matchingGroup)) {
        this.matchingGroup = device.matchingGroup;
      } else {
        this.platform.log.warn('Property \'matchingGroup\' was given in an unsupported type. Using default one!');
      }
    }

    this.serial = device.serial ?? 'HWB02';
    this.timeout = device.timeout ?? DEF_TIMEOUT;
    this.minOpen = device.minOpen ?? DEF_MIN_OPEN;
    this.maxOpen = device.maxOpen ?? DEF_MAX_OPEN;

    this.positionState = this.platform.Characteristic.PositionState.STOPPED;

    // Set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, this.model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.serial);

    // Get the WindowCovering service if it exists, otherwise create a new WindowCovering service
    this.service = this.accessory.getService(this.platform.Service.WindowCovering) ??
      this.accessory.addService(this.platform.Service.WindowCovering);

    // Set the service name, this is what is displayed as the default name on the Home app
    this.service.setCharacteristic(this.platform.Characteristic.Name, this.name);

    // Register handlers for the required characteristics
    this.service.getCharacteristic(this.platform.Characteristic.Name)
      .onGet(this.getName.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.CurrentPosition)
      .onGet(this.getCurrentPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.TargetPosition)
      .onGet(this.getTargetPosition.bind(this))
      .onSet(this.setTargetPosition.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.PositionState)
      .onGet(this.getPositionState.bind(this));

    // Set initial position state
    this.service.updateCharacteristic(
      this.platform.Characteristic.PositionState,
      this.platform.Characteristic.PositionState.STOPPED,
    );
  }

  /**
   * Handle requests to get the accessory name
   */
  async getName(): Promise<CharacteristicValue> {
    this.platform.log.debug('getName:', this.name);
    return this.name;
  }

  /**
   * Handle requests to get the current value of the "Current Position" characteristic
   */
  async getCurrentPosition(): Promise<CharacteristicValue> {
    if (this.debug) {
      this.platform.log.debug('GET CurrentPosition');
    }

    // Return immediately with cached value if no URL is configured
    if (!this.urlGetCurrentPosition) {
      return this.currentPosition;
    }

    try {
      // Setup AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(this.urlGetCurrentPosition, {
        method: 'GET',
        signal: controller.signal,
      });

      // Clear timeout as request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const body = await response.text();

      try {
        const extractedValue = extractValueFromPattern(this.statusPattern, body, this.matchingGroup);
        const value = parseInt(extractedValue, 10);

        if (this.debug) {
          this.platform.log.debug(`Matched value: ${extractedValue}. Window blind's current position is ${value}`);
        }

        if (value < this.minOpen || value > this.maxOpen || isNaN(value)) {
          throw new Error(`Invalid value received: ${value}`);
        }

        this.currentPosition = value;
        this.service.updateCharacteristic(
          this.platform.Characteristic.CurrentPosition,
          this.currentPosition,
        );
        this.service.updateCharacteristic(
          this.platform.Characteristic.PositionState,
          this.platform.Characteristic.PositionState.STOPPED,
        );

        return this.currentPosition;
      } catch (parseErr) {
        if (parseErr instanceof Error) {
          this.platform.log.error(`Error processing received information: ${parseErr.message} body: ${body}`);
        } else {
          this.platform.log.error(`Error processing received information: ${String(parseErr)} body: ${body}`);
        }
        throw parseErr;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.platform.log.error(`HTTP bad response (${this.urlGetCurrentPosition}): ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Handle requests to get the current value of the "Target Position" characteristic
   */
  async getTargetPosition(): Promise<CharacteristicValue> {
    // Set position state to stopped
    this.service.updateCharacteristic(
      this.platform.Characteristic.PositionState,
      this.platform.Characteristic.PositionState.STOPPED,
    );
    return this.targetPosition;
  }

  /**
   * Handle requests to set the "Target Position" characteristic
   */
  async setTargetPosition(value: CharacteristicValue): Promise<void> {
    const numValue = value as number;

    if (this.debug) {
      this.platform.log.debug(`SET TargetPosition from ${this.targetPosition} to ${numValue}`);
    }

    this.targetPosition = numValue;

    if (this.targetPosition > this.currentPosition) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.PositionState,
        this.platform.Characteristic.PositionState.INCREASING,
      );
    } else if (this.targetPosition < this.currentPosition) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.PositionState,
        this.platform.Characteristic.PositionState.DECREASING,
      );
    } else {
      this.service.updateCharacteristic(
        this.platform.Characteristic.PositionState,
        this.platform.Characteristic.PositionState.STOPPED,
      );
    }

    // Return immediately if no URL is configured
    if (!this.urlSetTargetPosition) {
      return;
    }

    const url = this.urlSetTargetPosition.replace(
      '%VALUE%',
      Math.round(numValue * this.outputValueMultiplier).toString(),
    );

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Update current position after movement completes
      this.currentPosition = this.targetPosition;
      this.service.updateCharacteristic(
        this.platform.Characteristic.CurrentPosition,
        this.currentPosition,
      );
      this.service.updateCharacteristic(
        this.platform.Characteristic.PositionState,
        this.platform.Characteristic.PositionState.STOPPED,
      );

      if (this.debug) {
        this.platform.log.debug(`currentPosition is now ${this.currentPosition}`);
      }
    } catch (error) {
      this.platform.log.error(`HTTP error when setting position: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Handle requests to get the current value of the "Position State" characteristic
   */
  async getPositionState(): Promise<CharacteristicValue> {
    return this.positionState;
  }
}
