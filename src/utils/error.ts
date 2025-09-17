import { log_error } from "./log";

export class SlidesRupError extends Error {
	constructor(msg: string, public console_msg?: string) {
		super(msg);
		this.name = this.constructor.name;
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

export async function errorWrapper<T>(
	fn: () => Promise<T>,
	msg: string
): Promise<T> {
	try {
		return await fn();
	} catch (e) {
		if (!(e instanceof SlidesRupError)) {
			log_error(new SlidesRupError(msg, e.message));
		} else {
			log_error(e);
		}
		throw new SlidesRupError(msg, e.message);
	}
}

export function errorWrapperSync<T>(fn: () => T, msg: string): T {
	try {
		return fn();
	} catch (e) {
		log_error(new SlidesRupError(msg, e.message));
		throw new SlidesRupError(msg, e.message);
	}
}
