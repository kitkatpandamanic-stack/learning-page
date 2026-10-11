# Security

PandaDev is a free learning site run by one person. Thank you for helping keep
its learners safe.

## Reporting a problem

Please **don't open a public issue** for a security problem. Report it
privately instead:
[Security → Report a vulnerability](https://github.com/kitkatpandamanic-stack/learning-page/security/advisories/new).

Helpful to include: what you found, the page or endpoint, steps to reproduce,
and what someone could do with it. You'll get an answer within a few days.

Please don't access other people's accounts or data, run automated scans that
slow the site down, or test against the Telegram channel or bot's subscribers.

## What's in scope

- The site, https://pandadev-chi.vercel.app, and its API routes
- The Telegram bot @panda_learning_bot
- This repository's code and workflows

Learners' code runs only in their own browser (Web Workers and sandboxed
frames), so code that misbehaves on your own machine is expected; code that
escapes into the site, another learner's account or the server isn't.

## How the site is protected

- Sign-in only through Google or GitHub; sessions are managed by Better Auth.
- Security headers and a Content Security Policy on every page; learners'
  previews run in sandboxed frames without access to the site.
- Rate limits on every action that writes, and on sign-in.
- Secrets live in Vercel and GitHub, never in the repository; GitHub secret
  scanning with push protection, Dependabot and CodeQL watch the code.
- Nightly encrypted database backups, checked by restoring them.
