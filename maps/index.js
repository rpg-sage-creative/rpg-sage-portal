function splice(lines, start, deleteCount) {
    return lines
        .splice(start, deleteCount)
        .map(s => s.trim())
        .filter(s => s);
}
function sectionByLabel(lines, label) {
    const regex = /^\s*\[(map|grid|background|terrain|aura|token)\]\s*$/i;
    const sectionIndex = lines.findIndex(line => regex.exec(line)?.[1] === label);
    const nextSectionIndex = lines.findIndex((line, index) => index > sectionIndex && regex.test(line));
    if (sectionIndex < 0) {
        return undefined;
    }
    if (nextSectionIndex < 0) {
        return new MapSectionParser(label, splice(lines, sectionIndex, lines.length - sectionIndex));
    }
    return new MapSectionParser(label, splice(lines, sectionIndex, nextSectionIndex - sectionIndex));
}
function sectionsByLabel(lines, label) {
    const matchers = [];
    let loop = true;
    do {
        const matcher = sectionByLabel(lines, label);
        if (matcher) {
            matchers.push(matcher);
        }
        else {
            loop = false;
        }
    } while (loop);
    return matchers;
}
class MapSectionParser {
    label;
    lines;
    constructor(label, lines) {
        this.label = label;
        this.lines = lines;
    }
    boolean(key) {
        const value = this.string(key);
        if (/^(true|t|false|f|yes|y|no|n|1|0)$/i.test(value ?? "")) {
            return /^(true|t|yes|y|1)$/i.test(value);
        }
        return undefined;
    }
    color(key) {
        const value = this.string(key);
        const match = /^(?:#|0x)(?<hex>[a-f0-9]{3}){1,2}$/i.exec(value ?? "");
        if (match) {
            return `#${match.groups?.hex.toLowerCase()}`;
        }
        return undefined;
    }
    clip() {
        const values = this.numbers("clip");
        if (values) {
            return {
                clipX: values[0],
                clipY: values[1],
                clipWidth: values[2],
                clipHeight: values[3],
            };
        }
        return undefined;
    }
    colsAndRows() {
        const grid = this.numbers("grid");
        if (grid) {
            return { cols: grid[0], rows: grid[1] };
        }
        const cols = this.number("cols");
        const rows = this.number("rows");
        if (cols !== undefined && rows !== undefined) {
            return { cols, rows };
        }
        return undefined;
    }
    gridOffset() {
        const pos = this.numbers("pos(ition)?", false);
        if (pos) {
            return { col: pos[0], row: pos[1] };
        }
        const col = this.number("col");
        const row = this.number("row");
        if (col !== undefined && row !== undefined) {
            return { col, row };
        }
        return undefined;
    }
    gridType(key) {
        return (this.string(key)?.match(/^(square|flat|pointy)$/i) ?? [])[0]?.toLowerCase();
    }
    number(keyOrRegex, pxOrUndefined) {
        let regex = keyOrRegex;
        if (typeof (pxOrUndefined) === "boolean" && typeof (keyOrRegex) === "string") {
            const px = pxOrUndefined ? "\\s*px" : "";
            regex = new RegExp(`^(${keyOrRegex})\\s*=\\s*\\d+${px}\\s*$`, "i");
        }
        const value = this.string(regex, true);
        if (value) {
            return +value.replace(/px/i, "").trim();
        }
        return undefined;
    }
    numbers(keyOrRegex, pxOrUndefined) {
        let regex = keyOrRegex;
        if (typeof (pxOrUndefined) === "boolean" && typeof (keyOrRegex) === "string") {
            const px = pxOrUndefined ? "\\s*px" : "";
            regex = new RegExp(`^(${keyOrRegex})\\s*=\\s*\\d+${px}(\\s*[x,]\\s*\\d+${px})+\\s*$`, "i");
        }
        const value = this.string(regex, true);
        if (value) {
            const numbers = value.replace(/px/gi, "").split(/[x,]/).map(s => +s.trim());
            const twoOrFour = numbers.length === 2 || numbers.length === 4;
            if (twoOrFour && !numbers.find(num => isNaN(num))) {
                return numbers;
            }
        }
        return undefined;
    }
    percent(key) {
        const value = this.string(key);
        if (value) {
            if (/^\d+\s*%\s*$/.test(value)) {
                return (+value.replace(/%/, "").trim()) / 100;
            }
            else if (!isNaN(+value)) {
                return +value;
            }
        }
        return undefined;
    }
    pixelOffset() {
        const pos = this.numbers(/^pos(ition)?=\s*\d+\s*px\s*[x,]\s*\d+\s*px\s*$/i);
        if (pos) {
            return { x: pos[0], y: pos[1] };
        }
        const x = this.number(/^(x|left)=/i);
        const y = this.number(/^(y|top)=/i);
        if (x !== undefined && y !== undefined) {
            return { x, y };
        }
        return undefined;
    }
    getScale(key) {
        const scaleString = this.string(key);
        const scalePercent = (scaleString?.match(/(\d+)\s*%/) ?? [])[1];
        const scaleDecimal = (scaleString?.match(/(\d+\.\d+|\.\d+|\d+)/) ?? [])[1];
        if (scalePercent) {
            return (+scalePercent) / 100;
        }
        return scaleDecimal ? +scaleDecimal : undefined;
    }
    scale() {
        const scale = this.getScale("scale");
        const scaleX = this.getScale("scaleX");
        const scaleY = this.getScale("scaleY");
        return scale || scaleX || scaleY
            ? { scale, scaleX, scaleY }
            : undefined;
    }
    get pixelDimensions() {
        const _widthAndHeight = this.numbers("size", true);
        const width = _widthAndHeight ? _widthAndHeight[0] : this.number("width");
        const height = _widthAndHeight ? _widthAndHeight[1] : this.number("height");
        return width && height ? { width, height } : undefined;
    }
    get gridDimensions() {
        const _colsAndRows = this.numbers("grid") ?? this.numbers("size", false);
        const cols = _colsAndRows ? _colsAndRows[0] : this.number("cols");
        const rows = _colsAndRows ? _colsAndRows[1] : this.number("rows");
        return cols && rows ? { cols, rows } : undefined;
    }
    size() {
        const pixelDimensions = this.pixelDimensions;
        const gridDimensions = this.gridDimensions;
        if (pixelDimensions || gridDimensions) {
            return { ...pixelDimensions, ...gridDimensions };
        }
        return undefined;
    }
    string(keyOrRegex, sliceOrUndefined) {
        const isKey = typeof (keyOrRegex) === "string";
        const regex = isKey ? new RegExp(`^(${keyOrRegex})=`, "i") : keyOrRegex;
        const slice = isKey ? true : sliceOrUndefined;
        let line = this.lines.find(_line => regex.test(_line));
        if (line) {
            if (slice && line.includes("=")) {
                line = line.slice(line.indexOf("=") + 1);
            }
            line = dequote(line.trim()).trim();
            return line;
        }
        return undefined;
    }
    url() {
        return this.string("url") ?? this.string(/^https?:\/\//i);
    }
    toAura() {
        const aura = this.toImage();
        aura.anchorId = this.string("anchor");
        aura.opacity = this.percent("opacity");
        return aura;
    }
    toGrid() {
        const gridColor = this.color("gridColor") ?? this.color("color");
        const gridType = this.gridType("gridType") ?? this.gridType("type") ?? "square";
        const colsAndRows = this.colsAndRows();
        const { cols, rows } = colsAndRows ?? {};
        const colKey = this.boolean("colKey") ?? this.boolean("key");
        const rowKey = this.boolean("rowKey") ?? this.boolean("key");
        const colKeyScale = this.number("colKeyScale") ?? this.number("keyScale");
        const rowKeyScale = this.number("rowKeyScale") ?? this.number("keyScale");
        return cols && rows ? { gridType, gridColor, cols, rows, colKey, rowKey, colKeyScale, rowKeyScale, width: 0, height: 0 } : undefined;
    }
    toMap() {
        const spawn = this.numbers("spawn");
        const map = {
            name: this.string("name"),
            spawn: spawn ? { col: spawn[0], row: spawn[1] } : undefined,
            user: this.string("user"),
        };
        if (!map.name) {
            debug(`MapSectionParser.toMap(): !name`);
            return undefined;
        }
        return map;
    }
    toMapAndBackgroundAndGrid() {
        const map = this.toMap();
        const image = this.toImage();
        const grid = this.toGrid();
        if (image && grid) {
            image.cols ??= grid.cols;
            image.rows ??= grid.rows;
        }
        return [map, image, grid];
    }
    toImage() {
        const imageData = {
            gridOffset: this.gridOffset(),
            id: randomSnowflake(),
            name: this.string("name"),
            pixelOffset: this.pixelOffset(),
            url: this.url(),
            userId: this.string("user"),
            ...this.clip(),
            ...this.scale(),
            ...this.size(),
        };
        if (!imageData.url || !imageData.name) {
            debug(`MapSectionParser.toImage(): !url (${!imageData.url}) || !name (${!imageData.name})`);
            return undefined;
        }
        return imageData;
    }
    static parse(raw) {
        const lines = raw.split(/\r?\n\r?/);
        const mapSection = sectionByLabel(lines, "map");
        if (mapSection) {
            const [map, bgImage, mapGrid] = mapSection.toMapAndBackgroundAndGrid();
            if (map) {
                const grid = mapGrid ?? sectionByLabel(lines, "grid")?.toGrid() ?? undefined;
                const background = sectionsByLabel(lines, "background").map(matcher => matcher.toImage()).filter(isDefined);
                if (bgImage) {
                    background.unshift(bgImage);
                }
                const terrain = sectionsByLabel(lines, "terrain").map(matcher => matcher.toImage()).filter(isDefined);
                const aura = sectionsByLabel(lines, "aura").map(matcher => matcher.toAura()).filter(isDefined);
                const token = sectionsByLabel(lines, "token").map(matcher => matcher.toImage()).filter(isDefined);
                return {
                    name: map.name,
                    spawn: map.spawn,
                    userId: map.user,
                    grid,
                    layers: {
                        background: { type: "background", id: randomSnowflake(), images: background },
                        terrain: { type: "terrain", id: randomSnowflake(), images: terrain },
                        aura: { type: "aura", id: randomSnowflake(), images: aura },
                        token: { type: "token", id: randomSnowflake(), images: token },
                    }
                };
            }
        }
        return undefined;
    }
}
function renderAuraCols(aura) {
    return [
        `<td>${aura.name}</td>`,
        `<td>${aura.anchor}</td>`,
        `<td>${aura.opacity}</td>`,
        `<td>${aura.size[0]}x${aura.size[1]}</td>`,
        `<td>${aura.gridOffset[0]},${aura.gridOffset[1]}</td>`,
    ].join("");
}
function showAura(aura) {
    $("#auraName").val(aura.name ?? "");
    const images = getImages("token");
    const options = images.map(image => `<option value="${image.name}" ${aura.anchor === image.name ? "selected='selected'" : ""}>${image.name}</option>`);
    $("#auraAnchor").html("<option value=''>None</option>").append(options.join(""));
    $("#auraOpacity").val(aura.opacity ?? "");
    $("#auraImageUrl").val(aura.url ?? "");
    $("#auraSizeCols").val(aura.size?.[0] ?? "");
    $("#auraSizeRows").val(aura.size?.[1] ?? "");
    $("#auraPositionCol").val(aura.gridOffset?.[0] ?? "");
    $("#auraPositionRow").val(aura.gridOffset?.[1] ?? "");
}
function createAura() {
    return {
        name: $str("#auraName"),
        anchor: $str("#auraAnchor"),
        opacity: $num("#auraOpacity"),
        url: $str("#auraImageUrl"),
        size: [$num("auraSizeCols"), $num("auraSizeRows")],
        gridOffset: [$num("auraPositionCol"), $num("auraPositionRow")],
    };
}
let canvasWidth = 0;
let pxPerCol = 0;
let canvasHeight = 0;
let pxPerRow = 0;
function resetCanvas(width = 0, height = 0) {
    const map = getActiveMap();
    const canvas = $el("canvasPreview")[0];
    canvasWidth = canvas.width = width;
    canvasHeight = canvas.height = height;
    pxPerCol = Math.floor(canvasWidth / map.grid[COL]);
    pxPerRow = Math.floor(canvasHeight / map.grid[ROW]);
}
function draw(image, colOffset = 0, rowOffset = 0, alpha) {
    if (!image?.url)
        return Promise.reject("Invalid Url.");
    return new Promise((resolve, reject) => {
        const img = $("<img/>")[0];
        img.onload = () => {
            const { width, height } = img;
            if (!canvasWidth || !canvasHeight) {
                resetCanvas(width, height);
            }
            const dx = ((image.gridOffset?.[COL] ?? 1) - 1 + colOffset) * pxPerCol;
            const dy = ((image.gridOffset?.[ROW] ?? 1) - 1 + rowOffset) * pxPerRow;
            const dw = (image.size?.[X] ?? 0) * pxPerCol || canvasWidth;
            const dh = (image.size?.[Y] ?? 0) * pxPerRow || canvasHeight;
            const canvas = $el("canvasPreview")[0];
            const context = canvas.getContext("2d");
            context.globalAlpha = alpha ?? 1;
            context.drawImage(img, 0, 0, width, height, dx, dy, dw, dh);
            resolve(true);
        };
        img.onerror = (...errs) => {
            console.error(...errs);
            reject(errs);
        };
        img.src = image.url;
    });
}
$((() => {
    $("body").on("error", "img", onImageError);
    $("#map-tab-pane input").on("change", onMapValueChange);
    $("#btnDownload").on("click", onDownloadClick);
    $("#btnImport").on("click", onImportClick);
    $("#btnLoadMap").on("click", loadMap);
    $("#btnDeleteMap").on("click", deleteMap);
    $("#btnNewMap").on("click", (() => addMap({ name: "New Map" })));
    $("[data-layer-index]").on("click", '[data-action="cancel"]', hideEditor);
    $("body").on("click", 'button[data-action="remove"][data-layer-index][data-image-index]', onImageRemove);
    $("body").on("click", 'button[data-action="copy"][data-layer-index][data-image-index]', onImageCopy);
    [[showTerrain, createTerrain], [showAura, createAura], [showToken, createToken]].forEach(([showFn, createFn], layerIndex) => {
        $(`[data-layer-index="${layerIndex}"]`).on("click", 'button[data-action="edit"]', ev => handleEditClick(ev, showFn));
        $(`[data-layer-index="${layerIndex}"]`).on("click", 'button[data-action="save"]', ev => handleSaveClick(ev, createFn));
    });
    loadMaps();
}));
function onMapValueChange() {
    const map = getActiveMap();
    map.name = $str("#mapName");
    map.background = { url: $str("#backroundImageUrl") };
    map.grid = [$num("gridCols"), $num("gridRows")];
    map.spawn = [$num("spawnCol"), $num("spawnRow")];
    saveMap();
    renderMap();
}
function onImageError(ev) {
    $(ev.target).replaceWith(`<div class="alert alert-danger m-0 p-0 ps-1 pe-1 text-center">!</div>`);
}
function onImageRemove(ev) {
    const map = getActiveMap();
    const { layerIndex, imageIndex } = getIndexes(ev);
    const layer = map.layers[layerIndex];
    const image = layer.images[imageIndex];
    if (!image)
        return;
    if (confirm(`Remove ${image.name}?`)) {
        layer.images.splice(imageIndex, 1);
        if (layerIndex !== 1) {
            const auraLayer = map.layers[1];
            auraLayer.images = auraLayer.images.filter(aura => aura.anchor !== image.name);
        }
        saveMap();
        renderMap();
    }
}
function onImageCopy(ev) {
    const map = getActiveMap();
    const { layerIndex, imageIndex } = getIndexes(ev);
    const layer = map.layers[layerIndex];
    const image = layer.images[imageIndex];
    if (!image)
        return;
    const imageClone = cloneJson(image);
    imageClone.gridOffset[0] += image.size[0],
        imageClone.gridOffset[1] += image.size[1];
    const { name, replacer } = renameDuplicate(imageClone, layer.images, "alpha") ?? {};
    if (name) {
        imageClone.name = name;
    }
    layer.images.splice(imageIndex + 1, 0, imageClone);
    if (replacer && layerIndex !== 1) {
        const images = map.layers[1].images;
        for (let i = images.length; i--;) {
            const aura = images[i];
            if (aura.anchor === image.name) {
                const auraClone = cloneJson(aura);
                auraClone.name = replacer(auraClone.name);
                auraClone.anchor = imageClone.name;
                images.splice(i + 1, 0, auraClone);
            }
        }
    }
    saveMap();
    renderMap();
}
function onDownloadClick() {
    const map = getActiveMap();
    const fileName = (map?.name ?? "Untitled Map").replace(/[^a-zA-Z0-9]+/g, "") + ".map.txt";
    const raw = jsonToText(map);
    const blob = new Blob([raw], { type: "plain/text" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.setAttribute("href", url);
    el.setAttribute("download", fileName);
    el.style.display = "none";
    el.click();
    document.body.removeChild(el);
}
function onImportClick() {
    addMap(textToJson($str("#txtPayload")));
    renderMap();
}
function getIndexes(ev) {
    const getIndex = (type) => {
        const key = `data-${type}-index`;
        const el = $(ev.target).closest(`[${key}]`);
        return el.length ? +el.attr(key) : -1;
    };
    return {
        layerIndex: getIndex("layer"),
        imageIndex: getIndex("image")
    };
}
function hideEditor(ev) {
    const { layerIndex } = getIndexes(ev);
    const el = $(`[data-layer-index="${layerIndex}"]`);
    el.find('[data-action="form"]').addClass("d-none");
    el.find('[data-action="list"]').removeClass("d-none");
}
function showEditor(ev) {
    const { layerIndex } = getIndexes(ev);
    const el = $(`[data-layer-index="${layerIndex}"]`);
    el.find('[data-action="form"]').removeClass("d-none");
    el.find('[data-action="list"]').addClass("d-none");
}
function saveChanges(ev) {
    saveMap();
    renderMap();
    hideEditor(ev);
}
function handleEditClick(ev, handler) {
    const { layerIndex, imageIndex } = getIndexes(ev);
    __imageIndex = imageIndex;
    const map = getActiveMap();
    const layers = map.layers ??= [];
    const layer = layers[layerIndex] ??= { images: [] };
    const images = layer.images ??= [];
    const image = images[imageIndex] ??= {};
    handler(image);
    showEditor(ev);
}
function handleSaveClick(ev, handler) {
    const { layerIndex } = getIndexes(ev);
    const map = getActiveMap();
    const imageIndex = __imageIndex < 0 ? map.layers[layerIndex].images.length : __imageIndex;
    map.layers[layerIndex].images[imageIndex] = handler();
    saveChanges(ev);
}
function jsonToText(map) {
    try {
        const lines = [];
        lines.push("[map]");
        lines.push(map.background.url ?? "");
        lines.push(`name=${map.name ?? ""}`);
        lines.push(`grid=${map.grid[0]}x${map.grid[1]}`);
        lines.push(`spawn=${map.spawn[0]},${map.spawn[1]}`);
        (map.layers[0].images ?? []).forEach(img => {
            lines.push("");
            lines.push("[terrain]");
            lines.push(img.url ?? "");
            lines.push(`name=${img.name ?? ""}`);
            lines.push(`size=${img.size[0]}x${img.size[1]}`);
            lines.push(`position=${img.gridOffset[0]},${img.gridOffset[1]}`);
        });
        (map.layers[1].images ?? []).forEach(img => {
            lines.push("");
            lines.push("[aura]");
            lines.push(img.url ?? "");
            lines.push(`name=${img.name ?? ""}`);
            lines.push(`anchor=${img.anchor ?? ""}`);
            lines.push(`opacity=${img.opacity ?? ""}`);
            lines.push(`size=${img.size[0]}x${img.size[1]}`);
            lines.push(`position=${img.gridOffset[0]},${img.gridOffset[1]}`);
        });
        (map.layers[2].images ?? []).forEach(img => {
            lines.push("");
            lines.push("[token]");
            lines.push(img.url ?? "");
            lines.push(`name=${img.name ?? ""}`);
            lines.push(`size=${img.size[0]}x${img.size[1]}`);
            lines.push(`position=${img.gridOffset[0]},${img.gridOffset[1]}`);
            lines.push(`user=${img.user ?? ""}`);
        });
        return lines.join("\n");
    }
    catch (ex) {
        console.error(ex);
        return `[error]\nmessage=${ex.message}`;
    }
}
function parseImage(image, anchors) {
    let { name, url, cols, rows, gridOffset, userId, anchorId, opacity } = image;
    if (gridOffset && anchorId && anchors) {
        const anchor = anchors.find(a => a.name === anchorId);
        if (anchor) {
            gridOffset = {
                col: (cols - anchor.size[COL]) / -2,
                row: (rows - anchor.size[ROW]) / -2,
            };
        }
    }
    return {
        name,
        url,
        size: [cols, rows],
        gridOffset: [gridOffset?.col ?? 0, gridOffset?.row ?? 0],
        user: userId,
        anchor: anchorId,
        opacity
    };
}
function textToJson(raw) {
    const map = MapSectionParser.parse(raw);
    const tokens = map.layers.token?.images.map((e => parseImage(e))) ?? [];
    return {
        background: {
            url: map.layers.background?.images[0].url
        },
        name: map.name,
        grid: [map.grid.cols, map.grid.rows],
        spawn: [map.spawn.col, map.spawn.row],
        layers: [
            { images: map.layers.terrain?.images.map((e => parseImage(e))) ?? [] },
            { images: map.layers.aura?.images.map((e => parseImage(e, tokens))) ?? [] },
            { images: tokens }
        ]
    };
}
const LayerKeys = ["terrain", "aura", "token"];
function getImages(layerKey) {
    const layerIndex = LayerKeys.indexOf(layerKey);
    return getActiveMap().layers[layerIndex].images;
}
const __maps = [];
let __imageIndex;
let __activeMapIndex = 0;
function getActiveMap() {
    const activeMap = __maps[__activeMapIndex] ??= {};
    activeMap.name ??= "";
    activeMap.background ??= { url: "" };
    activeMap.grid ??= [0, 0];
    activeMap.spawn ??= [0, 0];
    activeMap.layers ??= [];
    ["terrain", "aura", "token"].forEach((_, layerIndex) => {
        activeMap.layers[layerIndex] ??= { images: [] };
        activeMap.layers[layerIndex].images ??= [];
        activeMap.layers[layerIndex].images.forEach(image => {
            image.size ??= [0, 0];
            image.gridOffset ??= [0, 0];
        });
    });
    return activeMap;
}
function saveMaps() {
    let count = +localStorage.getItem("maps.length") || 0;
    for (; count--;)
        localStorage.removeItem(`maps.${count}`);
    localStorage.removeItem("maps.length");
    localStorage.removeItem("maps.index");
    localStorage.setItem("maps.length", String(__maps.length));
    __maps.forEach((map, index) => localStorage.setItem(`maps.${index}`, JSON.stringify(map)));
    localStorage.setItem("maps.index", String(__activeMapIndex));
}
function loadMaps() {
    __maps.length = 0;
    const count = +localStorage.getItem("maps.length") || 0;
    for (let i = 0; i < count; i++) {
        const mapString = localStorage.getItem(`maps.${i}`);
        const map = mapString ? JSON.parse(mapString) : undefined;
        if (map)
            __maps.push(map);
    }
    __activeMapIndex = +localStorage.getItem("maps.index") || 0;
    listMaps();
    renderMap();
}
function listMaps() {
    const el = $("#selMaps").html("");
    __maps.forEach((map, index) => el.append(`<option value="${index}" ${index === __activeMapIndex ? "selected=selected" : ""}>${map.name}</option>`));
}
function saveMap() {
    localStorage.setItem(`maps.${__activeMapIndex}`, JSON.stringify(__maps[__activeMapIndex]));
    localStorage.setItem("maps.index", String(__activeMapIndex));
    localStorage.setItem("maps.length", String(__maps.length));
    listMaps();
}
function addMap(map) {
    renameDuplicate(map, __maps);
    __activeMapIndex = __maps.length;
    __maps.push(map);
    saveMap();
    renderMap();
    setTab("map");
}
function loadMap() {
    __activeMapIndex = $num("selMaps");
    localStorage.setItem("maps.index", String(__activeMapIndex));
    renderMap();
    setTab("map");
}
function deleteMap() {
    const index = $num("selMaps");
    const map = __maps[index];
    if (map) {
        if (confirm(`Delete ${map.name}?`)) {
            __maps.splice(index, 1);
            if (index === __activeMapIndex) {
                __activeMapIndex = 0;
            }
            saveMaps();
            listMaps();
            renderMap();
        }
    }
}
const renameDuplicate = (() => {
    function escapeRegex(value) {
        const chars = "$()*+./?[]\\^{}|";
        return value.split("").map(s => chars.includes(s) ? `\\${s}` : s).join("");
    }
    const alphaRegex = /(\s+(?<suffix>[A-Z]{1,2}))?$/;
    const numberRegex = /(\s+\#(?<suffix>\d+))?$/;
    function getRegexAndMethod(which = "number") {
        if (which === "number")
            return { regex: numberRegex, method: nextNumeric };
        if (which === "alpha")
            return { regex: alphaRegex, method: nextNamed, suffixes: getAlphaList() };
        const escaped = which.map(value => escapeRegex(value));
        const regex = new RegExp(`(\\s+(?<suffix>${escaped.join("|")}))?$`);
        return { regex, method: nextNamed, suffixes: which.slice() };
    }
    function namesMatch(a, b, regex) {
        return a.replace(regex, "").toLowerCase() === b.replace(regex, "").toLowerCase();
    }
    function nextNumeric(names) {
        let last = 0;
        names.forEach(name => {
            const { suffix } = numberRegex.exec(name)?.groups ?? {};
            const num = +(suffix ?? 0);
            last = Math.max(last, num);
        });
        return `#${last + 1}`;
    }
    function getAlphaList() {
        const aToZ = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const aToZZ = aToZ.slice();
        aToZ.forEach(left => aToZ.forEach(right => aToZZ.push(left + right)));
        return aToZZ;
    }
    function nextNamed(names, regex, suffixes = []) {
        let last = -1;
        names.forEach(name => {
            const { suffix } = regex.exec(name)?.groups ?? {};
            const index = suffixes.indexOf(suffix);
            console.log({ suffix, index });
            last = Math.max(last, index);
        });
        return suffixes[last + 1];
    }
    function resolveName(resolvable) {
        const name = typeof (resolvable) === "string" ? resolvable : resolvable.name;
        return name.trim();
    }
    function renameDuplicate(resolvable, others, type) {
        const original = resolveName(resolvable);
        const names = others.map(resolveName);
        const { regex, method, suffixes } = getRegexAndMethod(type);
        const matches = names.filter(other => namesMatch(original, other, regex));
        if (matches.length) {
            const suffix = method(matches, regex, suffixes);
            const replacer = (name) => name.replace(regex, ` ${suffix}`);
            const name = replacer(original);
            return { suffix, replacer, name };
        }
        return undefined;
    }
    return renameDuplicate;
})();
function renderMap() {
    renderMeta();
    const colRenderers = [renderTerrainCols, renderAuraCols, renderTokenCols];
    LayerKeys.forEach((layerKey, layerIndex) => {
        const images = getImages(layerKey);
        const rowHtml = images.map((image, imageIndex) => [
            `<tr>`,
            colRenderers[layerIndex](image),
            `<td class="text-end">`,
            `<img src="${image.url}" style="height:25px;"/>`,
            `<button type="button" class="btn btn-sm btn-primary p-0 ps-1 pe-1" data-action="edit" data-layer-index="${layerIndex}" data-image-index="${imageIndex}">&#8230;</button>`,
            `<button type="button" class="btn btn-sm btn-success p-0 ps-1 pe-1" data-action="copy" data-layer-index="${layerIndex}" data-image-index="${imageIndex}">+</button>`,
            `<button type="button" class="btn btn-sm btn-danger p-0 ps-1 pe-1" data-action="remove" data-layer-index="${layerIndex}" data-image-index="${imageIndex}">X</button>`,
            `</td>`,
            `</tr>`,
        ].join(""));
        const html = rowHtml.join("");
        const layerBody = $(`div[data-layer-index="${layerIndex}"] div[data-action="list"] tbody`);
        layerBody.html(html);
    });
    renderPayloads();
    renderPreview();
}
function renderMeta() {
    const map = getActiveMap();
    $("h5").html(`Preview: ${map.name ?? "<i>unnamed</i>"}`),
        $("#mapName").val(map.name ?? ""),
        $("#backroundImageUrl").val(map.background.url ?? ""),
        $("#gridCols").val(map.grid[0] ?? ""),
        $("#gridRows").val(map.grid[1] ?? ""),
        $("#spawnCol").val(map.spawn[0] ?? ""),
        $("#spawnRow").val(map.spawn[1] ?? "");
}
function renderPayloads() {
    const map = getActiveMap();
    $("#jsonPayload").val(JSON.stringify(map));
    $("#txtPayload").val(jsonToText(map));
}
async function renderPreview() {
    const map = getActiveMap();
    resetCanvas();
    const bgDrawn = await draw({ url: map.background.url }).catch((() => false));
    if (!bgDrawn) {
        $("#canvasPreview").closest(".border").addClass("d-none");
        $(".alert-no-bg-image").removeClass("d-none");
        return;
    }
    $("#canvasPreview").closest(".border").removeClass("d-none"),
        $(".alert-no-bg-image").addClass("d-none");
    for (const layer of map.layers) {
        for (const image of layer.images) {
            if (image) {
                let colOffset = 0;
                let rowOffset = 0;
                if (image.anchor) {
                    const anchor = map.layers[0].images.find((terrain => terrain.name === image.anchor))
                        ?? map.layers[2].images.find((e => e.name === image.anchor));
                    if (anchor) {
                        [colOffset, rowOffset] = anchor.gridOffset ?? [];
                    }
                }
                const alpha = image.opacity
                    ? String(image.opacity).endsWith("%") ? +String(image.opacity).match(/\d+/)[0] / 100 : +image.opacity
                    : undefined;
                await draw(image, colOffset, rowOffset, alpha).catch((() => false));
            }
        }
    }
}
function renderTerrainCols(terrain) {
    return [
        `<td>${terrain.name}</td>`,
        `<td>${terrain.size[0]}x${terrain.size[1]}</td>`,
        `<td>${terrain.gridOffset[0]},${terrain.gridOffset[1]}</td>`,
    ].join("");
}
function showTerrain(terrain) {
    $("#terrainName").val(terrain.name ?? "");
    $("#terrainImageUrl").val(terrain.url ?? "");
    $("#terrainSizeCols").val(terrain.size?.[0] ?? "");
    $("#terrainSizeRows").val(terrain.size?.[1] ?? "");
    $("#terrainPositionCol").val(terrain.gridOffset?.[0] ?? "");
    $("#terrainPositionRow").val(terrain.gridOffset?.[1] ?? "");
}
function createTerrain() {
    return {
        name: $str("#terrainName"),
        url: $str("#terrainImageUrl"),
        size: [$num("terrainSizeCols"), $num("terrainSizeRows")],
        gridOffset: [$num("terrainPositionCol"), $num("terrainPositionRow")],
    };
}
function renderTokenCols(token) {
    return [
        `<td>${token.name}</td>`,
        `<td>${token.size[0]}x${token.size[1]}</td>`,
        `<td>${token.gridOffset[0]},${token.gridOffset[1]}</td>`,
        `<td>${token.user ?? ""}</td>`,
    ].join("");
}
function showToken(token) {
    $("#tokenName").val(token.name ?? "");
    $("#tokenImageUrl").val(token.url ?? "");
    $("#tokenSizeCols").val(token.size?.[0] ?? "");
    $("#tokenSizeRows").val(token.size?.[1] ?? "");
    $("#tokenPositionCol").val(token.gridOffset?.[0] ?? "");
    $("#tokenPositionRow").val(token.gridOffset?.[1] ?? "");
    $("#tokenUser").val(token.user ?? "");
}
function createToken() {
    return {
        name: $str("#tokenName"),
        url: $str("#tokenImageUrl"),
        size: [$num("tokenSizeCols"), $num("tokenSizeRows")],
        gridOffset: [$num("tokenPositionCol"), $num("tokenPositionRow")],
        user: $str("#tokenUser"),
    };
}
const COL = 0;
const ROW = 1;
const X = 0;
const Y = 1;
const WIDTH = 0;
const HEIGHT = 1;
function $el(elementId) {
    const el = $(`#${elementId.replace(/^#/, "")}`);
    return el.length ? el : undefined;
}
function $val(elementId) {
    return $el(elementId)?.val();
}
function $num(elementId) {
    const val = $val(elementId);
    return isDefined(val) ? +val : undefined;
}
function $str(elementId) {
    const val = $val(elementId);
    return isDefined(val) ? String(val) : undefined;
}
function allDefined(...values) {
    return values.every(isDefined);
}
function anyDefined(...values) {
    return values.some(isDefined);
}
function isBoolean(value) {
    return typeof (value) === "boolean";
}
function isDefined(value) {
    return value !== null && value !== undefined;
}
function isString(value) {
    return typeof (value) === "string";
}
function debug(...args) {
    console.debug(...args);
}
function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}
function dequote(value) {
    const match = /^"(?<inner>.*?)"$/.exec(value);
    return match?.groups?.inner ?? value;
}
function setTab(base) {
    bootstrap.Tab.getOrCreateInstance(`#${base}-tab`).show();
}
const randomSnowflake = (() => {
    const EPOCH = 1420070400000;
    let gSequence = 0;
    let lastTs = -1;
    return (options = {}) => {
        let ts = Date.now();
        if (ts < lastTs)
            throw new Error(`Invalid Clock Ticks`);
        let { epoch = EPOCH, nodeId = 1, sequence } = options;
        if (epoch < 0 || epoch > ts)
            throw new Error(`Invalid Epoch`);
        if (nodeId < 0 || nodeId > 1023)
            throw new Error(`Invalid NodeId`);
        if (ts === lastTs) {
            sequence ??= gSequence;
            sequence = (sequence + 1) & 4095;
            if (sequence === 0) {
                while (ts <= lastTs)
                    ts = Date.now();
            }
        }
        else {
            sequence ??= 0;
        }
        lastTs = ts;
        gSequence = sequence;
        const snowflake = (BigInt(ts - epoch) << 22n)
            | (BigInt(nodeId) >> 12n)
            | BigInt(sequence);
        return snowflake.toString();
    };
})();
