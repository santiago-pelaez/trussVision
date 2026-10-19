# Publishing TrussVision to GitHub (October 2026)

The existing team repository is **https://github.com/santiago-pelaez/trussVision**. It belongs to Santiago Pelaez and is currently a fork of the original Vetin project. Its published Pages link is **https://santiago-pelaez.github.io/trussVision/trussvision/**. Keep the original Git history and MIT license when updating it. Do not create a same-named repository by accident and claim it is the original team source.

## Option A: Update Santiago's existing team repository (recommended)

You need to be added as a **collaborator** with write access, or Santiago can make the upload. On the existing repository: **Settings → Collaborators → Add people** (only the owner can do this). Accept the invitation.

### Using GitHub Desktop (easiest)

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in to the GitHub account with collaborator permissions.
2. Choose **File → Clone repository → URL**, paste `https://github.com/santiago-pelaez/trussVision.git` and choose a local folder.
3. Download and extract the updated ZIP; open the **inner `trussVision-main` folder** containing `index.html`, `README.md`, `trussvision/`, `vetin/`, etc.
4. Copy **the contents of that inner folder** into the root of your freshly cloned `trussVision` folder. Allow file replacements. Keep the clone's hidden `.git` directory (never delete it).
5. In GitHub Desktop, inspect the changed files; make sure `LICENSE`, `vetin/`, and `.github/workflows/ci.yml` are present. Do not add any private key.
6. Enter a commit message like `Improve TrussVision reliability and refresh public UI`, click **Commit to main**, then **Push origin**. If team policy prefers reviews, create a branch and pull request instead.
7. Visit the **Actions** tab and check that the automated tests succeed.
8. Visit **Settings → Pages**; set **Deploy from a branch**, `main`, `/(root)` if it is not already enabled. Wait for the latest Pages deployment, then open `https://santiago-pelaez.github.io/trussVision/trussvision/` and hard-refresh.

### Terminal method (if you have git installed)

```bash
git clone https://github.com/santiago-pelaez/trussVision.git
cd trussVision
# Copy the *contents* of the ZIP's inner trussVision-main/ directory here,
# overwriting matching files, but preserving the .git directory.
git status
git add -A
git commit -m "Improve TrussVision reliability and refresh public UI"
git push origin main
```

The `git push` step needs collaborator write access. GitHub does not allow editing Santiago's repository just because you downloaded the code.

## Option B: Publish on your own GitHub account

If you lack collaborator access, **fork** the existing repository using GitHub's Fork button, clone **your fork** in GitHub Desktop and copy the updated files into it as above. Commit and push to your fork. In the fork's **Settings → Pages**, enable **main** and **/(root)**. Your site will be `https://YOUR-USERNAME.github.io/trussVision/trussvision/`. Then optionally open a **Pull request** from your fork to Santiago's repository to merge improvements into the team project.

If you create a separate new repository instead, choose an empty public repo, upload the contents of `trussVision-main/` directly into its root (not the ZIP or one nested folder), include the MIT license/credits, and enable Pages as above. In that case the URL contains your new repository's name, not `trussVision` unless you named it that.

## Final release checklist

- [ ] Verify `index.html` is in the repository root, not nested inside `trussVision-main/`.
- [ ] Verify `trussvision/`, `vetin/`, `tests/`, `.github/`, and `LICENSE` are included.
- [ ] Confirm the repo is **public** if using standard public GitHub Pages.
- [ ] Wait for green test/deployment runs in **Actions**.
- [ ] Open the published `/trussvision/` site and try **LOAD DEMO**.
- [ ] Choose the beam demo, send it to Vetin, confirm the destination works.
- [ ] Try the AI image scan **with your own personal key**, if you want to verify that path (API credentials and quotas are required).
- [ ] Confirm uploaded diagram dimensions/supports/forces in the review panel before accepting a solution.
- [ ] Publish LinkedIn only when the live updated URL works.

**API key setup:** https://aistudio.google.com/apikey. This is a **Gemini API key**, not a unique "Gemma API key." Google supports some Gemma models on the same Gemini API, but this project's image scanning currently uses Gemini models. Never include your key in GitHub commits, video recordings, or social posts.
