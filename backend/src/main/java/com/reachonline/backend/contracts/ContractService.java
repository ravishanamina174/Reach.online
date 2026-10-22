
package com.reachonline.backend.contracts;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import com.reachonline.backend.contracts.controller.ContractResponse;
import com.reachonline.backend.contracts.controller.CreateContractRequest;
import com.reachonline.backend.contracts.model.Contract;
import com.reachonline.backend.contracts.repository.ContractRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ContractService {

    private final ContractRepository repository;
    private final JsonMapper objectMapper;

    public ContractService(
        ContractRepository repository,
        JsonMapper objectMapper
    ) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public ContractResponse create(CreateContractRequest request) {
        validateContent(request.content());

        if (repository.existsByNameAndVersion(
            request.name(),
            request.version()
        )) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This contract version already exists"
            );
        }

        String content;

        try {
            content = objectMapper.writeValueAsString(request.content());
        } catch (Exception exception) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Contract content must be valid JSON"
            );
        }

        Contract contract = new Contract(
            request.name().trim(),
            request.contractType(),
            request.version(),
            content
        );

        try {
            return ContractResponse.from(
                repository.saveAndFlush(contract),
                objectMapper
            );
        } catch (DataIntegrityViolationException exception) {
            // Protect against two requests creating the same version concurrently.
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "This contract version already exists"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> findAll() {
        return repository.findAllByOrderByNameAscVersionAsc()
            .stream()
            .<ContractResponse>map(
    contract -> ContractResponse.from(contract, objectMapper)
)
            .toList();
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> findVersions(String name) {
        List<Contract> contracts =
            repository.findByNameOrderByCreatedAtDesc(name);

        if (contracts.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Contract not found: " + name
            );
        }

        return contracts.stream()
            .<ContractResponse>map(
    contract -> ContractResponse.from(contract, objectMapper)
)
            .toList();
    }

    @Transactional(readOnly = true)
    public ContractResponse findVersion(String name, String version) {
        Contract contract = repository.findByNameAndVersion(name, version)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "Contract version not found"
            ));

        return ContractResponse.from(contract, objectMapper);
    }

    private void validateContent(JsonNode content) {
        if (content == null || !content.isObject()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Contract content must be a JSON object"
            );
        }

        if (content.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Contract content cannot be empty"
            );
        }
    }
}
