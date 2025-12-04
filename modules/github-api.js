/**
 * GitHub API Integration for MAX GYM CAFE
 * Provides shared data storage using GitHub repository
 */

const GITHUB_CONFIG = {
    owner: import.meta.env.VITE_REPO_OWNER,
    repo: import.meta.env.VITE_REPO_NAME,
    branch: 'main',            // Branch name
    dataPath: 'data/menu.json' // Path to menu data file
};

/**
 * Fetch menu data from GitHub repository
 * @returns {Promise<Array>} Menu data
 */
export async function fetchMenuFromGitHub() {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}?ref=${GITHUB_CONFIG.branch}`;

    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            },
            cache: 'no-cache' // Always get fresh data
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.warn('Menu file not found on GitHub, will use seed data');
                return null;
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();

        // GitHub returns base64 encoded content
        const content = atob(data.content);
        const menu = JSON.parse(content);

        // Store SHA for future updates
        sessionStorage.setItem('github_menu_sha', data.sha);

        return menu;
    } catch (error) {
        console.error('Error fetching from GitHub:', error);
        return null;
    }
}

/**
 * Save menu data to GitHub repository (Admin only)
 * @param {Array} menu - Menu data to save
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<boolean>} Success status
 */
export async function saveMenuToGitHub(menu, token) {
    if (!token) {
        throw new Error('GitHub token is required for saving');
    }

    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.dataPath}`;

    try {
        // Get current SHA (required for updates)
        const sha = sessionStorage.getItem('github_menu_sha');

        // Prepare content
        const content = JSON.stringify(menu, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(content))); // Handle UTF-8

        const body = {
            message: `Update menu - ${new Date().toLocaleString('fa-IR')}`,
            content: encodedContent,
            branch: GITHUB_CONFIG.branch
        };

        // Include SHA if updating existing file
        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `GitHub API error: ${response.status}`);
        }

        const result = await response.json();

        // Update SHA for next save
        sessionStorage.setItem('github_menu_sha', result.content.sha);

        return true;
    } catch (error) {
        console.error('Error saving to GitHub:', error);
        throw error;
    }
}

/**
 * Validate GitHub token
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<boolean>} Token validity
 */
export async function validateGitHubToken(token) {
    if (!token) return false;

    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        return response.ok;
    } catch (error) {
        console.error('Error validating token:', error);
        return false;
    }
}

/**
 * Get raw URL for direct access to menu file
 * @returns {string} Raw GitHub URL
 */
export function getMenuRawUrl() {
    return `https://raw.githubusercontent.com/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}/${GITHUB_CONFIG.dataPath}`;
}
