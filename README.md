# Random Chat Application

A simple real-time chat application built with React.js (Next.js) frontend and Spring Boot backend.

## Project Structure

\`\`\`
java-random-chat/
├── backend/                 # Spring Boot backend
│   └── src/
│       └── main/
│           ├── java/
│           │   └── com/example/randomchat/
│           │       ├── config/
│           │       ├── controller/
│           │       ├── handler/
│           │       ├── model/
│           │       └── RandomChatApplication.java
│           └── resources/
│               └── application.properties
├── front/                   # Next.js frontend
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── public/
└── README.md
\`\`\`

## Features

- Real-time messaging using WebSockets
- User join/leave notifications
- Online users list
- Responsive design for desktop and mobile
- Simple username-based authentication

## Setup and Running

### Backend (Spring Boot)

1. Navigate to the backend directory:
   \`\`\`bash
   cd backend
   \`\`\`

2. Build the application:
   \`\`\`bash
   mvn clean install
   \`\`\`

3. Run the application:
   \`\`\`bash
   mvn spring-boot:run
   \`\`\`

4. The backend will start on `http://localhost:8080`

### Frontend (Next.js)

1. Navigate to the front directory:
   \`\`\`bash
   cd front
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Access the application at `http://localhost:3000`

## How It Works

1. The Spring Boot backend creates a WebSocket server that handles connections, messages, and broadcasts
2. The React frontend connects to this WebSocket server to send and receive messages
3. When a user joins, they provide a username and connect to the chat
4. The backend tracks all connected users and broadcasts updates when users join or leave
5. Messages are sent in real-time to all connected users

## Technologies Used

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring WebSocket
- Lombok
- Jackson for JSON processing

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- shadcn/ui components
- WebSocket API

## Future Enhancements

- User authentication with JWT
- Private messaging
- Multiple chat rooms
- Message persistence with database
- Typing indicators
- File sharing
- Emojis and rich text support
