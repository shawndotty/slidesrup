import { Notice } from "obsidian";
import { SlidesRupError } from "./error";

export function log_update(msg: string): void {
	const notice = new Notice("", 15000);
	// TODO: Find better way for this
	// @ts-ignore
	notice.messageEl.innerHTML = `<b>SlidesRup Assistant update</b>:<br/>${msg}`;
}

export function log_error(e: Error | SlidesRupError): void {
	const notice = new Notice("", 8000);
	if (e instanceof SlidesRupError && e.console_msg) {
		// TODO: Find a better way for this
		// @ts-ignore
		notice.messageEl.innerHTML = `<b>SlidesRup Assistant Error</b>:<br/>${e.message}<br/>Check console for more information`;
		console.error(
			`SlidesRup Assistant Error:`,
			e.message,
			"\n",
			e.console_msg
		);
	} else {
		// @ts-ignore
		notice.messageEl.innerHTML = `<b>SlidesRup Assistant Error</b>:<br/>${e.message}`;
	}
}
