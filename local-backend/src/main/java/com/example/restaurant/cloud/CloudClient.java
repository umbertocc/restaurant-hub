package com.example.restaurant.cloud;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

@Component
public class CloudClient {

    private final String baseUrl;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public CloudClient(@Value("${app.cloud.url:}") String baseUrl) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    public HttpResponse<byte[]> send(String method, String pathAndQuery, Map<String, String> headers, byte[] body)
            throws IOException, InterruptedException {
        if (baseUrl.isBlank()) {
            throw new IOException("CLOUD_API_URL non configurato");
        }
        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(baseUrl + pathAndQuery))
                .timeout(Duration.ofSeconds(30));
        headers.forEach(builder::header);
        HttpRequest.BodyPublisher publisher = body == null || body.length == 0
                ? HttpRequest.BodyPublishers.noBody()
                : HttpRequest.BodyPublishers.ofByteArray(body);
        builder.method(method, publisher);
        return http.send(builder.build(), HttpResponse.BodyHandlers.ofByteArray());
    }
}
