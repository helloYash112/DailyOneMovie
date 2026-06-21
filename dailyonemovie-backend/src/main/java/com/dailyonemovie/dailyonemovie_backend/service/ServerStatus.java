package com.dailyonemovie.dailyonemovie_backend.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServerStatus {
    private boolean alive;
    private long timestamp;
}