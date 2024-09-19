/**
 * Adds a markdown object with 2 images to backend.
 */
export const markdownObjectWithImages = () => {
    const raw_text = "![image 1](http://link.1)\n\n" + "![image 2](http://link.2)";
    global.backend.cache.objects.update(1, { object_type: "markdown" }, { raw_text });
};
