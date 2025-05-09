package com.example.randomchat.handler;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Queue;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedQueue;

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
    private final Map<String, String> chatPairs = new ConcurrentHashMap<>(); // Maps sessionId to partner's sessionId
    private final Queue<String> waitingUsers = new ConcurrentLinkedQueue<>(); // Queue of users waiting for a partner
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
            handleJoinMessage(session, chatMessage);
        } else if (chatMessage.getType() == MessageType.LEAVE) {
            handleLeaveMessage(session, chatMessage);
        } else if (chatMessage.getType() == MessageType.FIND_NEW) {
            handleFindNewPartnerMessage(session, chatMessage);
        } else {
            // Regular chat message - send only to the paired user
            forwardMessageToPartner(session.getId(), chatMessage);
        }
    }

    private void handleJoinMessage(WebSocketSession session, ChatMessage chatMessage) throws IOException {
        String username = chatMessage.getSender();
        String sessionId = session.getId();
        
        usernames.put(sessionId, username);
        
        // Add user to waiting queue
        waitingUsers.add(sessionId);
        
        // Try to pair with another waiting user
        tryPairUsers();
        
        // Send acknowledgment to the user
        sendDirectMessage(session, ChatMessage.createMessage(
            MessageType.SYSTEM, 
            "system", 
            "Waiting for a chat partner..."
        ));
    }
    
    private void handleLeaveMessage(WebSocketSession session, ChatMessage chatMessage) throws IOException {
        String sessionId = session.getId();
        String username = usernames.get(sessionId);
        
        // Notify partner if exists
        String partnerId = chatPairs.get(sessionId);
        if (partnerId != null) {
            WebSocketSession partnerSession = sessions.get(partnerId);
            if (partnerSession != null && partnerSession.isOpen()) {
                ChatMessage partnerNotification = ChatMessage.createMessage(
                    MessageType.PARTNER_DISCONNECTED,
                    "system",
                    username + " has disconnected. Waiting for a new partner..."
                );
                sendDirectMessage(partnerSession, partnerNotification);
                
                // Remove the pairing
                chatPairs.remove(partnerId);
                chatPairs.remove(sessionId);
                
                // Add the partner back to waiting queue
                waitingUsers.add(partnerId);
                tryPairUsers();
            }
        }
        
        // Clean up
        waitingUsers.remove(sessionId);
        chatPairs.remove(sessionId);
        usernames.remove(sessionId);
    }
    
    private void handleFindNewPartnerMessage(WebSocketSession session, ChatMessage chatMessage) throws IOException {
        String sessionId = session.getId();
        String username = usernames.get(sessionId);
        
        // Notify current partner if exists
        String partnerId = chatPairs.get(sessionId);
        if (partnerId != null) {
            WebSocketSession partnerSession = sessions.get(partnerId);
            if (partnerSession != null && partnerSession.isOpen()) {
                ChatMessage partnerNotification = ChatMessage.createMessage(
                    MessageType.PARTNER_DISCONNECTED,
                    "system",
                    username + " has disconnected. Waiting for a new partner..."
                );
                sendDirectMessage(partnerSession, partnerNotification);
                
                // Remove the pairing
                chatPairs.remove(partnerId);
                
                // Add the partner back to waiting queue
                waitingUsers.add(partnerId);
            }
        }
        
        // Remove current pairing and add user to waiting queue
        chatPairs.remove(sessionId);
        waitingUsers.add(sessionId);
        
        // Send acknowledgment to the user
        sendDirectMessage(session, ChatMessage.createMessage(
            MessageType.SYSTEM, 
            "system", 
            "Looking for a new chat partner..."
        ));
        
        // Try to pair with another waiting user
        tryPairUsers();
    }

    private void tryPairUsers() throws IOException {
        // Need at least 2 users to make a pair
        if (waitingUsers.size() < 2) {
            return;
        }
        
        String user1Id = waitingUsers.poll();
        String user2Id = waitingUsers.poll();
        
        // Make sure both users are still connected
        WebSocketSession session1 = sessions.get(user1Id);
        WebSocketSession session2 = sessions.get(user2Id);
        
        if (session1 == null || !session1.isOpen() || session2 == null || !session2.isOpen()) {
            // One of the users disconnected, put the other back in queue
            if (session1 != null && session1.isOpen()) {
                waitingUsers.add(user1Id);
            }
            if (session2 != null && session2.isOpen()) {
                waitingUsers.add(user2Id);
            }
            return;
        }
        
        // Create the pairing
        chatPairs.put(user1Id, user2Id);
        chatPairs.put(user2Id, user1Id);
        
        String user1Name = usernames.get(user1Id);
        String user2Name = usernames.get(user2Id);
        
        // Notify both users
        ChatMessage user1Notification = ChatMessage.createMessage(
            MessageType.PARTNER_CONNECTED,
            "system",
            "You are now chatting with " + user2Name
        );
        sendDirectMessage(session1, user1Notification);
        
        ChatMessage user2Notification = ChatMessage.createMessage(
            MessageType.PARTNER_CONNECTED,
            "system",
            "You are now chatting with " + user1Name
        );
        sendDirectMessage(session2, user2Notification);
        
        // Send user list to both users (for UI purposes)
        // Make sure each user gets a list with themselves and their partner
        List<String> user1List = new ArrayList<>();
        user1List.add(user1Name);
        user1List.add(user2Name);
        ChatMessage user1ListMessage = ChatMessage.createUsersMessage(user1List);
        sendDirectMessage(session1, user1ListMessage);
        
        List<String> user2List = new ArrayList<>();
        user2List.add(user2Name);
        user2List.add(user1Name);
        ChatMessage user2ListMessage = ChatMessage.createUsersMessage(user2List);
        sendDirectMessage(session2, user2ListMessage);
    }
    
    private void forwardMessageToPartner(String senderSessionId, ChatMessage message) throws IOException {
        // Get partner's session ID
        String partnerSessionId = chatPairs.get(senderSessionId);
        if (partnerSessionId == null) {
            // No partner found, send error message back to sender
            WebSocketSession senderSession = sessions.get(senderSessionId);
            if (senderSession != null && senderSession.isOpen()) {
                ChatMessage errorMessage = ChatMessage.createMessage(
                    MessageType.SYSTEM,
                    "system",
                    "You are not connected to a chat partner yet."
                );
                sendDirectMessage(senderSession, errorMessage);
            }
            return;
        }
        
        // Get partner's session
        WebSocketSession partnerSession = sessions.get(partnerSessionId);
        if (partnerSession == null || !partnerSession.isOpen()) {
            // Partner disconnected, send error message back to sender
            WebSocketSession senderSession = sessions.get(senderSessionId);
            if (senderSession != null && senderSession.isOpen()) {
                ChatMessage errorMessage = ChatMessage.createMessage(
                    MessageType.SYSTEM,
                    "system",
                    "Your chat partner has disconnected."
                );
                sendDirectMessage(senderSession, errorMessage);
            }
            return;
        }
        
        // Send message to partner only, not back to sender
        sendDirectMessage(partnerSession, message);
        
        // Do not send back to sender - the frontend will handle displaying the message
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String sessionId = session.getId();
        String username = usernames.remove(sessionId);
        
        // Notify partner if exists
        String partnerId = chatPairs.get(sessionId);
        if (partnerId != null) {
            WebSocketSession partnerSession = sessions.get(partnerId);
            if (partnerSession != null && partnerSession.isOpen()) {
                try {
                    ChatMessage partnerNotification = ChatMessage.createMessage(
                        MessageType.PARTNER_DISCONNECTED,
                        "system",
                        (username != null ? username : "Your partner") + " has disconnected. Waiting for a new partner..."
                    );
                    sendDirectMessage(partnerSession, partnerNotification);
                    
                    // Remove the pairing
                    chatPairs.remove(partnerId);
                    
                    // Add the partner back to waiting queue
                    waitingUsers.add(partnerId);
                    tryPairUsers();
                } catch (IOException e) {
                    log.error("Error notifying partner of disconnection: {}", e.getMessage());
                }
            }
        }
        
        // Clean up
        sessions.remove(sessionId);
        waitingUsers.remove(sessionId);
        chatPairs.remove(sessionId);
        
        log.info("WebSocket connection closed: {}", sessionId);
    }

    private void sendDirectMessage(WebSocketSession session, ChatMessage message) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(message);
            session.sendMessage(new TextMessage(json));
        }
    }
}
