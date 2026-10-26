package com.reachonline.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            @Value("${app.clerk.issuer-uri}") String issuerUri,
            @Value("${app.security.enabled}") boolean securityEnabled
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(
                        SessionCreationPolicy.STATELESS
                ))
                .authorizeHttpRequests(authorize -> {
                    if (!securityEnabled) {
                        authorize.anyRequest().permitAll();
                    } else {
                        authorize
                                .requestMatchers("/api/health", "/actuator/health").permitAll()
                                .anyRequest().authenticated();
                    }
                });

        if (securityEnabled && issuerUri != null && !issuerUri.isBlank()) {
            http.oauth2ResourceServer(oauth -> oauth.jwt(jwt -> {}));
        }

        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${app.clerk.issuer-uri}") String issuerUri
    ) {
        if (issuerUri == null || issuerUri.isBlank()) {
            return token -> {
                throw new IllegalStateException("CLERK_ISSUER_URI is not configured.");
            };
        }
        return JwtDecoders.fromIssuerLocation(issuerUri);
    }
}
