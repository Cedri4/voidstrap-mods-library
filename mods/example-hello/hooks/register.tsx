import type { Register } from 'voidstrap';

const clicks = atom('clicks', 0);

export const register: Register = (on) => {
  on('session.start', ($, e, next) => {
    $.sidebar.addPage({ id: 'hello', title: 'Hello', icon: 'HandWave24', section: 'Core' });
    return next(e);
  });

  on('ui.render', { component: 'Page', requestId: 'hello' }, ($) => {
    const { Box, Card, Text, Button, Badge } = $.ui.resolve();
    return (
      <Box gap={10}>
        <Card title="Hello from the mods library" subtitle="This mod was installed from voidstrap-mods-library">
          <Text text="Every mod in the library is checked automatically and reviewed before it is published." />
          <Box direction="row" gap={8}>
            <Badge text={'Clicks: ' + read($, clicks)} variant="primary" />
            <Button key="click" label="Click me" variant="primary" icon="Add24" onPress={() => update($, clicks, n => n + 1)} />
          </Box>
        </Card>
      </Box>
    );
  });
};
