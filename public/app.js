document.addEventListener('DOMContentLoaded', async () => {
    const loginContainer = document.getElementById('login-container');
    const chatContainer = document.getElementById('chat-container');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('toggle-password');
    const loginButton = document.getElementById('login-button');
    const loginMessage = document.getElementById('login-message');
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const typingStatusDiv = document.getElementById('typing-status');

    let socket;
    let token = localStorage.getItem('token');
    let currentUsername = null;

    // Password visibility toggle
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }

    const displayMessage = (message, isSelf = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isSelf ? 'self' : 'other');
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    };

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }
            const data = await response.json();
            messagesDiv.innerHTML = ''; // Clear existing messages
            data.data.forEach(msg => {
                displayMessage(`${msg.sender}: ${msg.content}`, msg.sender === currentUsername);
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            loginMessage.textContent = 'Error fetching messages.';
        }
    };

    const setupChat = () => {
        loginContainer.style.display = 'none';
        chatContainer.style.display = 'block';

        socket = io({
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            console.log('Connected to Socket.IO');
            fetchMessages();
        });

        socket.on('message', (msg) => {
            displayMessage(`${msg.sender}: ${msg.content}`, msg.sender === currentUsername);
        });

        socket.on('typing', (username) => {
            if (username !== currentUsername) {
                typingStatusDiv.textContent = `${username} is typing...`;
            }
        });

        socket.on('stop typing', () => {
            typingStatusDiv.textContent = '';
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO');
        });

        sendButton.addEventListener('click', () => {
            const content = messageInput.value.trim();
            console.log('Sending message:', content);
            if (content) {
                socket.emit('send_message', { content });
                messageInput.value = '';
            }
        });

        messageInput.addEventListener('input', () => {
            if (messageInput.value.trim()) {
                socket.emit('typing');
            } else {
                socket.emit('stop typing');
            }
        });
    };

    loginButton.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                token = data.data.token;
                localStorage.setItem('token', token);
                currentUsername = data.data.user.username; // Set currentUsername on successful login
                setupChat();
            } else {
                loginMessage.textContent = data.message || 'Login failed.';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginMessage.textContent = 'An error occurred during login.';
        }
    });

    // Check if token exists on page load
    if (token) {
        // Validate token and get user info
        try {
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (response.ok && data.success) {
                currentUsername = data.data.username; // Corrected to data.data.username
                setupChat();
            } else {
                console.error('Token validation failed or user data not found:', data.message);
                localStorage.removeItem('token'); // Clear invalid token
            }
        } catch (error) {
            console.error('Error validating token:', error);
            localStorage.removeItem('token'); // Clear token on network error
        }
    }
});
