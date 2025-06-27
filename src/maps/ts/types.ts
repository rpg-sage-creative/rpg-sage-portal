
type Snowflake = string;

const COL = 0;
const ROW = 1;
const X = 0;
const Y = 1;
const WIDTH = 0;
const HEIGHT = 1;

type LayerType = "background" | "terrain" | "aura" | "token";
// enum UserLayerType { Layer = 0, Terrain = 1, Aura = 2, Token = 3, PreviousLayer = 4 }

type GridType = "flat" | "pointy" | "square";
type HexColorString = `#${string}`;
type NumberPair = [number, number];
type NumberQuartet = [number, number, number, number];

/** Pixel location */
type Point = {
	/** the x coordinate */
	x: number;

	/** the y coordinate */
	y: number;
};

/** A simple col/row coordinate pair where col and row are numeric values: { col:1, row:1 } */
type GridCoordinate = {
	/** Column number, starting with 1 */
	col: number;

	/** Row number, starting with 1 */
	row: number;
};

/** This object type has a clip rectangle. */
type HasClip = {
	/** x-axis pixels to start rendering from */
	clipX: number;

	/** y-axis pixels to start rendering from */
	clipY: number;

	/** total pixel width to render; a negative number clips that many pixels off the end of the x-axis */
	clipWidth: number;

	/** total pixel height to render a negative number clips that many pixels off the end of the y-axis */
	clipHeight: number;
};

/** Represents and object dimensions expressed as cols and rows. */
type HasGridDimensions = {
	/** number of columns */
	cols: number;

	/** number of rows */
	rows: number;
};

type HasGridType = {
	gridType: GridType;
};

type HasName = {
	name: string;
}

/** This object has grid and pixel offsets. */
type HasOffset = {
	/** offset from origin: { col, row } */
	gridOffset?: GridCoordinate;

	/** pixel offset from origin: { x, y } */
	pixelOffset?: Point;
};

type HasOpacity = {
	/** opacity of image, from 0 to 1 */
	opacity?: number;
};

/** Represents and object dimensions expressed as height and width in pixels. */
type HasPixelDimensions = {
	/** height in pixels */
	height: number;

	/** width in pixels */
	width: number;
};

/**
 * Has a scale multiplier for scaling something.
 * For instance, for token art that bleeds over their token/base.
 */
type HasScale = {
	/** The multiplier to use when scaling */
	scale?: number;
	scaleX?: number;
	scaleY?: number;
};

type HasSize = Partial<HasGridDimensions> & Partial<HasPixelDimensions>;

/**
 * Has a url for referencing something.
 * For instance, the url to the image.
 */
type HasUrl = {
	/** The item's url. */
	url: string;
};

type GridArgs = {
	context?: any; //SKRSContext2D;

	/** width of grid in pixels */
	width: number;
	/** height of grid in pixels */
	height: number;

	/** number of columns */
	cols: number;
	/** number of rows */
	rows: number;

	/** square, flat (hex), pointy (hex) */
	gridType: GridType;
	/** hex value, defaults to #000 */
	gridColor?: HexColorString;
	gridWidth?: number;

	/** show both keys */
	keys?: boolean;
	/** show column key */
	colKey?: boolean;
	/** show row key */
	rowKey?: boolean;

	/** multiplier used to scale the size of both keys */
	keyScale?: number;
	/** multiplier used to scale the size of the column keys */
	colKeyScale?: number;
	/** multiplier used to scale the size of the row keys */
	rowKeyScale?: number;
};


/** Represents all the information about a map's image. */
type GameMapImageBase = Partial<HasClip> & HasOffset & HasOpacity & HasScale & HasSize & HasUrl & {
	/** unique identifier for the image */
	id: Snowflake;

	/** name of the image */
	name: string;

	/** id of the image's owner */
	userId?: Snowflake;
};

type GameMapImage = GameMapImageBase & {
	/** NonAuraOnly: all auras anchored to the image */
	auras?: GameMapImage[];
};

type GameMapAura = GameMapImageBase & {
	/** AuraOnly: the id of the image this aura is anchored to */
	anchorId?: Snowflake;

	/** AuraOnly: true if the aura is visible */
	isActive?: boolean;
};

type GameMapBase = {
	name: string;
	spawn?: GridCoordinate;
	user?: string;
}
type GameMap = GameMapBase & {
	userId: string;
	grid: GridArgs;
	layers: {
		background: { type:"background"; id:string; images:GameMapImageBase[]; };
		terrain: { type:"terrain"; id:string; images:GameMapImageBase[]; };
		aura: { type:"aura"; id:string; images:GameMapAura[]; };
		token: { type:"token"; id:string; images:GameMapImageBase[]; };
	}
}

/** Represents map layer data. */
type GameMapLayerData = HasOffset & {
	id: Snowflake;
	images: GameMapImage[];
	type: LayerType;
};

/** the set of all layers for a map */
type GameMapLayerDataMap = {
	/** bottom most layer */
	background?: GameMapLayerData;
	/** the layer just above the background */
	terrain?: GameMapLayerData;
	/** the layer all auras are rendered on: above background/terrain, below token */
	aura?: GameMapLayerData;
	/** the top most layer, where all tokens are rendered */
	token?: GameMapLayerData;
};

/**
 * Core Game Map data.
 * Fetchable via url? (if i want to allow shareable maps)
 */
type GameMapDataBase = {
	/** the data required to render a grid */
	grid?: GridArgs;

	/** the layers of the map */
	layers: GameMapLayerDataMap;

	/** name of the map */
	name: string;

	/** where tokens first appear: [col, row] */
	spawn?: GridCoordinate;

	userId?: string;
};

type SageMap = {
	name: string;
	background: {
		url: string;
	};
	grid: [number, number];
	spawn: [number, number];
	layers: {
		images:{
			name: string;
			url: string;
			size: [number, number];
			gridOffset: [number, number];
			// auras
			anchor?: string;
			opacity?: number;
			// tokens
			user?: string;
		}[];
	}[];
};