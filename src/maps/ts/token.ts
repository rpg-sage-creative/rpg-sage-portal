

type RenderableToken = RenderableImage & {
	user: string;
};

function renderTokenCols(token: RenderableToken) {
	return [
		`<td>${token.name}</td>`,
		`<td>${token.size[0]}x${token.size[1]}</td>`,
		`<td>${token.gridOffset[0]},${token.gridOffset[1]}</td>`,
		`<td>${token.user ?? ""}</td>`,
	].join("");
}

function showToken(token: RenderableToken) {
	$("#tokenName").val(token.name ?? "");
	$("#tokenImageUrl").val(token.url ?? "");
	$("#tokenSizeCols").val(token.size?.[0] ?? "");
	$("#tokenSizeRows").val(token.size?.[1] ?? "");
	$("#tokenPositionCol").val(token.gridOffset?.[0] ?? "");
	$("#tokenPositionRow").val(token.gridOffset?.[1] ?? "");
	$("#tokenUser").val(token.user ?? "");
}

function createToken(): RenderableToken {
	return {
		name: $str("#tokenName"),
		url: $str("#tokenImageUrl"),
		size: [$num("tokenSizeCols"), $num("tokenSizeRows")],
		gridOffset: [$num("tokenPositionCol"), $num("tokenPositionRow")],
		user: $str("#tokenUser"),
	};
}