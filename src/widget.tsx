import { ZStack, HStack, VStack, Image, Rectangle, Time } from "await";
import { GameState } from "./state";
import { layoutFor } from "./layout";
import { ControlPanel } from "./components/ControlPanel";
import {
	petAnimSpec,
	feedIconUrl,
	cleanIconUrl,
	POOP_URL,
	HEART_FILLED_URL,
	HEART_HOLLOW_URL,
} from "./assets";
import { LED_BG, LED_FG } from "./config";

export type WidgetProps = {
	family: WidgetFamily;
	size: Size;
	gameState: GameState;
	cycleIntent: IntentInfo;
	executeIntent: IntentInfo;
	cancelIntent: IntentInfo;
};

// Layout proportions inside the screen square. All percentages of screenSide,
// so the layout scales with widget size. Positions are vertical offsets from
// the top of the screen square (no baking in absolute pixel constants).
const MENU_HEIGHT_PCT = 0.16; // top strip with feed/clean icons
const ICON_HEIGHT_PCT = 0.1; // each menu icon's height
const PET_SIZE_PCT = 0.5; // pet sprite (square)
const PET_CENTER_Y_PCT = 0.45; // pet sprite vertical center
const POOP_SIZE_PCT = 0.18;
const POOP_OFFSET_X_PCT = 0.32; // poop right of pet center
const POOP_OFFSET_Y_PCT = 0.1; // poop slightly below pet center
const GROUND_Y_PCT = 0.73; // ground line vertical position
const GROUND_HEIGHT_PCT = 0.012; // ground line thickness (relative)
const GROUND_WIDTH_PCT = 0.85;
const HEART_ROW_Y_PCT = 0.85; // hearts row center
const HEART_SIZE_PCT = 0.1;
const HEART_GAP_PCT = 0.025;

// Build the pet sprite as a ZStack of two Images, each gated by a fs02 Time
// mask. The fs02 feature renders a square that's "on" for 0.5s of every 1s
// cycle. By giving the two masks dates 1s apart (aligned to a minute boundary
// so phases are stable), the two masks are 180-degrees out of phase and exactly
// one Image is visible at any moment. Net: 2-frame alternating animation
// driven by the runtime's wall clock, no timeline entries needed.
function buildPetAnim(
	state: GameState,
	side: number,
	offsetY: number,
): NativeView {
	const { urls } = petAnimSpec(state);
	const baseDate = new Date();
	baseDate.setSeconds(0, 0);
	const phaseAt = (offsetSeconds: number) => (
		<Time
			date={new Date(baseDate.getTime() + offsetSeconds * 1000)}
			font={{ name: "Widget", features: "fs02", size: side }}
			sides={side}
			contentTransition="identity"
		/>
	);
	return (
		<ZStack offset={{ x: 0, y: offsetY }}>
			<Image
				url={urls[0]}
				resizable
				interpolation="none"
				frame={{ width: side, height: side }}
				mask={phaseAt(0)}
			/>
			<Image
				url={urls[1]}
				resizable
				interpolation="none"
				frame={{ width: side, height: side }}
				mask={phaseAt(1)}
			/>
		</ZStack>
	);
}

type ScreenAreaProps = {
	state: GameState;
	side: number;
};

function ScreenArea({ state, side }: ScreenAreaProps) {
	const isPet = state.stage === "pet";

	const menuHeight = side * MENU_HEIGHT_PCT;
	const iconSize = side * ICON_HEIGHT_PCT;
	const petSize = side * PET_SIZE_PCT;
	const petCenterY = side * PET_CENTER_Y_PCT;
	const poopSize = side * POOP_SIZE_PCT;
	const poopOffsetX = side * POOP_OFFSET_X_PCT;
	const poopOffsetY = side * POOP_OFFSET_Y_PCT;
	const groundY = side * GROUND_Y_PCT;
	const groundHeight = Math.max(1, side * GROUND_HEIGHT_PCT);
	const groundWidth = side * GROUND_WIDTH_PCT;
	const heartRowY = side * HEART_ROW_Y_PCT;
	const heartSize = side * HEART_SIZE_PCT;
	const heartGap = side * HEART_GAP_PCT;

	const halfSide = side / 2;

	// ZStack centers all children. We translate from center to the desired
	// position via offset = {x, y}. y is signed: negative = up, positive = down.
	const menuStrip = isPet ? (
		<HStack
			spacing={iconSize}
			offset={{ x: 0, y: -(halfSide - menuHeight / 2) }}
		>
			<Image
				url={feedIconUrl(state.menuCursor)}
				resizable
				interpolation="none"
				frame={{ width: iconSize * 2, height: iconSize }}
			/>
			<Image
				url={cleanIconUrl(state.menuCursor)}
				resizable
				interpolation="none"
				frame={{ width: iconSize * 2, height: iconSize }}
			/>
		</HStack>
	) : undefined;

	const pet = buildPetAnim(state, petSize, petCenterY - halfSide);

	const poop =
		isPet && state.hasPoop ? (
			<Image
				url={POOP_URL}
				resizable
				interpolation="none"
				frame={{ width: poopSize, height: poopSize }}
				offset={{ x: poopOffsetX, y: petCenterY - halfSide + poopOffsetY }}
			/>
		) : undefined;

	const ground = isPet ? (
		<Rectangle
			fill={LED_FG}
			opacity={0.4}
			frame={{ width: groundWidth, height: groundHeight }}
			offset={{ x: 0, y: groundY - halfSide }}
		/>
	) : undefined;

	const hearts = isPet ? (
		<HStack spacing={heartGap} offset={{ x: 0, y: heartRowY - halfSide }}>
			{[0, 1, 2, 3].map((i) => (
				<Image
					url={i < state.hunger ? HEART_FILLED_URL : HEART_HOLLOW_URL}
					resizable
					interpolation="none"
					frame={{ width: heartSize, height: heartSize }}
				/>
			))}
		</HStack>
	) : undefined;

	// maxSides expands the ZStack to fill the parent's allocated space; background
	// (declared AFTER maxSides) paints LED_BG over the expanded frame, including
	// any margin around the design-square area used for sprite positioning.
	return (
		<ZStack maxSides background={LED_BG}>
			{menuStrip}
			{pet}
			{poop}
			{ground}
			{hearts}
		</ZStack>
	);
}

export function widget(props: WidgetProps) {
	const { gameState, cycleIntent, executeIntent, cancelIntent, family, size } =
		props;
	const layout = layoutFor(family, size);

	const screen = <ScreenArea state={gameState} side={layout.screenSide} />;
	const controls = (
		<ControlPanel
			direction={layout.direction}
			controlSize={layout.controlSize}
			cycle={cycleIntent}
			execute={executeIntent}
			cancel={cancelIntent}
		/>
	);

	if (layout.direction === "horizontal") {
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
