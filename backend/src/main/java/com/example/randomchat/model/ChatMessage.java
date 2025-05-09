package com.example.randomchat.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String id;
    private MessageType type;
    private String sender;
    private String content;
    private String timestamp;
    private List<String> users;
    private Boolean isGif;

    public enum MessageType {
        CHAT, JOIN, LEAVE, USERS, SYSTEM, PARTNER_CONNECTED, PARTNER_DISCONNECTED, FIND_NEW
    }

    public static ChatMessage createMessage(MessageType type, String sender, String content) {
        return ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .type(type)
                .sender(sender)
                .content(content)
                .timestamp(LocalDateTime.now().toString())
                .isGif(false) // Default to false
                .build();
    }
    
    public static ChatMessage createUsersMessage(List<String> users) {
        return ChatMessage.builder()
                .id(UUID.randomUUID().toString())
                .type(MessageType.USERS)
                .users(users)
                .timestamp(LocalDateTime.now().toString())
                .isGif(false) // Default to false
                .build();
    }
}
