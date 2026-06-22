package com.dailyonemovie.dailyonemovie_backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http

                // ⭐ IMPORTANT: enable cors integration with Spring Security
                .cors(Customizer.withDefaults())

                // OAuth2 login needs session -> DO NOT use stateless
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )

                .csrf(csrf -> csrf.disable())

                .authorizeHttpRequests(auth -> auth
                	    // Public endpoints
                	    .requestMatchers("/", "/error", "/oauth2/**", "/login/**").permitAll()

                	    // Allow preflight requests (CORS)
                	    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                	    // Everything else requires authentication
                	    .anyRequest().authenticated()
                	)


                // GitHub OAuth login
                .oauth2Login(oauth -> oauth
                        .defaultSuccessUrl(
                                "https://dailyonemovie.netlify.app",
                                true
                        )
                )

                .logout(logout -> logout
                        .logoutUrl("/auth/logout")
                        .logoutSuccessUrl("https://dailyonemovie.netlify.app")
                        .invalidateHttpSession(true)
                        .deleteCookies("JSESSIONID")
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://localhost:4000",
                "https://dailyonemovie.netlify.app"
        ));

        configuration.setAllowedMethods(List.of(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"
        ));

        configuration.setAllowedHeaders(List.of("*"));

        // REQUIRED for OAuth session cookies
        configuration.setAllowCredentials(true);

        configuration.setExposedHeaders(List.of("Set-Cookie"));

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}