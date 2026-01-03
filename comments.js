// Comment System for Kudos AI Blog
// Reads comments from /comments/comments.json and allows new submissions

(function() {
    'use strict';

    const COMMENTS_FILE = '/comments/comments.json';
    const LOCAL_COMMENTS_KEY = 'kudosai_pending_comments';

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
        return window.location.pathname;
    }

    // Get local pending comments (not yet approved)
    function getLocalComments() {
        try {
            const all = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY)) || {};
            return all[getArticleId()] || [];
        } catch (e) {
            return [];
        }
    }

    // Save local comment
    function saveLocalComment(comment) {
        try {
            const all = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY)) || {};
            const articleId = getArticleId();
            if (!all[articleId]) all[articleId] = [];
            all[articleId].push(comment);
            localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(all));
        } catch (e) {
            console.error('Failed to save comment locally:', e);
        }
    }

    // Delete local comment
    function deleteLocalComment(commentId, password) {
        try {
            const all = JSON.parse(localStorage.getItem(LOCAL_COMMENTS_KEY)) || {};
            const articleId = getArticleId();
            const comments = all[articleId] || [];

            const idx = comments.findIndex(c => c.id === commentId);
            if (idx === -1) return false;

            if (hashPassword(password) !== comments[idx].passwordHash) {
                return false;
            }

            comments.splice(idx, 1);
            all[articleId] = comments;
            localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(all));
            return true;
        } catch (e) {
            return false;
        }
    }

    // Fetch approved comments from JSON file
    async function fetchApprovedComments() {
        try {
            const response = await fetch(COMMENTS_FILE + '?t=' + Date.now());
            if (!response.ok) return [];
            const data = await response.json();
            const articleId = getArticleId();
            return data.comments[articleId] || [];
        } catch (e) {
            console.log('Could not load comments file:', e);
            return [];
        }
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
    async function renderComments() {
        const container = document.getElementById('comments-list');
        if (!container) return;

        container.innerHTML = '<p class="loading-comments">Loading comments...</p>';

        // Get both approved (from file) and local pending comments
        const approvedComments = await fetchApprovedComments();
        const localComments = getLocalComments();

        // Combine and sort by timestamp
        const allComments = [
            ...approvedComments.map(c => ({ ...c, isApproved: true })),
            ...localComments.map(c => ({ ...c, isApproved: false, isPending: true }))
        ].sort((a, b) => a.timestamp - b.timestamp);

        if (allComments.length === 0) {
            container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = allComments.map(comment => `
            <div class="comment-item ${comment.isPending ? 'pending-comment' : ''}" data-id="${comment.id}">
                ${comment.isPending ? '<span class="pending-badge">Pending approval</span>' : ''}
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(comment.name)}</span>
                    <span class="comment-date">${formatDate(comment.timestamp)}</span>
                </div>
                <p class="comment-text">${escapeHtml(comment.text)}</p>
                ${comment.isPending ? `<button class="comment-delete-btn" onclick="window.showDeleteModal('${comment.id}')">Delete</button>` : ''}
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

        if (deleteLocalComment(commentId, password)) {
            window.closeDeleteModal();
            renderComments();
            alert('Comment deleted successfully.');
        } else {
            alert('Incorrect password or comment not found.');
        }
    };

    // Handle form submission
    async function handleSubmit(e) {
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
            articleUrl: window.location.href,
            articlePath: getArticleId()
        };

        // Save locally (pending approval)
        saveLocalComment(comment);

        // Send notification via EmailJS for approval
        if (typeof emailjs !== 'undefined') {
            try {
                await emailjs.send('service_k1ob3bf', 'template_nh74jz8', {
                    from_name: 'New Blog Comment - Pending Approval',
                    message: `NEW COMMENT SUBMISSION\n\nArticle: ${window.location.href}\nArticle Path: ${getArticleId()}\n\nName: ${name}\nEmail: ${email}\nComment ID: ${comment.id}\nTimestamp: ${comment.timestamp}\n\nComment Text:\n${text}\n\n---\nTo approve this comment, add it to /comments/comments.json`
                });
            } catch (err) {
                console.log('Email notification failed:', err);
            }
        }

        // Clear form
        e.target.reset();

        // Re-render comments
        await renderComments();

        alert('Your comment has been submitted! It will appear immediately on your device and will be visible to others after approval.');
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
