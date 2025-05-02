# Homebridge Window Blinds Pattern Plugin

[![npm](https://img.shields.io/npm/v/homebridge-plugin-window-blinds-pattern.svg)](https://www.npmjs.com/package/homebridge-plugin-window-blinds-pattern)
[![npm](https://img.shields.io/npm/dt/homebridge-plugin-window-blinds-pattern.svg)](https://www.npmjs.com/package/homebridge-plugin-window-blinds-pattern)

A Homebridge plugin that allows you to control window blinds or shades where status information is obtained through regex pattern matching from an HTTP endpoint.

This plugin is particularly useful for DIY smart blinds projects using ESP8266/ESP32 or similar microcontrollers that expose HTTP APIs.

## Features

- Control window blinds/shades position with HomeKit
- Compatible with any device that provides HTTP API endpoints for control
- Extracts position information from API responses using configurable regex patterns
- Adjustable timing parameters and position ranges

## Installation

### Option 1: Install through Homebridge UI

1. Open your Homebridge UI
2. Go to the "Plugins" tab
3. Search for "window blinds pattern"
4. Click "Install"

### Option 2: Install manually

```bash
npm install -g homebridge-plugin-window-blinds-pattern
```

## Configuration

Configure the plugin through the Homebridge UI or by editing your `config.json` file directly.

### Configuration Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `platform` | string | **REQUIRED** Platform identifier | "WindowBlindsPattern" |
| `name` | string | Plugin name displayed in logs | "Window Blinds Pattern" |
| `accessories` | array | Array of blind accessories | [] |

### Accessory Configuration

Each blind accessory in the `accessories` array supports these parameters:

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `displayName` | string | Name of the blind shown in HomeKit | "Window Blinds" |
| `urlSetTargetPosition` | string | **REQUIRED** URL to set blind position. Use `%VALUE%` placeholder for position value | N/A |
| `urlGetCurrentPosition` | string | URL to get current blind position | N/A |
| `statusPattern` | string | Regex pattern to extract position value from HTTP response | "(\\d+)" |
| `matchingGroup` | number | The regex match group to extract as the value | 1 |
| `outputValueMultiplier` | number | Multiplier applied to HomeKit value when sending to blind | 1 |
| `minOpen` | number | Minimum position value | 0 |
| `maxOpen` | number | Maximum position value | 100 |
| `timeout` | number | HTTP request timeout in milliseconds | 5000 |
| `debug` | boolean | Enable detailed logging | false |
| `model` | string | Model name shown in HomeKit | "nodeMCU based DIY motorised blinds" |
| `manufacturer` | string | Manufacturer shown in HomeKit | "@carlosfrutos" |
| `serial` | string | Serial number shown in HomeKit | "HWB02" |

## Example Configuration

```json
{
  "platforms": [
    {
      "platform": "WindowBlindsPattern",
      "name": "Window Blinds Pattern",
      "accessories": [
        {
          "displayName": "Living Room Blind",
          "urlGetCurrentPosition": "http://192.168.1.100/status",
          "urlSetTargetPosition": "http://192.168.1.100/setPosition?pos=%VALUE%",
          "statusPattern": "position: (\\d+)",
          "matchingGroup": 1,
          "outputValueMultiplier": 1,
          "debug": true
        },
        {
          "displayName": "Bedroom Blind",
          "urlGetCurrentPosition": "http://192.168.1.101/status",
          "urlSetTargetPosition": "http://192.168.1.101/setPosition?pos=%VALUE%",
          "timeout": 3000
        }
      ]
    }
  ]
}
```

## How It Works

1. The plugin sends HTTP requests to your device to set and get blind positions
2. When setting a position:
   - The `%VALUE%` in `urlSetTargetPosition` is replaced with the position value (0-100)
   - The value is multiplied by `outputValueMultiplier` before sending
3. When getting a position:
   - The plugin makes a GET request to `urlGetCurrentPosition`
   - It extracts the position using the provided regex pattern and match group

## Status Pattern Examples

- Simple number: `"(\\d+)"` (extracts any number)
- JSON response: `"position\":\\s*(\\d+)"` (extracts number after "position": )
- XML response: `"<position>(\\d+)</position>"` (extracts number between XML tags)

## Troubleshooting

- Enable `debug: true` to see detailed logs
- Test your regex pattern with a tool like [regex101.com](https://regex101.com/)
- Verify your devices' HTTP endpoints work with tools like curl or Postman

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.



powershell -Command "Compress-Archive -Path .\dist\*, .\config.schema.json, .\package.json, .\LICENSE, .\README.md -DestinationPath .\homebridge-plugin-window-blinds-pattern.zip -Force"