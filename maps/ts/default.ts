
$((() => {
	$("body").on("error", "img", onImageError);
	$("#map-tab-pane input").on("change", onMapValueChange);
	$("#btnDownload").on("click", onDownloadClick);
	$("#btnImport").on("click", onImportClick);
	$("#btnLoadMap").on("click", loadMap);
	$("#btnDeleteMap").on("click", deleteMap);
	$("#btnNewMap").on("click", (() => addMap({ name: "New Map" } as any)));
	$("[data-layer-index]").on("click" as any, '[data-action="cancel"]', hideEditor);
	$("body").on("click" as any, 'button[data-action="remove"][data-layer-index][data-image-index]', onImageRemove);
	$("body").on("click" as any, 'button[data-action="copy"][data-layer-index][data-image-index]', onImageCopy);
	[[showTerrain, createTerrain], [showAura, createAura], [showToken, createToken]].forEach(([showFn, createFn], layerIndex) => {
		$(`[data-layer-index="${layerIndex}"]`).on("click", 'button[data-action="edit"]', ev => handleEditClick(ev, showFn));
		$(`[data-layer-index="${layerIndex}"]`).on("click", 'button[data-action="save"]', ev => handleSaveClick(ev, createFn));
	});
	loadMaps();
}));
