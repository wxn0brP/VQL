#!/usr/bin/env bash
set -euo pipefail

api-extractor run --config config/api-extractor.json
sed -i -E 's/^([[:space:]]*)declare([[:space:]]|\(|;|$)/\1export declare\2/; /^export \{ \}[[:space:]]*$/d' dist/vql.d.ts
sed -i "1s|^|// vql v$(jq -r .version package.json)\r\n|" dist/vql.d.ts
