@AGENTS.md

# Learning context and agents

- `docs/learning-context/` is the shared memory about PandaDev's site and curriculum. Read `lessons-learned.md` there before working on content.
- Agents: `learning-architect` (finds gaps, plans, keeps the context current) and `content-writer` (writes new lessons in EN + RU, researched and tested).
- **Improve every time:** when the site owner corrects you, or a run goes wrong, add a rule to `docs/learning-context/lessons-learned.md`. If an agent keeps making the same mistake, fix its instructions in `.claude/agents/`.
