package com.example.randomchat.handler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.randomchat.model.ChatMessage;
import com.example.randomchat.model.ChatMessage.MessageType;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();
    private final Map<String, String> usernames = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.put(session.getId(), session);
        log.info("New WebSocket connection established: {}", session.getId());
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        log.info("Received message: {}", payload);

        ChatMessage chatMessage = objectMapper.readValue(payload, ChatMessage.class);
        
        if (chatMessage.getType() == MessageType.JOIN) {
            usernames.put(session.getId(), chatMessage.getSender());
            broadcastMessage(chatMessage);
            broadcastUserList();
        } else if (chatMessage.getType() == MessageType.LEAVE) {
            usernames.remove(session.getId());
            broadcastMessage(chatMessage);
            broadcastUserList();
        } else {
            broadcastMessage(chatMessage);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String username = usernames.remove(session.getId());
        sessions.remove(session.getId());
        
        if (username != null) {
            ChatMessage leaveMessage = ChatMessage.createMessage(
                MessageType.LEAVE, 
                username, 
                username + " has left the chat"
            );
            broadcastMessage(leaveMessage);
            broadcastUserList();
        }
        
        log.info("WebSocket connection closed: {}", session.getId());
    }

    private void broadcastMessage(ChatMessage message) {
        sessions.values().parallelStream().forEach(session -> {
            try {
                if (session.isOpen()) {
                    String json = objectMapper.writeValueAsString(message);
                    session.sendMessage(new TextMessage(json));
                }
            } catch (IOException e) {
                log.error("Error sending message to session {}: {}", session.getId(), e.getMessage());
            }
        });
    }
    
    private void broadcastUserList() {
        List<String> users = new ArrayList<>(usernames.values());
        ChatMessage usersMessage = ChatMessage.createUsersMessage(users);
        
        sessions.values().parallelStream().forEach(session -> {
            try {
                if (session.isOpen()) {
                    String json = objectMapper.writeValueAsString(usersMessage);
                    session.sendMessage(new TextMessage(json));
                }
            } catch (IOException e) {
                log.error("Error sending user list to session {}: {}", session.getId(), e.getMessage());
            }
        });
    }
}
