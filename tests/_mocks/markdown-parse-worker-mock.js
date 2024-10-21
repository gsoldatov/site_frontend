import parse from "../../src/util/markdown/markdown-parser";
export default class Worker {
    postMessage(raw) {
        const parsed = parse(raw);
        this.onmessage({data: parsed});     // onmessage method is set in useMarkdownParseWorker hook
    }

    terminate() {}
}
