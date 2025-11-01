export const downloadBlob = (blob, filename) => {
  if (!(blob instanceof Blob)) {
    throw new Error('Expected a Blob to download');
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename || 'export';
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

export const extractFilename = (contentDisposition, fallback) => {
  if (!contentDisposition) {
    return fallback;
  }

  const filenameMatch = /filename\*?=([^;]+)/i.exec(contentDisposition);
  if (!filenameMatch) {
    return fallback;
  }

  const value = filenameMatch[1].trim();

  if (value.startsWith("UTF-8''")) {
    try {
      return decodeURIComponent(value.replace("UTF-8''", ''));
    } catch (error) {
      return fallback;
    }
  }

  const cleaned = value.replace(/"/g, '');
  return cleaned || fallback;
};
