package com.dailyonemovie.dailyonemovie_backend.DTO;

import java.util.List;

public class HlsUploadSession {
    private String folderPath;     // hls/{uuid}/
    private String tsKey;          // hls/{uuid}/index.ts
    private String m3u8Key;        // hls/{uuid}/index.m3u8
    private String posterKey;      // hls/{uuid}/poster.jpg
    private String uploadId;       // S3 multipart upload ID
    private List<PartUrlInfo> partUrls; // Presigned URLs for chunks

    // Constructor
    public HlsUploadSession(String folderPath, String tsKey, String m3u8Key,
                            String posterKey, String uploadId, List<PartUrlInfo> partUrls) {
        this.folderPath = folderPath;
        this.tsKey = tsKey;
        this.m3u8Key = m3u8Key;
        this.posterKey = posterKey;
        this.uploadId = uploadId;
        this.partUrls = partUrls;
    }

    // Getters
    public String getFolderPath() { return folderPath; }
    public String getTsKey() { return tsKey; }
    public String getM3u8Key() { return m3u8Key; }
    public String getPosterKey() { return posterKey; }
    public String getUploadId() { return uploadId; }
    public List<PartUrlInfo> getPartUrls() { return partUrls; }
}
