# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active  |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to **rohith@autonomousqa.io** with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact assessment
4. Suggested fix (if any)

You should receive a response within **48 hours**. We will work with you to understand and address the issue before any public disclosure.

## Security Best Practices

When contributing to AutonomousQA, please ensure:

- **Never commit secrets** — API keys, passwords, and tokens must stay in `.env` files (which are gitignored)
- **Validate all inputs** — Both frontend and API Gateway must sanitize user inputs
- **Use parameterized queries** — Prisma ORM handles this by default; maintain this for any raw queries
- **Keep dependencies updated** — Run `npm audit` regularly

Thank you for helping keep AutonomousQA secure. 🔒
