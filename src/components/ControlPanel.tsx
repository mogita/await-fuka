import {HStack, VStack, Button, Text} from 'await';
import {Direction} from '../layout';

type Props = {
  direction: Direction;
  cycle: IntentInfo;
  execute: IntentInfo;
  cancel: IntentInfo;
};

export function ControlPanel({direction, cycle, execute, cancel}: Props) {
  const buttons = [
    {label: 'A', intent: cycle},
    {label: 'B', intent: execute},
    {label: 'C', intent: cancel},
  ];

  if (direction === 'horizontal') {
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

  return (
    <VStack spacing={0} background={0.1}>
      {buttons.map(b => (
        <Button intent={b.intent} maxWidth maxHeight>
          <Text value={b.label} foreground={0.9} fontWeight={700}/>
        </Button>
      ))}
    </VStack>
  );
}
