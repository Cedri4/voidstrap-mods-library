import { test, expect, mod } from 'voidstrap/testing';

test('counts clicks on the hello page', () => {
  mod.emit('session.start', { source: 'startup' });
  const page = mod.renderPage('hello');
  mod.press(page, 'click');
  expect(JSON.stringify(mod.renderPage('hello'))).toContain('Clicks: 1');
});
