const test = require('node:test');
const assert = require('node:assert/strict');
const { generateAudioPrompt } = require('./index');

test('generateAudioPrompt returns base prompt', () => {
  const audioFeatures = { volume: 0.5, centroid: 0.5, pitch: 50, energy: 0.05 };
  const result = generateAudioPrompt(audioFeatures, 'minimal');
  assert.equal(result, 'Digital art style, high quality, artistic variation');
});
