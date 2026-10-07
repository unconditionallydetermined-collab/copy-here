package com.careersync.controller;

import com.careersync.model.ChecklistEntry;
import com.careersync.repository.ChecklistEntryRepository;
import com.careersync.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/checklist")
public class ChecklistController {
    private final ChecklistEntryRepository repository;
    public ChecklistController(ChecklistEntryRepository repository) { this.repository = repository; }

    @GetMapping
    public ResponseEntity<List<ChecklistEntry>> list(@AuthenticationPrincipal UserPrincipal user) {
        return ResponseEntity.ok(repository.findByUserIdOrderByCreatedAtDesc(user.getUserId()));
    }

    @PostMapping
    public ResponseEntity<?> create(@AuthenticationPrincipal UserPrincipal user, @RequestBody ChecklistEntry entry) {
        if (entry.getTitle() == null || entry.getTitle().isBlank()) return ResponseEntity.badRequest().body("Title is required");
        entry.setId(null);
        entry.setUserId(user.getUserId());
        if (entry.getOutcome() == null || entry.getOutcome().isBlank()) entry.setOutcome("Needs change");
        return ResponseEntity.ok(repository.save(entry));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id, @RequestBody ChecklistEntry changes) {
        return repository.findById(id).map(entry -> {
            if (!entry.getUserId().equals(user.getUserId())) return ResponseEntity.status(403).<ChecklistEntry>build();
            if (changes.getTitle() != null && !changes.getTitle().isBlank()) entry.setTitle(changes.getTitle());
            if (changes.getNotes() != null) entry.setNotes(changes.getNotes());
            if (changes.getOutcome() != null) entry.setOutcome(changes.getOutcome());
            entry.setDone(changes.isDone());
            return ResponseEntity.ok(repository.save(entry));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal user, @PathVariable String id) {
        return repository.findById(id).filter(entry -> entry.getUserId().equals(user.getUserId()))
                .map(entry -> { repository.delete(entry); return ResponseEntity.noContent().<Void>build(); })
                .orElse(ResponseEntity.notFound().build());
    }
}
