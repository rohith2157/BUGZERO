# Contributing to AutonomousQA

First off, thank you for considering contributing to **AutonomousQA**! 🎉  
Every contribution — whether it's a bug report, feature request, documentation fix, or code change — helps make autonomous testing better for everyone.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Style Guides](#style-guides)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [rohith@autonomousqa.io](mailto:rohith@autonomousqa.io).

## How Can I Contribute?

### 🐛 Report Bugs

- Use the [Bug Report](https://github.com/rohith2157/BUGZERO/issues/new?template=bug_report.md) issue template
- Include steps to reproduce, expected vs. actual behavior, and environment details

### 💡 Suggest Features

- Use the [Feature Request](https://github.com/rohith2157/BUGZERO/issues/new?template=feature_request.md) issue template
- Describe the problem you're solving and your proposed solution

### 📖 Improve Documentation

- Fix typos, clarify instructions, add examples
- No issue required — just submit a PR

### 🔧 Submit Code

1. Check existing [issues](https://github.com/rohith2157/BUGZERO/issues) for what's being worked on
2. Comment on an issue to claim it (or open a new one)
3. Fork the repo and create your branch
4. Submit a pull request

## Development Setup

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/BUGZERO.git
cd BUGZERO

# 2. Start databases
docker-compose up -d

# 3. Setup API Gateway
cd gateway
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
node prisma/seed.js
npm run dev

# 4. Setup AI Core (new terminal)
cd ai-core
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
cp .env.example .env
python main.py

# 5. Setup Frontend (new terminal)
cd autonomousqa-frontend
npm install
npm run dev
```

## Branching Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch for features |
| `feat/<name>` | New feature |
| `fix/<name>` | Bug fix |
| `docs/<name>` | Documentation only |
| `refactor/<name>` | Code refactoring |

**Example:**
```bash
git checkout -b feat/ai-visual-regression develop
```

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`

**Scopes:** `frontend`, `gateway`, `ai-core`, `docker`, `prisma`, `docs`

**Examples:**
```
feat(ai-core): add visual regression testing agent
fix(gateway): handle null response in test results endpoint
docs(readme): add architecture diagram
```

## Pull Request Process

1. **Update documentation** if your change affects setup, APIs, or usage
2. **Test your changes** locally — ensure the app builds and runs correctly
3. **Fill out the PR template** completely
4. **Link the related issue** (e.g., `Closes #42`)
5. **Request review** from at least one maintainer
6. **Squash & merge** after approval

### PR Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have tested my changes locally
- [ ] I have updated relevant documentation
- [ ] My changes don't introduce new warnings or errors
- [ ] I have added tests where applicable

## Style Guides

### JavaScript / React
- Use ESLint defaults + Prettier formatting
- Functional components with hooks
- Named exports for components
- Descriptive variable and function names

### Python
- Follow PEP 8
- Use type hints for function signatures
- Docstrings for public functions and classes

### CSS
- Use CSS custom properties (design tokens)
- BEM-like naming for custom classes
- Mobile-first responsive design

---

**Questions?** Open a [Discussion](https://github.com/rohith2157/BUGZERO/discussions) or reach out to the maintainers.

Thank you for helping build the future of autonomous QA! 🚀
