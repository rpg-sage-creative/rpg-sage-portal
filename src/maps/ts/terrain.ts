type RenderableTerrain = RenderableImage;

function renderTerrainCols(terrain: RenderableTerrain) {
	return [
		`<td>${terrain.name}</td>`,
		`<td>${terrain.size[0]}x${terrain.size[1]}</td>`,
		`<td>${terrain.gridOffset[0]},${terrain.gridOffset[1]}</td>`,
	].join("");
}

function showTerrain(terrain: RenderableTerrain) {
	$("#terrainName").val(terrain.name ?? "");
	$("#terrainImageUrl").val(terrain.url ?? "");
	$("#terrainSizeCols").val(terrain.size?.[0] ?? "");
	$("#terrainSizeRows").val(terrain.size?.[1] ?? "");
	$("#terrainPositionCol").val(terrain.gridOffset?.[0] ?? "");
	$("#terrainPositionRow").val(terrain.gridOffset?.[1] ?? "");
}

function createTerrain(): RenderableTerrain {
	return {
		name: $str("#terrainName"),
		url: $str("#terrainImageUrl"),
		size: [$num("terrainSizeCols"), $num("terrainSizeRows")],
		gridOffset: [$num("terrainPositionCol"), $num("terrainPositionRow")],
	};
}