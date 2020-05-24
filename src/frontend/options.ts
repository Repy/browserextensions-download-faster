import "../lib/WebExtentions";
import "../background/interface";

document.addEventListener('DOMContentLoaded', () => {
    (<any>window).DomainBlockOptions = new DomainBlockOptions();
});

class DomainBlockOptions {
    private url: HTMLInputElement;
    private download: HTMLButtonElement;

    constructor() {
        this.url = <HTMLInputElement>document.getElementById("url");
        const query = this.getQuery();
        this.url.value = query["url"] || "";
        this.download = <HTMLButtonElement>document.getElementById("download");
        this.download.addEventListener('click', () => {
            this.downloadOnClick();
        });
    }

    private getQuery() {
        const query = window.location.search.substring(1);
        const ret: { [name: string]: string; } = {};
        var arr = query.split('&');
        for (var i = 0; i < arr.length; i++) {
            var pair = arr[i].split('=', 2);
            ret[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return ret;
    }

    public downloadOnClick() {
        browser.runtime.getBackgroundPage((backgroundWindow) => {
            backgroundWindow.background.download(this.url.value);
        });
    }
}
