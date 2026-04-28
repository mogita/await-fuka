import {HStack, Button, Text} from 'await';

type Props = {
  cycle: IntentInfo;
  execute: IntentInfo;
  cancel: IntentInfo;
};

export function ControlPanel({cycle, execute, cancel}: Props) {
  const buttons = [
    {label: 'A', intent: cycle},
    {label: 'B', intent: execute},
    {label: 'C', intent: cancel},
  ];

  return (
    <HStack spacing={0} background={0.1}>
      {buttons.map(b => (
        <Button intent={b.intent} maxWidth maxHeight>
          <Text value={b.label} foreground={0.9} fontWeight={700}/>
        </Button>
      ))}
    </HStack>
  );
}
