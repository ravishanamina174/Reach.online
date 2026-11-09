package com.reachonline.backend.ai.protection;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.List;

@Component
public class ClientIpResolver {

    private final AiProtectionProperties properties;

    public ClientIpResolver(AiProtectionProperties properties) {
        this.properties = properties;
    }

    public String resolve(HttpServletRequest request) {
        String remoteAddress = request.getRemoteAddr();
        List<Network> trustedProxies = trustedProxies();

        if (!isTrusted(remoteAddress, trustedProxies)) {
            return remoteAddress;
        }

        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor == null || forwardedFor.isBlank()) {
            return remoteAddress;
        }

        String[] addresses = forwardedFor.split(",");
        for (int index = addresses.length - 1; index >= 0; index--) {
            String candidate = addresses[index].trim();
            if (!candidate.isBlank() && !isTrusted(candidate, trustedProxies)) {
                return candidate;
            }
        }

        return addresses[0].trim();
    }

    private List<Network> trustedProxies() {
        if (properties.getTrustedProxies() == null
                || properties.getTrustedProxies().isBlank()) {
            return List.of();
        }

        return Arrays.stream(properties.getTrustedProxies().split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::parseNetwork)
                .toList();
    }

    private boolean isTrusted(String address, List<Network> trustedProxies) {
        try {
            InetAddress parsed = InetAddress.getByName(address);
            return trustedProxies.stream().anyMatch(network -> network.contains(parsed));
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    private Network parseNetwork(String value) {
        String[] parts = value.split("/", 2);
        try {
            InetAddress address = InetAddress.getByName(parts[0]);
            int prefixLength = parts.length == 1
                    ? address.getAddress().length * 8
                    : Integer.parseInt(parts[1]);
            int maxPrefixLength = address.getAddress().length * 8;

            if (prefixLength < 0 || prefixLength > maxPrefixLength) {
                throw new IllegalArgumentException("Invalid trusted proxy CIDR: " + value);
            }

            return new Network(address, prefixLength);
        } catch (UnknownHostException | NumberFormatException exception) {
            throw new IllegalArgumentException(
                    "Invalid trusted proxy address: " + value,
                    exception
            );
        }
    }

    private record Network(InetAddress address, int prefixLength) {
        private boolean contains(InetAddress candidate) {
            byte[] networkBytes = address.getAddress();
            byte[] candidateBytes = candidate.getAddress();

            if (networkBytes.length != candidateBytes.length) {
                return false;
            }

            int fullBytes = prefixLength / 8;
            int remainingBits = prefixLength % 8;

            for (int index = 0; index < fullBytes; index++) {
                if (networkBytes[index] != candidateBytes[index]) {
                    return false;
                }
            }

            if (remainingBits == 0) {
                return true;
            }

            int mask = 0xFF << (8 - remainingBits);
            return (networkBytes[fullBytes] & mask)
                    == (candidateBytes[fullBytes] & mask);
        }
    }
}
