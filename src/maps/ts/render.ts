
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
	$("#spawnRow").val(map.spawn[1] ?? "")
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
		$hide($("#canvasPreview").closest(".border"));
		$show(".alert-no-bg-image");
		return;
	}

	$show($("#canvasPreview").closest(".border")),
	$hide(".alert-no-bg-image");

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