//#region jquery values

function $el<T extends HTMLElement>(elementId: string): JQuery<T> | undefined {
	const el = $<T>(`#${elementId.replace(/^#/, "")}`);
	return el.length ? el : undefined;
}

/** Gets the value of the element if the element is defined. */
function $val(elementId: string): string | number | string[] | undefined {
	return $el(elementId)?.val();
}

/** Gets the value of the element and forces it to a number. */
function $num(elementId: string): number | undefined {
	const val = $val(elementId);
	return isDefined(val) ? +val : undefined;
}

/** Gets the value of the element and forces it to a string. */
function $str(elementId: string): string | undefined {
	const val = $val(elementId);
	return isDefined(val) ? String(val) : undefined;
}

//#endregion

//#region typeguards

function allDefined(...values: unknown[]): boolean {
	return values.every(isDefined);
}

function anyDefined(...values: unknown[]): boolean {
	return values.some(isDefined);
}

function isBoolean(value: unknown): value is boolean {
	return typeof(value) === "boolean";
}

function isDefined<T>(value: T | undefined | null): value is T {
	return value !== null && value !== undefined;
}

function isString(value: unknown): value is string {
	return typeof(value) === "string";
}

//#endregion

//#region debugging
function debug(...args: any[]) {
	console.debug(...args);
}
//#endregion

function cloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

function dequote(value: string) : string{
	const match = /^"(?<inner>.*?)"$/.exec(value);
	return match?.groups?.inner ?? value;
}

function setTab(base: string) {
	bootstrap.Tab.getOrCreateInstance(`#${base}-tab`).show();
}

const randomSnowflake = (() => {
	const EPOCH = 1420070400000;

	let gSequence = 0;
	let lastTs = -1;

	type Options = {
		epoch?: number;
		nodeId?: number;
		sequence?: number;
	};

	return (options: Options = {}) => {
		let ts = Date.now();
		if (ts < lastTs) throw new Error(`Invalid Clock Ticks`);

		let { epoch = EPOCH, nodeId = 1, sequence } = options;
		if (epoch < 0 || epoch > ts) throw new Error(`Invalid Epoch`);
		if (nodeId < 0 || nodeId > 1023) throw new Error(`Invalid NodeId`);

		if (ts === lastTs) {
			sequence ??= gSequence;
			sequence = (sequence + 1) & 4095;
			if (sequence === 0) {
				while (ts <= lastTs) ts = Date.now();
			}
		}else {
			sequence ??= 0;
		}

		lastTs = ts;
		gSequence = sequence;

		const snowflake = (BigInt(ts - epoch) << 22n)
			| (BigInt(nodeId) >> 12n)
			| BigInt(sequence);

		return snowflake.toString();
	}
})();