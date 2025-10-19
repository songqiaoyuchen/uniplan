# 🔍 Useful Neo4j Browser Queries

This guide provides practical Cypher queries to help you explore and debug your graph in the Neo4j Browser. Assumes you're working with `:Module` and `:Logic` nodes (as in a prerequisite system).

---

## 📘 1. View a Specific Module and Its Prerequisites

```cypher
MATCH (m:Module {moduleCode: "CS2030S"})-[:HAS_PREREQ]->(logic)
OPTIONAL MATCH (logic)-[*]->(descendant)
RETURN m, logic, descendant
```

---

## 🌲 2. Visualize the Full Prerequisite Subgraph Recursively (APOC)

```cypher
MATCH (m:Module {moduleCode: "CS2030S"})
CALL apoc.path.subgraphAll(m, {
  relationshipFilter: "HAS_PREREQ>|REQUIRES>|OPTION>",
  labelFilter: "Module|Logic"
})
YIELD nodes, relationships
RETURN nodes, relationships
```

> Requires APOC plugin (enabled by default in Neo4j Desktop or AuraDB)

---

## 🔗 3. Find All Modules That Have Prerequisites

```cypher
MATCH (m:Module)-[:HAS_PREREQ]->(:Logic)
RETURN m.moduleCode
ORDER BY m.moduleCode
```

---

## 🧠 4. Count Logic Nodes by Type

```cypher
MATCH (l:Logic)
RETURN l.type AS type, count(*) AS count
ORDER BY count DESC
```

---

## 🛠️ 5. Show Deprecated Modules (Auto-Created Placeholders)

```cypher
MATCH (m:Module)
WHERE m.deprecated = true
RETURN m.moduleCode
```

---

## 🧩 6. Find Logic Nodes With No Children (Orphaned Gates)

```cypher
MATCH (l:Logic)
WHERE NOT (l)-[:OPTION|REQUIRES]->()
RETURN l
```

---

## 🧹 7. Delete All Logic Nodes (to Reset Logic Trees)

```cypher
MATCH (l:Logic)
DETACH DELETE l
```

---

## 🔄 8. Find Modules With Multiple Prerequisite Trees (Shouldn't Happen)

```cypher
MATCH (m:Module)-[:HAS_PREREQ]->(l:Logic)
WITH m, count(l) AS logicCount
WHERE logicCount > 1
RETURN m.moduleCode, logicCount
```

---

## 🧾 9. Show Modules That Have No Prerequisites

```cypher
MATCH (m:Module)
WHERE NOT (m)-[:HAS_PREREQ]->()
RETURN m.moduleCode
ORDER BY m.moduleCode
```

---

## 🎯 10. Search Modules by moduleCode Prefix

```cypher
MATCH (m:Module)
WHERE m.moduleCode STARTS WITH "CS"
RETURN m.moduleCode
```

---

## 🔍 11. Full Path Between Module and All Dependent Modules

```cypher
MATCH path = (m:Module {moduleCode: "CS2030S"})-[:HAS_PREREQ|REQUIRES|OPTION*]->(desc)
RETURN path
```

---

## 🛑 12. Identify Dead-End Modules (Used But Not Staged)

```cypher
MATCH (l:Logic)-[:OPTION|REQUIRES]->(m:Module)
WHERE NOT (m)-[:HAS_PREREQ]->()
  AND m.deprecated IS NULL
RETURN DISTINCT m.moduleCode
```

---

## 📎 13. Check if a Module Is a Prerequisite for Any Other Module

```cypher
MATCH (m:Module {moduleCode: "CS1101S"})<-[:OPTION|REQUIRES]-()
RETURN count(*) > 0 AS isPrerequisite
```

---

## 📐 14. Get Depth of a Prerequisite Tree

```cypher
MATCH (m:Module {moduleCode: "CS2100"})-[:HAS_PREREQ]->(l:Logic)
CALL apoc.path.spanningTree(l, {
  relationshipFilter: "OPTION>|REQUIRES>",
  labelFilter: "Logic|Module"
})
YIELD path
RETURN max(length(path)) AS maxDepth
```

---

## ✅ Good Practice

- Always **limit your results** (`LIMIT 100`) when exploring large graphs
- Use `DETACH DELETE` to delete a node and all connected relationships
- Use `apoc.path.subgraphAll` for recursive visual queries

---

_Written by Kevin Zhang · May 7, 2025_
