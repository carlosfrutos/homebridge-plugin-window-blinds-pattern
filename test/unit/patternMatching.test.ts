/**
 * Tests for the regex pattern matching functionality used in the plugin
 */

describe('Pattern Matching', () => {
  /**
   * Helper function that mimics the plugin's pattern extraction functionality
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

  it('should extract a simple digit pattern', () => {
    const pattern = /(\d+)/;
    const input = 'Current position: 75';
    const result = extractValueFromPattern(pattern, input);
    expect(result).toBe('75');
  });

  it('should extract from a complex HTML response', () => {
    const pattern = /<div id="position">(\d+)<\/div>/;
    const input = '<html><body><div id="position">42</div></body></html>';
    const result = extractValueFromPattern(pattern, input);
    expect(result).toBe('42');
  });

  it('should extract from a JSON response', () => {
    const pattern = /"position":(\d+)/;
    const input = '{"status":"ok","position":88,"battery":95}';
    const result = extractValueFromPattern(pattern, input);
    expect(result).toBe('88');
  });

  it('should use a different matching group when specified', () => {
    const pattern = /position:(\d+),battery:(\d+)/;
    const input = 'position:50,battery:80';
    const result = extractValueFromPattern(pattern, input, 2);
    expect(result).toBe('80');
  });

  it('should throw an error for non-matching pattern', () => {
    const pattern = /position:(\d+)/;
    const input = 'status:ok';
    expect(() => extractValueFromPattern(pattern, input)).toThrow(
      'Pattern didn\'t match',
    );
  });

  it('should throw an error for out-of-bounds group', () => {
    const pattern = /position:(\d+)/;
    const input = 'position:25';
    expect(() => extractValueFromPattern(pattern, input, 2)).toThrow(
      'Couldn\'t find any group which can be extracted',
    );
  });
});