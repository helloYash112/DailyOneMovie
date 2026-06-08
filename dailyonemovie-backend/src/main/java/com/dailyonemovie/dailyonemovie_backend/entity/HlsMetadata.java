package com.dailyonemovie.dailyonemovie_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class HlsMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link back to the movie
    @ManyToOne
    @JoinColumn(name = "movie_id")
    private Movies movie;

    // The playlist key (main entry point for Shaka Player)
    private String playlistKey;   // e.g., "movies/hls/12345/playlist.m3u8"

    // Optional: store chunk keys if you want DB-level tracking
    @Lob
    private String chunkKeysJson; // e.g., ["movies/hls/12345/playlist0.ts", "playlist1.ts", ...]

    // Timestamp for housekeeping
    private java.time.Instant createdAt;
}

