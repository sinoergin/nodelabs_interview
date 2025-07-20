document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const DOM = {
        authContainer: document.getElementById('auth-container'),
        loginFormContainer: document.getElementById('login-form-container'),
        registerFormContainer: document.getElementById('register-form-container'),
        chatContainer: document.getElementById('chat-container'),
        loginEmailInput: document.getElementById('login-email'),
        loginPasswordInput: document.getElementById('login-password'),
        loginButton: document.getElementById('login-button'),
        loginMessage: document.getElementById('login-message'),
        registerUsernameInput: document.getElementById('register-username'),
        registerEmailInput: document.getElementById('register-email'),
        registerPasswordInput: document.getElementById('register-password'),
        registerButton: document.getElementById('register-button'),
        registerMessage: document.getElementById('register-message'),
        showRegisterLink: document.getElementById('show-register'),
        showLoginLink: document.getElementById('show-login'),
        toggleLoginPassword: document.getElementById('toggle-login-password'),
        toggleRegisterPassword: document.getElementById('toggle-register-password'),
        logoutButton: document.getElementById('logout-button'),
        conversationsList: document.getElementById('conversations-list'),
        profileModal: document.getElementById('profile-modal'),
        closeProfileModal: document.getElementById('close-profile-modal'),
        editProfileButton: document.getElementById('edit-profile-button'),
        saveProfileButton: document.getElementById('save-profile-button'),
        profileUsernameInput: document.getElementById('profile-username'),
        profileNameInput: document.getElementById('profile-name'),
        profileSurnameInput: document.getElementById('profile-surname'),
        profileGenderSelect: document.getElementById('profile-gender'),
        profileBirthdateInput: document.getElementById('profile-birthdate'),
        profileMessage: document.getElementById('profile-message'),
        chatMainWrapper: document.getElementById('chat-main'),
        conversationSearchDiv: document.getElementById('conversation-search'),
        findConversationButtons: document.getElementById('find-conversation-buttons'),
        backToConversationsBtn: document.getElementById('back-to-conversations-btn'),
        currentConversationPartner: document.getElementById('current-conversation-partner'),
        findConversationButton: document.getElementById('find-conversation-btn'),
        cancelFindConversationButton: document.getElementById('cancel-find-conversation-btn'),
        conversationStatusDiv: document.getElementById('conversation-status'),
        conversationAreaDiv: document.getElementById('conversation-area'),
        messagesDiv: document.getElementById('messages'),
        messageInput: document.getElementById('message-input'),
        sendButton: document.getElementById('send-button'),
        typingStatusDiv: document.getElementById('typing-status'),
    };

    // --- State ---
    let socket;
    let accessToken = localStorage.getItem('accessToken');
    let refreshToken = localStorage.getItem('refreshToken');
    let currentUsername = null;
    let currentConversationId = null;

    // --- Utility Functions ---
    // --- Utility Functions ---
    const fetchWithAuth = async (url, options = {}) => {
        let response = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 401) {
            const refreshSuccessful = await attemptRefresh();
            if (refreshSuccessful) {
                response = await fetch(url, {
                    ...options,
                    headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
                });
            } else {
                logout();
                return response;
            }
        }
        return response;
    };

    const attemptRefresh = async () => {
        try {
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
            const data = await response.json();
            if (data.success) {
                accessToken = data.data.accessToken;
                refreshToken = data.data.refreshToken;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                return true;
            } else {
                console.error('Token refresh failed:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error during token refresh:', error);
            return false;
        }
    };

    // --- Authentication Module ---
    const Auth = {
        logout: async () => {
            try {
                // API'ye logout isteği gönder
                await fetchWithAuth('/api/auth/logout', { method: 'POST' });
            } catch (error) {
                console.error('Logout API error:', error);
            } finally {
                // Her durumda localStorage'ı temizle ve UI'ı güncelle
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (socket) socket.disconnect();
                Auth.showAuthForms();
            }
        },

        showAuthForms: () => {
            DOM.authContainer.style.display = 'block';
            DOM.chatContainer.style.display = 'none';
            DOM.loginFormContainer.style.display = 'block';
            DOM.registerFormContainer.style.display = 'none';
        },

        showChatUI: () => {
            DOM.authContainer.style.display = 'none';
            DOM.chatContainer.style.display = 'flex';
            DOM.chatMainWrapper.style.display = 'flex';
            Chat.fetchConversations();
            Chat.showConversationSearchUI();
        },

        handleLogin: async () => {
            const email = DOM.loginEmailInput.value;
            const password = DOM.loginPasswordInput.value;

            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (data.success) {
                accessToken = data.data.accessToken;
                refreshToken = data.data.refreshToken;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                currentUsername = data.data.user.username;
                Auth.showChatUI();
                Chat.setupSocketListeners();
            } else {
                DOM.loginMessage.textContent = 'Login failed.';
            }
        },

        handleRegister: async () => {
            const username = DOM.registerUsernameInput.value;
            const email = DOM.registerEmailInput.value;
            const password = DOM.registerPasswordInput.value;

            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password }),
            });
            const data = await response.json();
            if (data.success) {
                DOM.registerMessage.textContent = 'Registration successful! Please login.';
                DOM.registerMessage.style.color = 'green';
                DOM.loginFormContainer.style.display = 'block';
                DOM.registerFormContainer.style.display = 'none';
            } else {
                DOM.registerMessage.textContent = data.message || 'Registration failed.';
                DOM.registerMessage.style.color = 'red';
            }
        },

        togglePasswordVisibility: (inputElement, toggleElement) => {
            const type = inputElement.getAttribute('type') === 'password' ? 'text' : 'password';
            inputElement.setAttribute('type', type);
            toggleElement.textContent = type === 'password' ? '🔒' : '🔓';
        },
    };

    // --- Chat UI Module ---
    const Chat = {
        showConversationSearchUI: () => {
            DOM.conversationSearchDiv.style.display = 'flex';
            DOM.findConversationButtons.style.display = 'flex';
            DOM.conversationAreaDiv.style.display = 'none';
            DOM.conversationStatusDiv.textContent = 'Find a partner to start chatting.';
            DOM.findConversationButton.style.display = 'inline-block';
            DOM.cancelFindConversationButton.style.display = 'none';
        },

        showWaitingForPartner: () => {
            DOM.conversationStatusDiv.textContent = 'Searching for a partner...';
            DOM.findConversationButton.style.display = 'none';
            DOM.cancelFindConversationButton.style.display = 'inline-block';
        },

        showConversationAreaUI: (conversationId, partnerUsername) => {
            currentConversationId = conversationId;
            DOM.conversationSearchDiv.style.display = 'none';
            DOM.conversationAreaDiv.style.display = 'flex';
            DOM.currentConversationPartner.textContent = partnerUsername
                ? `Chat with ${partnerUsername}`
                : 'New Conversation';
            DOM.messagesDiv.innerHTML = '';
            DOM.messageInput.value = '';

            // Join the conversation room for real-time messaging
            if (socket) {
                socket.emit('join_conversation', conversationId);
            }

            Chat.fetchMessages(conversationId);
        },

        fetchConversations: async () => {
            try {
                const response = await fetchWithAuth('/api/conversations');
                const result = await response.json();
                if (result.success) {
                    DOM.conversationsList.innerHTML = '';
                    result.data.forEach((conversation) => {
                        const listItem = document.createElement('li');
                        const otherParticipants = conversation.participants.filter(
                            (p) => p.username !== currentUsername,
                        );
                        const partnerUsername =
                            otherParticipants.length > 0
                                ? otherParticipants[0].username
                                : 'Self Chat';

                        const conversationText = document.createElement('span');
                        conversationText.textContent = partnerUsername;
                        conversationText.classList.add('conversation-text');
                        conversationText.addEventListener('click', () => {
                            Chat.showConversationAreaUI(conversation._id, partnerUsername);
                        });

                        const deleteIcon = document.createElement('span');
                        deleteIcon.textContent = 'X';
                        deleteIcon.classList.add('delete-conversation-icon');
                        deleteIcon.addEventListener('click', async (e) => {
                            e.stopPropagation();
                            if (confirm('Are you sure you want to delete this conversation?')) {
                                await Chat.handleDeleteConversation(conversation._id);
                            }
                        });

                        listItem.appendChild(conversationText);
                        listItem.appendChild(deleteIcon);
                        listItem.dataset.conversationId = conversation._id;
                        DOM.conversationsList.appendChild(listItem);
                    });
                }
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        },

        fetchMessages: async (conversationId) => {
            try {
                const response = await fetchWithAuth(
                    `/api/conversations/${conversationId}/messages`,
                );
                const result = await response.json();
                if (result.success) {
                    result.data.forEach((msg) => Chat.displayMessage(msg));
                }
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        },

        displayMessage: (msg) => {
            const isSelf = msg.sender.username === currentUsername;
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', isSelf ? 'self' : 'other');
            messageElement.innerHTML = `<strong>${msg.sender.username}:</strong> ${msg.content}`;
            DOM.messagesDiv.appendChild(messageElement);
            DOM.messagesDiv.scrollTop = DOM.messagesDiv.scrollHeight;
        },

        setupSocketListeners: () => {
            socket = io({ auth: { token: accessToken } });
            console.log('Socket.IO client initialized.');

            socket.on('connect', () => console.log('Connected to Socket.IO'));

            socket.on('conversation_started', ({ conversationId, partnerUsername }) => {
                console.log(`Conversation started with ${partnerUsername}: ${conversationId}`);
                console.log(`Conversation started: ${conversationId} with ${partnerUsername}`);
                Chat.showConversationAreaUI(conversationId, partnerUsername);
                socket.emit('join_conversation', conversationId);
            });

            socket.on('message_received', (message) => {
                console.log('Message received:', message);
                Chat.displayMessage(message);
                socket.emit('message_read', { messageId: message._id });
            });

            socket.on('user_typing', ({ username }) => {
                DOM.typingStatusDiv.textContent = `${username} is typing...`;
            });

            socket.on('user_stopped_typing', () => {
                DOM.typingStatusDiv.textContent = '';
            });

            socket.on('disconnect', () => console.log('Disconnected from Socket.IO'));
        },

        handleDeleteConversation: async (conversationId) => {
            try {
                const response = await fetchWithAuth(`/api/conversations/${conversationId}`, {
                    method: 'DELETE',
                });
                const result = await response.json();
                if (result.success) {
                    console.log('Conversation deleted successfully:', conversationId);
                    Chat.fetchConversations();
                    Chat.showConversationSearchUI();
                } else {
                    console.error('Failed to delete conversation:', result.message);
                    alert(`Failed to delete conversation: ${result.message}`);
                }
            } catch (error) {
                console.error('Error deleting conversation:', error);
                alert('An error occurred while deleting the conversation.');
            }
        },
    };

    // --- Profile Management Module ---
    const Profile = {
        openProfileModal: async () => {
            DOM.profileModal.style.display = 'flex';
            try {
                const response = await fetchWithAuth('/api/auth/me');
                const result = await response.json();
                if (result.success) {
                    const user = result.data;
                    DOM.profileUsernameInput.value = user.username || '';
                    DOM.profileNameInput.value = user.name || '';
                    DOM.profileSurnameInput.value = user.surname || '';
                    DOM.profileGenderSelect.value = user.gender || '';
                    DOM.profileBirthdateInput.value = user.birthdate
                        ? new Date(user.birthdate).toISOString().split('T')[0]
                        : '';
                } else {
                    DOM.profileMessage.textContent =
                        result.message || 'Failed to fetch profile data.';
                    DOM.profileMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
                DOM.profileMessage.textContent = 'Error fetching profile data.';
                DOM.profileMessage.style.color = 'red';
            }
        },

        closeProfileModal: () => {
            DOM.profileModal.style.display = 'none';
        },

        saveProfile: async () => {
            const updatedProfile = {
                username: DOM.profileUsernameInput.value,
                name: DOM.profileNameInput.value,
                surname: DOM.profileSurnameInput.value,
                gender: DOM.profileGenderSelect.value,
                birthdate: DOM.profileBirthdateInput.value,
            };

            try {
                const response = await fetchWithAuth('/api/user/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedProfile),
                });
                const result = await response.json();
                if (result.success) {
                    DOM.profileMessage.textContent = 'Profile updated successfully!';
                    DOM.profileMessage.style.color = 'green';
                } else {
                    DOM.profileMessage.textContent = result.message || 'Failed to update profile.';
                    DOM.profileMessage.style.color = 'red';
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                DOM.profileMessage.textContent = 'Error updating profile.';
                DOM.profileMessage.style.color = 'red';
            }
        },
    };

    // --- Event Listeners ---
    const initEventListeners = () => {
        DOM.loginButton.addEventListener('click', Auth.handleLogin);
        DOM.registerButton.addEventListener('click', Auth.handleRegister);
        DOM.logoutButton.addEventListener('click', Auth.logout);
        DOM.showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.loginFormContainer.style.display = 'none';
            DOM.registerFormContainer.style.display = 'block';
        });
        DOM.showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.loginFormContainer.style.display = 'block';
            DOM.registerFormContainer.style.display = 'none';
        });
        DOM.toggleLoginPassword.addEventListener('click', () =>
            Auth.togglePasswordVisibility(DOM.loginPasswordInput, DOM.toggleLoginPassword),
        );
        DOM.toggleRegisterPassword.addEventListener('click', () =>
            Auth.togglePasswordVisibility(DOM.registerPasswordInput, DOM.toggleRegisterPassword),
        );
        DOM.findConversationButton.addEventListener('click', () => {
            socket.emit('find_conversation');
            Chat.showWaitingForPartner();
        });
        DOM.cancelFindConversationButton.addEventListener('click', () => {
            socket.emit('cancel_find_conversation');
            Chat.showConversationSearchUI();
        });
        DOM.sendButton.addEventListener('click', () => {
            const content = DOM.messageInput.value.trim();
            if (content && currentConversationId) {
                socket.emit('send_message', { conversationId: currentConversationId, content });
                DOM.messageInput.value = '';
            }
        });
        DOM.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                DOM.sendButton.click();
                socket.emit('stopped_typing', { conversationId: currentConversationId });
            } else {
                socket.emit('typing', { conversationId: currentConversationId });
            }
        });

        DOM.messageInput.addEventListener('blur', () => {
            // When input loses focus, stop typing
            if (currentConversationId) {
                socket.emit('stopped_typing', { conversationId: currentConversationId });
            }
        });
        DOM.editProfileButton.addEventListener('click', Profile.openProfileModal);
        DOM.closeProfileModal.addEventListener('click', Profile.closeProfileModal);
        DOM.saveProfileButton.addEventListener('click', Profile.saveProfile);
        DOM.backToConversationsBtn.addEventListener('click', Chat.showConversationSearchUI);
        window.addEventListener('click', (event) => {
            if (event.target === DOM.profileModal) {
                Profile.closeProfileModal();
            }
        });
    };

    // --- Initial Load ---
    const initializeApp = async () => {
        initEventListeners();
        if (refreshToken) {
            try {
                const response = await fetchWithAuth('/api/auth/me');
                const data = await response.json();
                if (response.ok && data.success) {
                    currentUsername = data.data.username;
                    Auth.showChatUI();
                    Chat.setupSocketListeners();
                    Chat.fetchConversations();
                } else {
                    Auth.logout();
                }
            } catch (error) {
                Auth.logout();
            }
        }
    };

    initializeApp();
});
