// Simple singleton to hold File objects between page transitions
// Since sessionStorage can't hold File objects/Blobs

type FileStore = {
  file: File | null;
  mode: string;
  targetFormat: string;
};

let internalStore: FileStore = {
  file: null,
  mode: 'COMPRESS',
  targetFormat: 'AUTO',
};

export const setPendingFile = (file: File, mode: string, targetFormat: string) => {
  internalStore = { file, mode, targetFormat };
};

export const getPendingFile = () => {
  return internalStore;
};

export const clearPendingFile = () => {
  internalStore = { file: null, mode: 'COMPRESS', targetFormat: 'AUTO' };
};
