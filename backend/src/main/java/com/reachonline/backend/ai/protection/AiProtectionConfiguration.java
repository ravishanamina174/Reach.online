package com.reachonline.backend.ai.protection;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class AiProtectionConfiguration {

    @Bean(destroyMethod = "shutdown")
    ScheduledExecutorService aiProtectionScheduler() {
        return Executors.newScheduledThreadPool(2);
    }
}
