package com.dailyonemovie.dailyonemovie_backend.entity;

import java.time.Instant;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class HlsMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movie_id", nullable = false)
    private Movies movie;

    // Object key inside R2
    @Column
    private String playlistKey;

    // Public URL served by Cloudflare
    @Column(nullable =false,length=1000)
    private String playlistUrl;

    @Column(columnDefinition = "TEXT")
    private String chunkKeysJson;


    private Instant createdAt;
}