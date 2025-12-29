# SmartDiary Tools

Development tools and automation scripts.

## Auto-Commit Tool

The `auto_commit.py` script automates:
- CHANGELOG.md updates
- README.md updates (when relevant)
- Conventional commits
- Git push

### Usage

```bash
# After making changes
python tools/auto_commit.py --type feat --message "Add new feature"

# Types: feat, fix, docs, style, refactor, test, chore
```

### Requirements

```bash
pip install -r tools/requirements.txt
```
