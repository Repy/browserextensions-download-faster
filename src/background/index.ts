import "../lib/WebExtentions";
import { BackGroundInterface } from "./interface";

function wait(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, 100);
    });
}


interface ResObject {
    length: number,
    bytes: Blob;
}

const SIZE = 5000000;
class DFile {
    private run = 0;
    private maxRun = 4;
    private blob: Blob[] = [];

    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    public async start(): Promise<Blob[]> {
        const startblob = await this.req(0);
        if (!startblob) {
            throw "";
        }
        this.blob.push(startblob.bytes);

        const maxId = startblob.length / SIZE;

        const tasks: PromiseLike<void>[] = [];
        for (let index = 1; index < maxId; index++) {
            tasks.push(this.task(index));
        }
        await Promise.all(tasks);
        return this.blob;
    }

    private canceled: boolean = false;

    private async task(requestId: number): Promise<void> {
        while (this.run >= this.maxRun) {
            if (this.canceled) return;
            await wait();
        }
        if (this.canceled) return;
        console.log("request", requestId);

        this.run++;
        let res: ResObject;
        try {
            res = await this.req(requestId);
        } catch (error) {
            this.canceled = true;
            throw error;
        }
        this.run--;

        while (this.blob.length != requestId) {
            if (this.canceled) return;
            await wait();
        }
        if (this.canceled) return;
        console.log("send", requestId);

        this.blob.push(res.bytes);

        return;
    }

    private req(requestId: number): Promise<null | ResObject> {
        return new Promise((resolve, reject) => {
            const oReq = new XMLHttpRequest();
            oReq.open("GET", this.url, true);
            oReq.setRequestHeader("Range", "bytes=" + (requestId * SIZE) + "-" + ((requestId + 1) * SIZE - 1));

            oReq.addEventListener("readystatechange", () => {
                if (oReq.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
                    if (oReq.status == 200) {
                        oReq.abort();
                        resolve(null);
                    } else if (oReq.status == 206) {
                    } else {
                        oReq.abort();
                        reject("error: " + oReq.status + ": " + oReq.statusText);
                    }
                }
            });
            oReq.addEventListener("load", () => {
                const range = oReq.getResponseHeader("content-range");
                const size = Number(range.split("/")[1].trim());
                resolve({ length: size, bytes: oReq.response });
            });
            oReq.addEventListener("error", () => {
                reject("error: " + oReq.status + ": " + oReq.statusText);
            });
            oReq.responseType = "arraybuffer";
            oReq.send();
        });
    }


}

class BackGround implements BackGroundInterface {
    private static instance: BackGround;
    private constructor() {
    }
    public static getInstance(): BackGround {
        if (!BackGround.instance) BackGround.instance = new BackGround();
        return BackGround.instance;
    }

    public download(url: string): void {
        this._download(url);
    }


    public async _download(url: string) {
        const file = await new DFile(url).start();

        const objectURL = URL.createObjectURL(new Blob(file, { type: "application/octet-stream" }));
        browser.downloads.download({
            saveAs: true,
            url: objectURL,
            // headers?: HeaderNameValuePair[];
            // method?: string;
        }, (downloadId: number) => {

        });
    }
}

window.background = BackGround.getInstance();

browser.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
    browser.tabs.create({
        url: browser.runtime.getURL("frontend/options.html?url=" + encodeURIComponent(tab.url)),
    });
});
