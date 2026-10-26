
package com.reachonline.backend.contracts;

import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

import com.reachonline.backend.contracts.controller.ContractDiffResponse;
import com.reachonline.backend.contracts.controller.ContractDiffResponse.Change;
import com.reachonline.backend.contracts.controller.ContractDiffResponse.ChangeType;
import com.reachonline.backend.contracts.model.Contract;
import com.reachonline.backend.contracts.repository.ContractRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class ContractDiffService {

    private final ContractRepository repository;
    private final JsonMapper jsonMapper;

    public ContractDiffService(
            ContractRepository repository,
            JsonMapper jsonMapper
    ) {
        this.repository = repository;
        this.jsonMapper = jsonMapper;
    }

    @Transactional(readOnly = true)
    public ContractDiffResponse compare(
            String name,
            String fromVersion,
            String toVersion,
            String ownerUserId
    ) {
        if (fromVersion.equals(toVersion)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Source and target versions must be different"
            );
        }

        Contract from = repository
                .findByNameAndVersionAndOwnerUserId(name, fromVersion, ownerUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Source contract version was not found"
                ));

        Contract to = repository
                .findByNameAndVersionAndOwnerUserId(name, toVersion, ownerUserId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Target contract version was not found"
                ));

        JsonNode before = parseContent(from.getContent());
        JsonNode after = parseContent(to.getContent());

        List<Change> changes = new ArrayList<>();
        compareNodes("", before, after, changes);

        return new ContractDiffResponse(
                name,
                fromVersion,
                toVersion,
                !changes.isEmpty(),
                List.copyOf(changes)
        );
    }

    private JsonNode parseContent(String content) {
        try {
            return jsonMapper.readTree(content);
        } catch (Exception exception) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Stored contract content could not be parsed"
            );
        }
    }

    private void compareNodes(
            String path,
            JsonNode before,
            JsonNode after,
            List<Change> changes
    ) {
        if (before.equals(after)) {
            return;
        }

        if (before.isObject() && after.isObject()) {
            compareObjects(path, before, after, changes);
            return;
        }

        if (before.isArray() && after.isArray()) {
            compareArrays(path, before, after, changes);
            return;
        }

        changes.add(new Change(
                displayPath(path),
                ChangeType.CHANGED,
                before,
                after
        ));
    }

    private void compareObjects(
            String path,
            JsonNode before,
            JsonNode after,
            List<Change> changes
    ) {
        TreeSet<String> keys = new TreeSet<>();

        before.properties().forEach(entry ->
                keys.add(entry.getKey())
        );

        after.properties().forEach(entry ->
                keys.add(entry.getKey())
        );

        for (String key : keys) {
            String childPath = path + "/" + escapePointer(key);

            boolean existsBefore = before.has(key);
            boolean existsAfter = after.has(key);

            if (!existsBefore) {
                changes.add(new Change(
                        displayPath(childPath),
                        ChangeType.ADDED,
                        null,
                        after.get(key)
                ));
            } else if (!existsAfter) {
                changes.add(new Change(
                        displayPath(childPath),
                        ChangeType.REMOVED,
                        before.get(key),
                        null
                ));
            } else {
                compareNodes(
                        childPath,
                        before.get(key),
                        after.get(key),
                        changes
                );
            }
        }
    }

    private void compareArrays(
            String path,
            JsonNode before,
            JsonNode after,
            List<Change> changes
    ) {
        int beforeSize = before.size();
        int afterSize = after.size();
        int maxSize = Math.max(beforeSize, afterSize);

        for (int i = 0; i < maxSize; i++) {
            String childPath = path + "/" + i;

            if (i >= beforeSize) {
                changes.add(new Change(
                        displayPath(childPath),
                        ChangeType.ADDED,
                        null,
                        after.get(i)
                ));
            } else if (i >= afterSize) {
                changes.add(new Change(
                        displayPath(childPath),
                        ChangeType.REMOVED,
                        before.get(i),
                        null
                ));
            } else {
                compareNodes(
                        childPath,
                        before.get(i),
                        after.get(i),
                        changes
                );
            }
        }
    }

    private String escapePointer(String value) {
        return value.replace("~", "~0").replace("/", "~1");
    }

    private String displayPath(String path) {
        return path.isEmpty() ? "/" : path;
    }
}
