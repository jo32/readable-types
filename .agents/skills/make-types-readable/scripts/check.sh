#!/bin/sh
# Type-check files with the repo's compiler options (strict, exactOptionalPropertyTypes,
# noUncheckedIndexedAccess, NodeNext). Usage: check.sh FILE.ts [FILE.ts ...]
# With no arguments it checks this skill's own reference/rewrites.check.ts.
set -eu
skill=$(cd "$(dirname "$0")/.." && pwd)
root=$(cd "$skill/../../.." && pwd)
tsc="$root/node_modules/.bin/tsc"
[ -x "$tsc" ] || { echo "check.sh: run npm ci in $root first" >&2; exit 2; }
[ "$#" -gt 0 ] || set -- "$skill/reference/rewrites.check.ts"
list=""
for file in "$@"; do
  [ -f "$file" ] || { echo "check.sh: no such file: $file" >&2; exit 2; }
  abs=$(cd "$(dirname "$file")" && pwd)/$(basename "$file")
  list="$list${list:+,}\"$abs\""
done
# A throwaway config next to tsconfig.json, so "extends" and relative imports resolve.
config="$root/.make-types-readable.$$.tsconfig.json"
trap 'rm -f "$config"' EXIT INT TERM
printf '{"extends":"./tsconfig.json","include":[],"files":[%s]}\n' "$list" > "$config"
"$tsc" -p "$config" && echo "check.sh: OK ($# file(s))"
