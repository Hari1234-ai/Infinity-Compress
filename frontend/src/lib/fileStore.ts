// Simple singleton to hold File objects between page transitions
// Since sessionStorage can't hold File objects/Blobs

type FileStore = {
  file: File | null;
  mode: string;
  targetFormat: string;
  targetSizeKb: number;
};

let internalStore: FileStore = {
  file: null,
  mode: 'COMPRESS',
  targetFormat: 'AUTO',
  targetSizeKb: 0,
};

export const setPendingFile = (file: File, mode: string, targetFormat: string, targetSizeKb: number = 0) => {
  internalStore = { file, mode, targetFormat, targetSizeKb };
};

export const getPendingFile = () => {
  return internalStore;
};

export const clearPendingFile = () => {
  internalStore = { file: null, mode: 'COMPRESS', targetFormat: 'AUTO', targetSizeKb: 0 };
};
