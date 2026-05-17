import axios from 'axios';
/**
 * Dynamically determines chunk size and slices a file into an array of Blobs (bytes).
 * @param {File|Blob} file - The video file from an input element.
 * @returns {Array<Blob>} - Array of file slices.
 */
export const sliceFileForUpload = (file) => {
    const FILE_SIZE = file.size;
    const ONE_MB = 1024 * 1024;
    
    // 1. Determine optimal chunk size based on file size thresholds
    let chunkSize = 5 * ONE_MB; // Default minimum fallback (5MB)
  
    if (FILE_SIZE <= 500 * ONE_MB) {
      // Files up to 500MB -> Use 5MB chunks (~100 parts max)
      chunkSize = 5 * ONE_MB;
    } else if (FILE_SIZE <= 1000 * ONE_MB) {
      // Files between 500MB and 1GB -> Use 10MB chunks (~100 parts max)
      chunkSize = 10 * ONE_MB;
    } else {
      // For files > 1GB, dynamically aim for ~100 parts, but clamp it to at least 10MB
      const calculatedSize = Math.ceil(FILE_SIZE / 100);
      chunkSize = Math.max(calculatedSize, 10 * ONE_MB);
    }
  
    const chunks = [];
    let startByte = 0;
  
    // 2. Slice the file into byte arrays (Blobs)
    while (startByte < FILE_SIZE) {
      const endByte = Math.min(startByte + chunkSize, FILE_SIZE);
      const chunk = file.slice(startByte, endByte);
      chunks.push(chunk);
      
      startByte = endByte; // Move pointer to the next chunk
    }
  
    return chunks;
  };

  export const runWithConcurrencyLimit = async (limit, tasks) => {
    const results = [];
    const executing = new Set();
  
    for (const task of tasks) {
      const p = Promise.resolve().then(() => task());
      results.push(p);
      executing.add(p);
      
      // Clean up the promise from the executing pool when it resolves
      const clean = () => executing.delete(p);
      p.then(clean, clean);
  
      // If we hit our maximum limit, wait for at least one task to finish
      if (executing.size >= limit) {
        await Promise.race(executing);
      }
    }
    return Promise.all(results);
  };

 

/**
 * Prepares an array of lazy-executing upload tasks using Axios.
 * 
 * @param {Array<Blob>} fileChunks - Array of sliced file pieces.
 * @param {Array<Object>} partsUrls - Array of pre-signed URLs from the backend step 1 API.
 * @param {string} contentType - The MIME type of the file (e.g., 'video/mp4').
 * @returns {Array<Function>} - Array of unexecuted async functions.
 */
export const createUploadTasks = (fileChunks, partsUrls, contentType) => {
  return fileChunks.map((chunk, i) => {
    const targetUrl = partsUrls[i]?.url;
    const partNumber = partsUrls[i]?.partNumber;

    if (!targetUrl || !partNumber) {
      throw new Error(`Missing pre-signed URL or part number for chunk index ${i}`);
    }

    // Return the unexecuted function (lazy execution)
    return async () => {
      // Axios automatically throws an error if the request fails (status code != 2xx)
      const response = await axios.put(targetUrl, chunk, {
        headers: { 
          "Content-Type": contentType 
        }
      });

      // S3 returns an ETag header. Axios headers are case-insensitive, 
      // but standard practice is to access it like this:
      const eTag = response.headers['etag'];

      if (!eTag) {
        throw new Error(`Part ${partNumber} uploaded, but no ETag was returned by S3.`);
      }
      
      return { partNumber, eTag };
    };
  });
};