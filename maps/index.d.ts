type MapSectionImageLayer = "background" | "terrain" | "aura" | "token";
type MapSectionLabel = "map" | "grid" | MapSectionImageLayer;
type MapData = {
    name: string;
    spawn?: GridCoordinate;
    user?: string;
};
declare function splice(lines: string[], start: number, deleteCount: number): string[];
declare function sectionByLabel(lines: string[], label: MapSectionLabel): MapSectionParser | undefined;
declare function sectionsByLabel(lines: string[], label: MapSectionLabel): MapSectionParser[];
declare class MapSectionParser {
    label: MapSectionLabel;
    lines: string[];
    constructor(label: MapSectionLabel, lines: string[]);
    boolean(key: string): boolean | undefined;
    color(key: string): HexColorString | undefined;
    clip(): HasClip | undefined;
    colsAndRows(): HasGridDimensions | undefined;
    gridOffset(): GridCoordinate | undefined;
    gridType(key: string): GridType | undefined;
    number(regex: RegExp): number | undefined;
    number(key: string): number | undefined;
    number(key: string, px: boolean): number | undefined;
    numbers<T extends number[]>(regex: RegExp): T | undefined;
    numbers<T extends number[]>(key: string): T | undefined;
    numbers<T extends number[]>(key: string, px: boolean): T | undefined;
    percent(key: string): number | undefined;
    pixelOffset(): Point | undefined;
    private getScale;
    scale(): HasScale | undefined;
    get pixelDimensions(): HasPixelDimensions | undefined;
    get gridDimensions(): HasGridDimensions | undefined;
    size(): HasSize | undefined;
    string<T extends string = string>(key: string): T | undefined;
    string(regex: RegExp): string | undefined;
    string(regex: RegExp, slice: true): string | undefined;
    url(): string | undefined;
    toAura(): GameMapAura | undefined;
    toGrid(): GridArgs | undefined;
    toMap(): MapData | undefined;
    toMapAndBackgroundAndGrid(): [MapData | undefined, GameMapImage | undefined, GridArgs | undefined];
    toImage(): GameMapImage | undefined;
    static parse(raw: string): GameMapDataBase | undefined;
}
type RenderableAura = RenderableImage & {
    anchor: string;
    opacity: number;
};
declare function renderAuraCols(aura: RenderableAura): string;
declare function showAura(aura: RenderableAura): void;
declare function createAura(): RenderableAura;
declare let canvasWidth: number;
declare let pxPerCol: number;
declare let canvasHeight: number;
declare let pxPerRow: number;
declare function resetCanvas(width?: number, height?: number): void;
type RenderableImage = {
    name?: string;
    url: string;
    size?: NumberPair;
    gridOffset?: NumberPair;
};
declare function draw(image?: RenderableImage, colOffset?: number, rowOffset?: number, alpha?: number): Promise<boolean>;
type JQueryEvent = JQuery.EventBase | JQuery.ClickEvent;
declare function onMapValueChange(): void;
declare function onImageError(ev: JQueryEvent): void;
declare function onImageRemove(ev: JQueryEvent): void;
declare function onImageCopy(ev: JQueryEvent): void;
declare function onDownloadClick(): void;
declare function onImportClick(): void;
declare function getIndexes(ev: JQueryEvent): {
    layerIndex: number;
    imageIndex: number;
};
declare function hideEditor(ev: JQueryEvent): void;
declare function showEditor(ev: JQueryEvent): void;
declare function saveChanges(ev: JQueryEvent): void;
declare function handleEditClick(ev: JQueryEvent, handler: Function): void;
declare function handleSaveClick(ev: JQueryEvent, handler: Function): void;
declare function jsonToText(map: SageMap): string;
declare function parseImage(image: GameMapImage | GameMapAura, anchors?: RenderableImage[]): RenderableTerrain | RenderableAura | RenderableToken;
declare function textToJson(raw: string): SageMap;
type LayerKey = "terrain" | "aura" | "token";
declare const LayerKeys: LayerKey[];
declare function getImages(layerKey: LayerKey): {
    name: string;
    url: string;
    size: [number, number];
    gridOffset: [number, number];
    anchor?: string;
    opacity?: number;
    user?: string;
}[];
declare const __maps: SageMap[];
declare let __imageIndex: number;
declare let __activeMapIndex: number;
declare function getActiveMap(): SageMap;
declare function saveMaps(): void;
declare function loadMaps(): void;
declare function listMaps(): void;
declare function saveMap(): void;
declare function addMap(map: SageMap): void;
declare function loadMap(): void;
declare function deleteMap(): void;
declare const renameDuplicate: (resolvable: string | {
    name: string;
}, others: (string | {
    name: string;
})[], type?: "number" | string[] | "alpha") => {
    suffix: string;
    replacer: (name: string) => string;
    name: string;
};
declare function renderMap(): void;
declare function renderMeta(): void;
declare function renderPayloads(): void;
declare function renderPreview(): Promise<void>;
type RenderableTerrain = RenderableImage;
declare function renderTerrainCols(terrain: RenderableTerrain): string;
declare function showTerrain(terrain: RenderableTerrain): void;
declare function createTerrain(): RenderableTerrain;
type RenderableToken = RenderableImage & {
    user: string;
};
declare function renderTokenCols(token: RenderableToken): string;
declare function showToken(token: RenderableToken): void;
declare function createToken(): RenderableToken;
type Snowflake = string;
declare const COL = 0;
declare const ROW = 1;
declare const X = 0;
declare const Y = 1;
declare const WIDTH = 0;
declare const HEIGHT = 1;
type LayerType = "background" | "terrain" | "aura" | "token";
type GridType = "flat" | "pointy" | "square";
type HexColorString = `#${string}`;
type NumberPair = [number, number];
type NumberQuartet = [number, number, number, number];
type Point = {
    x: number;
    y: number;
};
type GridCoordinate = {
    col: number;
    row: number;
};
type HasClip = {
    clipX: number;
    clipY: number;
    clipWidth: number;
    clipHeight: number;
};
type HasGridDimensions = {
    cols: number;
    rows: number;
};
type HasGridType = {
    gridType: GridType;
};
type HasName = {
    name: string;
};
type HasOffset = {
    gridOffset?: GridCoordinate;
    pixelOffset?: Point;
};
type HasOpacity = {
    opacity?: number;
};
type HasPixelDimensions = {
    height: number;
    width: number;
};
type HasScale = {
    scale?: number;
    scaleX?: number;
    scaleY?: number;
};
type HasSize = Partial<HasGridDimensions> & Partial<HasPixelDimensions>;
type HasUrl = {
    url: string;
};
type GridArgs = {
    context?: any;
    width: number;
    height: number;
    cols: number;
    rows: number;
    gridType: GridType;
    gridColor?: HexColorString;
    gridWidth?: number;
    keys?: boolean;
    colKey?: boolean;
    rowKey?: boolean;
    keyScale?: number;
    colKeyScale?: number;
    rowKeyScale?: number;
};
type GameMapImageBase = Partial<HasClip> & HasOffset & HasOpacity & HasScale & HasSize & HasUrl & {
    id: Snowflake;
    name: string;
    userId?: Snowflake;
};
type GameMapImage = GameMapImageBase & {
    auras?: GameMapImage[];
};
type GameMapAura = GameMapImageBase & {
    anchorId?: Snowflake;
    isActive?: boolean;
};
type GameMapBase = {
    name: string;
    spawn?: GridCoordinate;
    user?: string;
};
type GameMap = GameMapBase & {
    userId: string;
    grid: GridArgs;
    layers: {
        background: {
            type: "background";
            id: string;
            images: GameMapImageBase[];
        };
        terrain: {
            type: "terrain";
            id: string;
            images: GameMapImageBase[];
        };
        aura: {
            type: "aura";
            id: string;
            images: GameMapAura[];
        };
        token: {
            type: "token";
            id: string;
            images: GameMapImageBase[];
        };
    };
};
type GameMapLayerData = HasOffset & {
    id: Snowflake;
    images: GameMapImage[];
    type: LayerType;
};
type GameMapLayerDataMap = {
    background?: GameMapLayerData;
    terrain?: GameMapLayerData;
    aura?: GameMapLayerData;
    token?: GameMapLayerData;
};
type GameMapDataBase = {
    grid?: GridArgs;
    layers: GameMapLayerDataMap;
    name: string;
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
        images: {
            name: string;
            url: string;
            size: [number, number];
            gridOffset: [number, number];
            anchor?: string;
            opacity?: number;
            user?: string;
        }[];
    }[];
};
declare function $el<T extends HTMLElement>(elementId: string): JQuery<T> | undefined;
declare function $val(elementId: string): string | number | string[] | undefined;
declare function $num(elementId: string): number | undefined;
declare function $str(elementId: string): string | undefined;
declare function allDefined(...values: unknown[]): boolean;
declare function anyDefined(...values: unknown[]): boolean;
declare function isBoolean(value: unknown): value is boolean;
declare function isDefined<T>(value: T | undefined | null): value is T;
declare function isString(value: unknown): value is string;
declare function debug(...args: any[]): void;
declare function cloneJson<T>(value: T): T;
declare function dequote(value: string): string;
declare function setTab(base: string): void;
declare const randomSnowflake: (options?: {
    epoch?: number;
    nodeId?: number;
    sequence?: number;
}) => string;
