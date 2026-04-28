import {ZStack, HStack, VStack} from 'await';
import {GameState} from './state';
import {layoutFor} from './layout';
import {composeFrame} from './frame';
import {LedScreen} from './components/LedScreen';
import {ControlPanel} from './components/ControlPanel';

export type WidgetProps = {
  family: WidgetFamily;
  size: Size;
  now: number;
  gameState: GameState;
  cycleIntent: IntentInfo;
  executeIntent: IntentInfo;
  cancelIntent: IntentInfo;
};

export function widget(props: WidgetProps) {
  const {gameState, cycleIntent, executeIntent, cancelIntent, family, size, now} = props;
  const layout = layoutFor(family, size);
  const matrix = composeFrame(gameState, now);

  const screen = <LedScreen matrix={matrix} cellSide={layout.cellSide}/>;
  const controls = (
    <ControlPanel
      direction={layout.direction}
      cycle={cycleIntent}
      execute={executeIntent}
      cancel={cancelIntent}
    />
  );

  if (layout.direction === 'horizontal') {
    return (
      <ZStack>
        <HStack spacing={0}>
          {screen}
          {controls}
        </HStack>
      </ZStack>
    );
  }

  return (
    <ZStack>
      <VStack spacing={0}>
        {screen}
        {controls}
      </VStack>
    </ZStack>
  );
}
