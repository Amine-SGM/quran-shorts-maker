// Preload Script
// Exposes safe APIs to the renderer process

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectVideoFile: () => ipcRenderer.invoke('select-video-file'),
  getFfmpegPath: () => ipcRenderer.invoke('get-ffmpeg-path'),
  getFfprobePath: () => ipcRenderer.invoke('get-ffprobe-path'),
  getChapters: (language: string) => ipcRenderer.invoke('get-chapters', language),
  getVerses: (chapter: number, language: string, range: string) => ipcRenderer.invoke('get-verses', chapter, language, range),
  getReciters: (language: string) => ipcRenderer.invoke('get-reciters', language),
  startRender: (job: any) => ipcRenderer.invoke('start-render', job),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  onRenderProgress: (callback: (jobId: string, progress: number, status: string, data?: string) => void) => {
    ipcRenderer.on('render-progress', (event: any, jobId: string, progress: number, status: string, data?: string) => callback(jobId, progress, status, data));
  },
  removeRenderProgressListener: (callback: (jobId: string, progress: number, status: string, data?: string) => void) => {
    ipcRenderer.removeListener('render-progress', callback);
  }
});

// Type definitions are in types/preload.d.ts
