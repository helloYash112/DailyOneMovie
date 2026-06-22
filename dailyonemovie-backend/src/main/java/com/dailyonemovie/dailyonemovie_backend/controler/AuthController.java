package com.dailyonemovie.dailyonemovie_backend.controler;

import java.io.IOException;

import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;

import org.springframework.web.bind.annotation.*;

import com.dailyonemovie.dailyonemovie_backend.DTO.AuthUserDTO;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;



@RestController
@RequestMapping("/auth")
public class AuthController {

    @GetMapping("/me")
    public ResponseEntity<AuthUserDTO> me(
            @AuthenticationPrincipal OAuth2User user) {

        // Not logged in
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(AuthUserDTO.builder()
                            .authenticated(false)
                            .build());
        }

        AuthUserDTO dto = AuthUserDTO.builder()
                .authenticated(true)
                .login(get(user, "login"))
                .name(fallback(user.getAttribute("name"),
                        user.getAttribute("login")))
                .avatar(get(user, "avatar_url"))
                .email(fallback(user.getAttribute("email"),
                        "not-provided"))
                .build();

        return ResponseEntity.ok(dto);
    }
    
    @GetMapping("/logout")
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        if (authentication != null) {
            new SecurityContextLogoutHandler().logout(request, response, authentication);
        }
        response.sendRedirect("http://localhost:5173/login"); 
    }

    // ---------------- helpers ----------------

    private String get(OAuth2User user, String key) {
        Object value = user.getAttribute(key);
        return value != null ? value.toString() : null;
    }

    private String fallback(Object value, Object defaultValue) {
        return value != null
                ? value.toString()
                : (defaultValue != null ? defaultValue.toString() : null);
    }
}