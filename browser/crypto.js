export const crypto = {
    _text: "",

    createHash() {
        this._text = "";
        return crypto;
    },

    update(text) {
        this._text += text;
        return crypto;
    },

    digest() {
        return crypto._text;
    }
}

export default crypto;