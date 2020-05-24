
export interface BackGroundInterface {
    download(url: string): void;
}

declare global {
    interface Window {
        background: BackGroundInterface;
    }
}
