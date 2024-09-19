import { NodeModel } from "./node";


/**
 * Object model for an <img> node
 */
export class ImgModel extends NodeModel {
    ensureSrc(expected) {
        const { src } = this.node.src;
        if (src !== expected) fail(`Expected img src '${expected}', found '${src}'`);
    }
}
