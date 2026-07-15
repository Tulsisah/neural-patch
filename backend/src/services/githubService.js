const axios = require('axios');
const logger = require('../utils/logger');

class GithubService {
  // Exchange GitHub OAuth code for user Access Token
  async getAccessToken(code, state) {
    try {
      if (!state) {
        throw new Error('State parameter missing: CSRF validation failed');
      }
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      }, {
        headers: {
          Accept: 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      logger.error(`Error exchanging OAuth code: ${error.stack}`);
      throw error;
    }
  }

  // Fetch authenticated user profile data
  async getUserProfile(accessToken) {
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching user profile: ${error.stack}`);
      throw error;
    }
  }

  // Fetch user emails to get private primary email
  async getUserEmails(accessToken) {
    try {
      const response = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      logger.warn(`Could not fetch user emails: ${error.message}`);
      return [];
    }
  }

  // Fetch authenticated user repositories (with pagination)
  async fetchUserRepos(accessToken) {
    try {
      let repos = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await axios.get(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json'
          }
        });
        const pageRepos = response.data;
        if (!Array.isArray(pageRepos) || pageRepos.length === 0) {
          hasNextPage = false;
        } else {
          repos = repos.concat(pageRepos);
          if (pageRepos.length < 100) {
            hasNextPage = false;
          } else {
            page++;
          }
        }
      }
      return repos;
    } catch (error) {
      logger.error(`Error fetching user repos: ${error.stack}`);
      return [];
    }
  }

  // Fetch code diff for a Pull Request
  async fetchPullRequestDiff(owner, repo, prNumber) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`, {
        responseType: 'text',
        maxContentLength: 5000000,
        headers: {
          Accept: 'application/vnd.github.v3.diff',
          // Authorization using standard token if present
          ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` })
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching PR diff for ${owner}/${repo} PR #${prNumber}: ${error.stack}`);
      throw error;
    }
  }

  // Fetch code diff for a Commit push event
  async fetchCommitDiff(owner, repo, commitHash) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/commits/${commitHash}`, {
        responseType: 'text',
        maxContentLength: 5000000,
        headers: {
          Accept: 'application/vnd.github.v3.diff',
          ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` })
        }
      });
      return response.data;
    } catch (error) {
      logger.error(`Error fetching commit diff for ${owner}/${repo} commit ${commitHash}: ${error.stack}`);
      throw error;
    }
  }

  // Post AI secure patch suggestion as Review Comment on PR
  async postPRComment(owner, repo, prNumber, commitHash, vuln) {
    try {
      const body = `### ⚠️ **NeuralPatch DevSecOps Alert**: ${vuln.title}
      
**Severity**: \`${vuln.severity.toUpperCase()}\`
**File**: \`${vuln.file}\` (Line: ${vuln.line})

**Description**:
${vuln.description}

**Suggested Security Patch Fix**:
\`\`\`javascript
${vuln.suggestion}
\`\`\``;

      // Mock comment trigger when no GITHUB_TOKEN is present
      if (!process.env.GITHUB_TOKEN) {
        logger.info(`GITHUB_TOKEN missing. Simulation: Posted review comment on PR #${prNumber} for file ${vuln.file}`);
        return Math.floor(Math.random() * 100000);
      }

      // Check for duplicate comments
      const existingComments = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      
      const duplicate = existingComments.data.find(c => 
        c.path === vuln.file && c.line === vuln.line && c.body.includes(vuln.title)
      );

      if (duplicate) {
        logger.info(`Duplicate comment detected for PR #${prNumber} on ${vuln.file}:${vuln.line}. Skipping.`);
        return duplicate.id;
      }

      const response = await axios.post(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
        {
          body,
          commit_id: commitHash,
          path: vuln.file,
          line: vuln.line,
          side: vuln.side || 'RIGHT'
        },
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json'
          }
        }
      );
      return response.data.id;
    } catch (error) {
      logger.error(`Error posting comment to PR #${prNumber}: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  // Fetch file content, replace vulnerable code, and commit it back to the branch
  async commitFileChange(owner, repo, branch, filePath, originalCode, patchedCode, commitMessage) {
    try {
      const token = process.env.GITHUB_TOKEN;
      if (!token) {
        logger.info(`GITHUB_TOKEN missing. Simulation: Successfully auto-committed patch to ${owner}/${repo} branch: ${branch}`);
        return { success: true, simulated: true };
      }

      const encodedFilePath = filePath.split('/').map(encodeURIComponent).join('/');
      // 1. Get the file's current content and SHA
      const getFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedFilePath}?ref=${branch}`;
      const fileRes = await axios.get(getFileUrl, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      const sha = fileRes.data.sha;
      const fileSize = fileRes.data.size || 0;

      if (fileSize > 1000000) {
        throw new Error(`File '${filePath}' exceeds the 1MB size limit of the GitHub Contents API (current size: ${(fileSize / 1024 / 1024).toFixed(2)}MB). Use Git Data API or update locally.`);
      }

      const decodedContent = Buffer.from(fileRes.data.content, 'base64').toString('utf8');

      // 2. Perform the replacement in the file content
      // Normalize line endings to avoid mismatch
      const normalizedContent = decodedContent.replace(/\r\n/g, '\n');
      const normalizedOriginal = originalCode.replace(/\r\n/g, '\n');
      
      const occurrences = normalizedContent.split(normalizedOriginal).length - 1;
      if (occurrences === 0) {
        throw new Error(`Target code block to patch could not be found in '${filePath}'.`);
      }
      if (occurrences > 1) {
        throw new Error(`Ambiguous patch: Target code block matches ${occurrences} times in '${filePath}'. Patch aborted to prevent incorrect file modification.`);
      }
      const updatedContent = normalizedContent.replace(normalizedOriginal, patchedCode);

      const encodedContent = Buffer.from(updatedContent, 'utf8').toString('base64');

      // 3. Commit the updated file content back to the repository branch
      const putFileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedFilePath}`;
      await axios.put(putFileUrl, {
        message: commitMessage || `security: resolve vulnerability in ${filePath} via NeuralPatch AI`,
        content: encodedContent,
        sha,
        branch
      }, {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      logger.info(`Auto-committed patch successfully to ${owner}/${repo} branch: ${branch} file: ${filePath}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error auto-committing patch: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }
  async fetchRepoTree(owner, repo, token) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      // Extract top-level or interesting files
      const tree = response.data.tree;
      const files = tree
        .filter(item => item.type === 'blob')
        .map(item => item.path)
        .filter(path => !path.includes('node_modules') && !path.includes('.git'))
        .slice(0, 50); // limit context size
      return files;
    } catch (error) {
      if (error.response?.status === 404) {
        // Try master branch if main fails
        try {
          const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/vnd.github.v3+json'
            }
          });
          return res.data.tree.filter(item => item.type === 'blob').map(item => item.path).slice(0, 50);
        } catch (e) {
          throw new Error('Failed to fetch from both main and master branches.');
        }
      }
      throw error;
    }
  }

  async fetchRepoDefaultBranch(owner, repo, token) {
    try {
      const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      return response.data.default_branch || 'main';
    } catch (error) {
      return 'main';
    }
  }
}

module.exports = new GithubService();
