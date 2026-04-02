// Simple singleton to hold File objects between page transitions
// Since sessionStorage can't hold File objects/Blobs

type FileStore = {
  files: File[];
  mode: string;
  targetFormat: string;
  targetSizeKb: number;
};

let internalStore: FileStore = {
  files: [],
  mode: 'COMPRESS',
  targetFormat: 'AUTO',
  targetSizeKb: 0,
};

export const setPendingFiles = (files: File[], mode: string, targetFormat: string, targetSizeKb: number = 0) => {
  internalStore = { files, mode, targetFormat, targetSizeKb };
};

export const getPendingFile = () => {
  return internalStore;
};

export const clearPendingFile = () => {
  internalStore = { files: [], mode: 'COMPRESS', targetFormat: 'AUTO', targetSizeKb: 0 };
};
