// Comment System for Kudos AI Blog
// Uses localStorage for persistence and EmailJS for notifications

(function() {
    'use strict';

    const COMMENTS_KEY = 'kudosai_comments';

    // Simple hash function for password verification
    function hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(16);
    }

    // Get article ID from URL
    function getArticleId() {
        return window.location.pathname.replace(/[^a-zA-Z0-9]/g, '_');
    }

    // Get all comments from localStorage
    function getAllComments() {
        try {
            return JSON.parse(localStorage.getItem(COMMENTS_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    // Get comments for current article
    function getArticleComments() {
        const allComments = getAllComments();
        return allComments[getArticleId()] || [];
    }

    // Save comment
    function saveComment(comment) {
        const allComments = getAllComments();
        const articleId = getArticleId();

        if (!allComments[articleId]) {
            allComments[articleId] = [];
        }

        allComments[articleId].push(comment);
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
    }

    // Delete comment
    function deleteComment(commentId, password) {
        const allComments = getAllComments();
        const articleId = getArticleId();
        const comments = allComments[articleId] || [];

        const commentIndex = comments.findIndex(c => c.id === commentId);
        if (commentIndex === -1) return false;

        const comment = comments[commentIndex];
        if (hashPassword(password) !== comment.passwordHash) {
            return false;
        }

        comments.splice(commentIndex, 1);
        allComments[articleId] = comments;
        localStorage.setItem(COMMENTS_KEY, JSON.stringify(allComments));
        return true;
    }

    // Format date
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render comments
    function renderComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;

        const comments = getArticleComments();

        if (comments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = comments.map(comment => `
            <div class="comment-item" data-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.name)}</span>
                    <span class="comment-date">${formatDate(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${escapeHtml(comment.text)}</p>
                <button class="comment-delete-btn" onclick="window.showDeleteModal('${comment.id}')">Delete</button>
            </div>
        `).join('');
    }

    // Show delete modal
    window.showDeleteModal = function(commentId) {
        const modal = document.createElement('div');
        modal.className = 'delete-modal';
        modal.id = 'delete-modal';
        modal.innerHTML = `
            <div class="delete-modal-content">
                <h4>Delete Comment</h4>
                <p>Enter the password you used when posting this comment:</p>
                <input type="password" id="delete-password" placeholder="Enter password">
                <div class="modal-buttons">
                    <button class="cancel-btn" onclick="window.closeDeleteModal()">Cancel</button>
                    <button class="confirm-delete-btn" onclick="window.confirmDelete('${commentId}')">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    };

    // Close delete modal
    window.closeDeleteModal = function() {
        const modal = document.getElementById('delete-modal');
        if (modal) modal.remove();
    };

    // Confirm delete
    window.confirmDelete = function(commentId) {
        const password = document.getElementById('delete-password').value;
        if (!password) {
            alert('Please enter the password.');
            return;
        }

        if (deleteComment(commentId, password)) {
            window.closeDeleteModal();
            renderComments();
            alert('Comment deleted successfully.');
        } else {
            alert('Incorrect password. Please try again.');
        }
    };

    // Handle form submission
    function handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('comment-name').value.trim();
        const email = document.getElementById('comment-email').value.trim();
        const password = document.getElementById('comment-password').value;
        const text = document.getElementById('comment-text').value.trim();

        if (!name || !email || !password || !text) {
            alert('Please fill in all fields.');
            return;
        }

        if (password.length < 4) {
            alert('Password must be at least 4 characters.');
            return;
        }

        const comment = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            name: name,
            email: email,
            passwordHash: hashPassword(password),
            text: text,
            timestamp: Date.now(),
            articleUrl: window.location.href
        };

        // Save to localStorage
        saveComment(comment);

        // Send notification via EmailJS if available
        if (typeof emailjs !== 'undefined') {
            emailjs.send('service_k1ob3bf', 'template_nh74jz8', {
                from_name: 'New Blog Comment',
                message: `New comment on: ${window.location.href}\n\nName: ${name}\nEmail: ${email}\n\nComment:\n${text}`
            }).catch(function(err) {
                console.log('Email notification failed:', err);
            });
        }

        // Clear form
        e.target.reset();

        // Re-render comments
        renderComments();

        alert('Your comment has been posted!');
    }

    // Initialize
    document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('comment-form');
        if (form) {
            form.addEventListener('submit', handleSubmit);
        }
        renderComments();
    });
})();
