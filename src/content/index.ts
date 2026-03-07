import './style.css';
import { GitHubPullRequestController } from './pullRequestController';

const controller = new GitHubPullRequestController();

void controller.start().catch((error) => {
  console.error('show-me-talk failed to start', error);
});
