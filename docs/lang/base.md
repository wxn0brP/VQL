# Valthera Query Language Documentation

## Table of Contents
1. [VQLS (Simple)](./VQLS.md)
2. [VQLM/VQLB (YAML/JSON)](./VQLM.md)
3. [VQLR (Runtime)](./VQLR.md)

---

## Map of VQL query types
1. **VQLS**: Simple queries, best to generate from inputs/dropdowns, good for CLI
2. **VQLM**: Configuration files and complex queries
3. **VQLB**: VQLM but with JSON5
4. **VQLR**: Full control, directly interact with execution engine

Convert between VQLS/M/B to VQLR
```md
VQLS  \
VQLM   -> VQLR
VQLB  /
```

Each format can be converted to another using the [Playground](https://wxn0brp.github.io/VQL/playground)