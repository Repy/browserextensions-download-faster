import "../lib/WebExtensions";
import { BackGroundInterface, Config, Status, FileInterface } from "./interface";
import { ClassEventTarget } from "../lib/ClassEventTarget";
import { EventType, ProgressEvent } from "./event";

const SplitSize = 5000000;

function wait(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        setTimeout(resolve, 100);
    });
}

interface ResObject {
    length: number;
    bytes: Blob;
}

class DFile extends ClassEventTarget<EventType, ProgressEvent> implements FileInterface {
    constructor(config: Config) {
        super();
        this.config = {
            url: config.url,
            parallel: config.parallel || 4,
            retry: config.retry || 5,
        };
    }
    public readonly config: Required<Config>;
    public readonly status: Status = {
        parallel: 0,
        downloadedBlock: 0,
        allBlock: 0,
    };

    // キャンセル
    private canceled: boolean = false;

    public async start(): Promise<Blob> {
        const startblob = await this.task(0);
        if (!startblob) {
            throw "";
        }

        this.status.downloadedBlock = 1;
        // 切り上げする
        this.status.allBlock = Math.ceil(startblob.length / SplitSize);

        const tasks: PromiseLike<Blob>[] = [];
        for (let index = 1; index < this.status.allBlock; index++) {
            tasks.push(
                this.task(index).then((res) => {
                    this.status.downloadedBlock++;
                    this.dispatchEvent({ type: "progress" });
                    return res.bytes;
                })
            );
        }
        try {
            const blobs = await Promise.all(tasks);
            //最初の1つ目と結合
            const concatBlob = [startblob.bytes].concat(blobs);
            return new Blob(concatBlob, { type: "application/octet-stream" });
        } catch (error) {
            this.canceled = true;
            throw error;
        }
    }


    private async task(requestId: number): Promise<ResObject> {
        // 同時ダウンロード数
        while (this.status.parallel >= this.config.parallel) {
            if (this.canceled) throw "canceled";
            await wait();
        }
        if (this.canceled) throw "canceled";
        console.log("request", requestId);

        // リトライ処理
        let res: ResObject | null = null;
        this.status.parallel++;
        for (let retry = 0; retry < this.config.retry; retry++) {
            try {
                res = await this.req(requestId);
                break;
            } catch (error) {
                this.log(error);
            }
        }
        this.status.parallel--;
        if (!res) {
            throw "Download Error";
        }

        return res;
    }

    private req(requestId: number): Promise<ResObject> {
        return new Promise((resolve, reject) => {
            const oReq = new XMLHttpRequest();
            oReq.open("GET", this.config.url, true);
            oReq.setRequestHeader("Range", "bytes=" + (requestId * SplitSize) + "-" + ((requestId + 1) * SplitSize - 1));

            oReq.addEventListener("readystatechange", () => {
                if (oReq.readyState == XMLHttpRequest.HEADERS_RECEIVED) {
                    if (oReq.status == 200) {
                        oReq.abort();
                        reject("error: Not Allow parallel download");
                    } else if (oReq.status == 206) {
                    } else {
                        oReq.abort();
                        reject("error: " + oReq.status + ": " + oReq.statusText);
                    }
                }
            });
            oReq.addEventListener("load", () => {
                const range = oReq.getResponseHeader("content-range");
                if (!range) {
                    reject("error: Not Allow parallel download");
                    return;
                }
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

    private logData = "";
    private log(data: any) {
        if (typeof data === "string") {
            this.logData += data + "\n";
        }
        if (typeof data === "object") {
            this.logData += JSON.stringify(data) + "\n";
        }
    }
    public getLog(): string {
        return this.logData;
    }

}

class BackGround implements BackGroundInterface {
    private constructor() {
    }
    private static instance: BackGround;

    public static getInstance(): BackGround {
        if (!BackGround.instance) BackGround.instance = new BackGround();
        return BackGround.instance;
    }

    public download(url: string): void {
        this._download(url);
    }

    private async _download(url: string) {
        const file = new DFile({ url: url });
        this.downloadList.push(file);
        file.addEventListener("progress", (e) => {
            chrome.runtime.sendMessage(e);
        });

        const objectURL = URL.createObjectURL(await file.start());
        browser.downloads.download({
            saveAs: true,
            url: objectURL,
            // headers?: HeaderNameValuePair[];
            // method?: string;
        }, (downloadId: number) => {

        });
    }

    private downloadList: DFile[] = [];
    public getDownloadList(): DFile[] {
        return this.downloadList.concat();
    }

}

window.background = BackGround.getInstance();

browser.browserAction.onClicked.addListener((tab: chrome.tabs.Tab) => {
    browser.tabs.create({
        url: browser.runtime.getURL("frontend/options.html?url=" + encodeURIComponent(tab.url || "")),
    });
});
