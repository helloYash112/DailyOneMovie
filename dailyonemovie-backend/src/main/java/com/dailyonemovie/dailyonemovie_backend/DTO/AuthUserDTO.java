package com.dailyonemovie.dailyonemovie_backend.DTO;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthUserDTO {

    private boolean authenticated;

    private String login;

    private String name;

    private String avatar;

    private String email;
}