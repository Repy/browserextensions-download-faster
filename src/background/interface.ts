
export interface Config {
    /** URL */
    url: string;
    /** 最大の同時ダウンロード数 */
    parallel?: number;
    /** 最大のリトライ数 */
    retry?: number;
}

export interface Status {
    /** 現在の同時ダウンロード数 */
    parallel: number;
    /** ダウンロード済みブロック数 */
    downloadedBlock: number;
    /** 全ブロック数 */
    allBlock: number;
}

export interface FileInterface {
    readonly config: Readonly<Required<Config>>;
    readonly status: Readonly<Status>;
    getLog(): string;
}

export interface BackGroundInterface {
    download(url: string): void;
    getDownloadList(): FileInterface[];
}

declare global {
    interface Window {
        background: BackGroundInterface;
    }
}
