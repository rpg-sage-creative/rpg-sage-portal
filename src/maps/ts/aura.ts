type RenderableAura = RenderableImage & {
	anchor: string;
	opacity: number;
};

function renderAuraCols(aura: RenderableAura) {
	return [
		`<td>${aura.name}</td>`,
		`<td>${aura.anchor}</td>`,
		`<td>${aura.opacity}</td>`,
		`<td>${aura.size[0]}x${aura.size[1]}</td>`,
		`<td>${aura.gridOffset[0]},${aura.gridOffset[1]}</td>`,
	].join("");
}

function showAura(aura: RenderableAura) {
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

function createAura(): RenderableAura {
	return {
		name: $str("#auraName"),
		anchor: $str("#auraAnchor"),
		opacity: $num("#auraOpacity"),
		url: $str("#auraImageUrl"),
		size: [$num("auraSizeCols"), $num("auraSizeRows")],
		gridOffset: [$num("auraPositionCol"), $num("auraPositionRow")],
	};
}