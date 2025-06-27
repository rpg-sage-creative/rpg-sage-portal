type LayerKey = "terrain" | "aura" | "token";
const LayerKeys = ["terrain", "aura", "token"] as LayerKey[];

/** gets images for the given layer from the active map */
function getImages(layerKey: LayerKey) {
	const layerIndex = LayerKeys.indexOf(layerKey);
	return getActiveMap().layers[layerIndex].images;
}

const __maps: SageMap[] = [];
let __imageIndex: number;
let __activeMapIndex = 0;

function getActiveMap() {
	const activeMap = __maps[__activeMapIndex] ??= { } as SageMap;
	activeMap.name ??= "";
	activeMap.background ??= { url:"" };
	activeMap.grid ??= [0, 0];
	activeMap.spawn ??= [0, 0];
	activeMap.layers ??= [];
	["terrain", "aura", "token"].forEach((_, layerIndex) => {
		activeMap.layers[layerIndex] ??= { images:[] };
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
		if (map) __maps.push(map);
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

function addMap(map: SageMap) {
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