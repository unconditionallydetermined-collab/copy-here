package com.careersync.repository;

import com.careersync.model.ChecklistEntry;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ChecklistEntryRepository extends MongoRepository<ChecklistEntry, String> {
    List<ChecklistEntry> findByUserIdOrderByCreatedAtDesc(String userId);
}
