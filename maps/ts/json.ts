function jsonToText(map: SageMap): string {
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
	} catch (ex) {
		console.error(ex);
		return `[error]\nmessage=${ex.message}`;
	}
}

function parseImage(image: GameMapImage | GameMapAura, anchors?: RenderableImage[]): RenderableTerrain | RenderableAura | RenderableToken {
	let { name, url, cols, rows, gridOffset, userId, anchorId, opacity } = image as GameMapAura;
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

function textToJson(raw: string): SageMap {
	const map = MapSectionParser.parse(raw);
	const tokens = map.layers.token?.images.map((e => parseImage(e))) ?? [];
	return {
		background: {
			url:map.layers.background?.images[0].url
		},
		name: map.name,
		grid: [map.grid.cols, map.grid.rows],
		spawn: [map.spawn.col, map.spawn.row],
		layers: [
			{ images: map.layers.terrain?.images.map((e => parseImage(e))) as any ?? [] },
			{ images: map.layers.aura?.images.map((e => parseImage(e, tokens))) ?? [] },
			{ images: tokens }
		]
	}
}