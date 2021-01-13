import parse from "./markdown-parser";


onmessage = e => {
    const parsed = parse(e.data);
    postMessage(parsed);
};
