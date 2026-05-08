package com.dailyonemovie.dailyonemovie_backend.entity;

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

    // Store only the object keys (filenames in Backblaze)
    private String movieKey;    // e.g., "movie.mp4"
    private String posterKey;   // e.g., "poster.png"
}

