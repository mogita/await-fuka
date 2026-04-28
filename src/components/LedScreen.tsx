import {VStack, HStack, Rectangle} from 'await';

type Props = {
  matrix: number[][];
  cellSide: number;
};

export function LedScreen({matrix, cellSide}: Props) {
  return (
    <VStack spacing={0} background={0.05}>
      {matrix.map(row => (
        <HStack spacing={0}>
          {row.map(v => <Rectangle fill={v} sides={cellSide}/>)}
        </HStack>
      ))}
    </VStack>
  );
}
