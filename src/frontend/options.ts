import "../lib/WebExtentions";
import "../background/interface";
import { ProgressEvent } from "../background/event";

document.addEventListener('DOMContentLoaded', () => {
    (<any>window).DomainBlockOptions = new DomainBlockOptions();
});

class DomainBlockOptions {
    private url: HTMLInputElement;
    private download: HTMLButtonElement;
    private list: HTMLDivElement;

    constructor() {
        this.url = <HTMLInputElement>document.getElementById("url");
        this.list = <HTMLDivElement>document.getElementById("progress-container");
        const query = this.getQuery();
        this.url.value = query["url"] || "";
        this.download = <HTMLButtonElement>document.getElementById("download");
        this.download.addEventListener('click', () => {
            this.downloadOnClick();
        });
        chrome.runtime.onMessage.addListener((message: ProgressEvent) => {
            if (message.type == "progress") {
                browser.runtime.getBackgroundPage((backgroundWindow) => {
                    while (this.list.children.length > 0) this.list.removeChild(this.list.children[0]);
                    if (backgroundWindow) {
                        for (const f of backgroundWindow.background.getDownloadList()) {
                            const div = document.createElement("pre");
                            const text = f.config.url + "\n" + f.status.downloadedBlock + "/" + f.status.allBlock + "\n" + f.getLog();
                            div.appendChild(document.createTextNode(text));
                            this.list.appendChild(div);
                        }
                    }
                });
            }
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
            if (backgroundWindow)
                backgroundWindow.background.download(this.url.value);
        });
    }
}
