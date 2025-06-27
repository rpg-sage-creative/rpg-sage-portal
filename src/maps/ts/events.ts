type JQueryEvent = JQuery.EventBase | JQuery.ClickEvent;

function onMapValueChange() {
	const map = getActiveMap();
	map.name = $str("#mapName");
	map.background = { url: $str("#backroundImageUrl") };
	map.grid = [$num("gridCols"), $num("gridRows")];
	map.spawn = [$num("spawnCol"), $num("spawnRow")];
	saveMap();
	renderMap();
}

function onImageError(ev: JQueryEvent) {
	$(ev.target).replaceWith(`<div class="alert alert-danger m-0 p-0 ps-1 pe-1 text-center">!</div>`);
}

function onImageRemove(ev: JQueryEvent) {
	const map = getActiveMap();
	const { layerIndex, imageIndex } = getIndexes(ev);
	const layer = map.layers[layerIndex];
	const image = layer.images[imageIndex];
	if (!image) return;

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

function onImageCopy(ev: JQueryEvent) {
	const map = getActiveMap();
	const { layerIndex, imageIndex } = getIndexes(ev);
	const layer = map.layers[layerIndex];
	const image = layer.images[imageIndex];
	if (!image) return;

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

function getIndexes(ev: JQueryEvent) {
	const getIndex = (type: "layer" | "image") => {
		const key = `data-${type}-index`;
		const el = $(ev.target).closest(`[${key}]`);
		return el.length ? +el.attr(key) : -1;
	};
	return {
		layerIndex: getIndex("layer"),
		imageIndex: getIndex("image")
	};
}

function hideEditor(ev: JQueryEvent) {
	const { layerIndex } = getIndexes(ev);
	const layerAttr = `[data-layer-index="${layerIndex}"]`;
	$hide(`${layerAttr} [data-action="form"]`);
	$show(`${layerAttr} [data-action="list"]`);
}

function showEditor(ev: JQueryEvent) {
	const { layerIndex } = getIndexes(ev);
	const layerAttr = `[data-layer-index="${layerIndex}"]`;
	$show(`${layerAttr} [data-action="form"]`);
	$hide(`${layerAttr} [data-action="list"]`);
}

function saveChanges(ev: JQueryEvent) {
	saveMap();
	renderMap();
	hideEditor(ev);
}

function handleEditClick(ev: JQueryEvent, handler: Function) {
	const { layerIndex, imageIndex } = getIndexes(ev);
	__imageIndex = imageIndex;
	const map = getActiveMap();
	const layers = map.layers ??= [];
	const layer = layers[layerIndex] ??= { images:[] };
	const images = layer.images ??= [];
	const image = images[imageIndex] ??= {} as any;
	handler(image);
	showEditor(ev);
}

function handleSaveClick(ev: JQueryEvent, handler: Function) {
	const { layerIndex } = getIndexes(ev);
	const map = getActiveMap();
	const imageIndex = __imageIndex < 0 ? map.layers[layerIndex].images.length : __imageIndex;
	map.layers[layerIndex].images[imageIndex] = handler();
	saveChanges(ev);
}