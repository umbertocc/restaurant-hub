package com.example.restaurant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class RestaurantHubApplication {
    public static void main(String[] args) {
        SpringApplication.run(RestaurantHubApplication.class, args);
    }
}
