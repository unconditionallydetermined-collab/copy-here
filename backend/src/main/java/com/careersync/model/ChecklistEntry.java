package com.careersync.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "checklist_entries")
public class ChecklistEntry {
    @Id private String id;
    private String userId;
    private String title;
    private String notes;
    private String outcome; // Works or Needs change
    private boolean done;
    @CreatedDate private LocalDateTime createdAt;
}
