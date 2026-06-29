package com.dailyonemovie.dailyonemovie_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;

@Entity
@Data
public class Movies {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private String genre;

    private int duration;

    private double rating;

    @Column
    private String status; // UPLOADING, CONVERTING, UPLOADING, READY, FAILED

    @Column
    private int progress;

    // Original uploaded movie object
    @Column
    private String movieKey;

    // Poster object
    private String posterKey;

    // Public poster URL
    private String posterUrl;
}
