//#region jquery values
type ElementResolvable = string | Element | JQuery;

function $el<T extends HTMLElement>(selector: ElementResolvable): JQuery<T> | undefined {
	const el = typeof(selector) === "string"
		? $<T>(/^[\w\-]+$/.test(selector) ? `#${selector.replace(/^#/, "")}` : selector)
		: $<T>(selector as JQuery<T>);
	return el.length ? el : undefined;
}

/** Gets the value of the element if the element is defined. */
function $val(selector: ElementResolvable): string | number | string[] | undefined {
	return $el(selector)?.val();
}

/** Gets the value of the element and forces it to a number. */
function $num(selector: ElementResolvable): number | undefined {
	const val = $val(selector);
	return isDefined(val) ? +val : undefined;
}

/** Gets the value of the element and forces it to a string. */
function $str(selector: ElementResolvable): string | undefined {
	const val = $val(selector);
	return isDefined(val) ? String(val) : undefined;
}

//#endregion

//#region bootstrap

function $hide(selector: ElementResolvable) {
	return $el(selector)?.addClass("d-none");
}

function $show(selector: ElementResolvable) {
	return $el(selector)?.removeClass("d-none");
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