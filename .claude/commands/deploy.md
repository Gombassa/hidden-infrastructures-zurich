Commit all staged and unstaged changes, then push to GitHub to trigger a Cloud Run deployment.

1. Run `git status` to see what's changed
2. Run `git diff HEAD` to review the changes
3. Stage all modified tracked files with `git add -u` (do not add untracked files unless they are clearly intentional)
4. Commit with a concise message describing what changed. If the user passed a message via $ARGUMENTS, use that as the commit message body.
5. Push to origin main
6. Confirm the push succeeded and remind the user that Cloud Run will pick up the change automatically at https://hidden-infrastructures-50944718104.europe-west6.run.app/
