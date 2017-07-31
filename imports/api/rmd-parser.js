

const header = /([^\n]+)\n([^\n]+)\n=+/;

export default class RmdParser {
    constructor(source) {
        this.source = source;

        let match = header.exec(source);
        this.author = match[1];
        this.title = match[2];


    }
}
