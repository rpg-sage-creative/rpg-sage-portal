
let canvasWidth = 0;
let pxPerCol = 0;
let canvasHeight = 0;
let pxPerRow = 0;
function resetCanvas(width = 0, height = 0) {
	const map = getActiveMap();
	const canvas = $el<HTMLCanvasElement>("canvasPreview")[0];
	canvasWidth = canvas.width = width;
	canvasHeight = canvas.height = height;
	pxPerCol = Math.floor(canvasWidth / map.grid[COL]);
	pxPerRow = Math.floor(canvasHeight / map.grid[ROW]);
}

type RenderableImage = {
	name?: string;
	url: string;
	size?: NumberPair;
	gridOffset?: NumberPair;
};

function draw(image?: RenderableImage, colOffset = 0, rowOffset = 0, alpha?: number): Promise<boolean> {
	if (!image?.url) return Promise.reject("Invalid Url.");

	return new Promise((resolve, reject) => {
		const img = $<HTMLImageElement>("<img/>")[0];
		img.onload = () => {
			const { width, height } = img;

			if (!canvasWidth || !canvasHeight) {
				resetCanvas(width, height);
			}

			const dx = ((image.gridOffset?.[COL] ?? 1) - 1 + colOffset) * pxPerCol;
			const dy = ((image.gridOffset?.[ROW] ?? 1) - 1 + rowOffset) * pxPerRow;
			const dw = (image.size?.[X] ?? 0) * pxPerCol || canvasWidth;
			const dh = (image.size?.[Y] ?? 0) * pxPerRow || canvasHeight;

			const canvas = $el<HTMLCanvasElement>("canvasPreview")[0];
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