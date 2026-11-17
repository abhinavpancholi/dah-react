import json

with open(r'C:\Users\abhin\.gemini\antigravity-ide\brain\aad0b164-8d76-47be-a36b-3e1a92e34b21\.system_generated\logs\transcript_full.jsonl', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx > 70:
            break
        obj = json.loads(line)
        calls = obj.get('tool_calls', [])
        for c in calls:
            print(f"Step {idx} tool: {c.get('name')}")
            args = c.get('args', {})
            for k in ['AbsolutePath', 'TargetFile', 'CommandLine']:
                if k in args:
                    print(f"   {k}: {str(args[k])[:100]}")
        if obj.get('content') and ('Step 0' in obj['content'] or 'tokens' in obj['content']):
            print(f"Step {idx} content: {obj['content'][:200]}...\n")
