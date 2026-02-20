// Type definitions for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      selectVideoFile: () => Promise<string>;
      getFfmpegPath: () => Promise<string>;
      getFfprobePath: () => Promise<string>;
      getChapters: (language?: string) => Promise<any[]>;
      getVerses: (chapter: number, language: string, range: string) => Promise<any[]>;
      getReciters: (language?: string) => Promise<any[]>;
      startRender: (job: any) => Promise<{ jobId: string }>;
      showInFolder: (filePath: string) => Promise<void>;
      openExternal: (url: string) => Promise<void>;
      onRenderProgress: (callback: (jobId: string, progress: number, status: string, data?: string) => void) => void;
      removeRenderProgressListener: (callback: (jobId: string, progress: number, status: string, data?: string) => void) => void;
    };
  }
}

export { };
