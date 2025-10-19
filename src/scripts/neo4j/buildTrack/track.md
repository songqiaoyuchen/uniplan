# TRACK Design Proposal

Authored by: Zhang Li Kevin

## Problem Statement

The current timetable scheduling system has a critical **user experience gap**: it requires users to specify exact module targets (e.g., `["CS1010", "CS1231", "CS2030"]`) as input, but real users think in terms of their academic profile and degree requirements.

**Key Issues:**

1. **Input Mismatch:** Students know "I'm an AY2022 CS student with a Double Major in Mathematics" but don't know the hundreds of specific modules they need to take to fulfill graduation requirements.

2. **System Inaccessibility:** The sophisticated timetable algorithm works well for scheduling, but is effectively unusable by real students who can't provide the required module-level inputs.

3. **Manual Research Burden:** Users must manually research complex degree requirements, focus areas, prerequisites, and exemptions before they can even use the system.

4. **Scalability Problem:** With hundreds of unique requirement combinations across different cohorts, degrees, and special programs, manually encoding each variation is unmaintainable.

**The Core Challenge:** How can we bridge the gap between user-friendly academic profile inputs and the module-specific targets that our timetable algorithm requires?

## System Architecture Overview

Before diving into the solution, let's clarify the key components:

- **DATABASE** (immutable) - Contains ALL modules, logic nodes, and prerequisite relationships. This is our source of truth that never changes.
- **MERGEDTREE** (dynamic subset) - A subset extracted from the database containing only the relevant modules and their prerequisite chains, based on target modules.
- **TRACK overlays** - Additional requirement logic trees that get attached ON TOP of the MERGEDTREE to represent degree completion requirements.
- **TIMETABLE algorithm** - Takes the combined graph (MERGEDTREE + TRACK overlays) and schedules modules optimally across semesters.

The key insight: we keep the database clean and immutable, but compose dynamic requirement structures at query time.

## Current Neo4j Database Structure

Let's go through our current Neo4j database again.

I currently have **2 types of nodes**: LOGIC and MODULE.

### MODULE Nodes
**MODULE** is simple - it represents the actual module course that students will take. It has all the information about the module that will be useful to pass to frontend or even semester offered information/preclusion information for my TIMETABLE algorithm to take into account.

### LOGIC Nodes
**LOGIC** is a bit trickier. It has 3 types (although I really should refactor them into 1 type: NOF). But that aside, I have AND, OR, and NOF:

- **AND** - An AND LOGIC node represents a node that requires all its children to be taken to be satisfied
- **OR** - OR represents a node that only requires any 1 children to be taken to be satisfied  
- **NOF** - Finally, NOF requires N number of children to be taken to be satisfied

### RELATIONSHIPS
We have **3 types of relationships**:

- **HAS_PREREQ** - This is simple. A MODULE node will always have outgoing HAS_PREREQ edges towards either a LOGIC node or a MODULE node (directly). The children represent the prerequisite of the parent.
- **OPTION** - This is also simple. It is an edge FROM a LOGIC node TO a MODULE node.
- **REQUIRES** - This is an edge FROM a LOGIC node TO a LOGIC node, as there can be complicated nested logics. For example, a MODULE may have 2 logic requirements, and each of those requirements may have their own logic requirements that then finally point to the actual MODULES.

## Initial Proposed Solution

Add supernodes of type 'TRACK' to the Neo4j database.

**Characteristics:** These TRACK nodes will always be parents of MODULE nodes, but they aren't LOGIC nodes either, since they are a target for completion.

**Question:** Given a TRACK node GE, how do I represent this data?

## Example: General Education Requirements

Here's some raw data pulled from the internet:
[NUS Degree Requirements](https://www.nus.edu.sg/registrar/academic-information-policies/undergraduate-students/degree-requirements)

With effect from AY2021-22, the enhanced General Education curriculum consists of 6 pillars:

- **Data Literacy (GEA)**
- **Digital Literacy (GEI)**
- **Critique and Expression (GEX)**
- **Cultures and Connections (GEC)**
- **Singapore Studies (GESS)**
- **Communities and Engagement (GEN)**

### Analysis

I can see that there are actually **2 types of TRACK**:
1. **GE curriculum** - the target (like targetModules)
2. **Individual pillars** - like LOGIC nodes

Let's see another example to have a better grasp of how to model these TRACK nodes.

## Example: Computer Science Breadth & Depth

### Core Requirements

Complete 32 units of computing courses satisfying the following constraints:

1. Satisfy at least one CS Focus Area by completing 3 courses in the Area Primaries with at least one course at Level-4000 or above
2. Complete at least 12 units at level-4000 or above
3. Complete at least 6 units and at most 12 units of Industry Experience courses
4. Students with Grade Point Average (GPA) of 4.00 or higher may opt to replace the Industry Experience courses with the programme's dissertation course (i.e. CP4101)
5. Students who aim for Honours (Highest Distinction) must pass the programme's dissertation course (i.e. CP4101)
6. All courses except Industry Experience must be CS/IFS/CP-coded
7. At most 12 units of CP-coded courses (aside from Industry Experience)

## The Complexity Problem

What becomes clear is that these requirements quickly become large and complex. The key problem is that there are many requirements, so **reusability becomes critical**.

I took a quick glance at [NUS Computing cohorts](https://www.comp.nus.edu.sg/cug/per-cohort/) and there are 14 types of cohorts, and each year may have its own special requirements. That isn't very manageable and is impractical to cater to them all.

I estimate **hundreds to low thousands** of unique requirements, and I don't like the idea of giving a general solution and expecting users to figure out the niches by themselves. Then I am not adding value with our systems that can pre-process data.

## The Solution

I need to find the **smallest building block** to be flexible. And I need a good infrastructure that can take in customizations to a set of requirements.

This suggests that the current architecture proposal for creating TRACK supernodes would be unsuitable. **The database cannot be mutated** as it should be a reliable source of truth, a basis for all of these modifications.

In addition, we should be able to map academic profiles to their appropriate requirements. For example, a CS student will fetch the most basic requirements from DEGREE, then MAJOR, COHORT, EXEMPTIONS, or SPECIAL Programmes.

### The Complete Flow

1. **User inputs academic profile** → checkbox selections (cohort, degree, special programs, exemptions)
2. **TRACK parser maps profile** → specific module targets + requirement logic trees  
3. **Database query with targets** → extracts MERGEDTREE (prerequisite subgraph)
4. **Attach TRACK overlays** → requirement logic added on top of MERGEDTREE
5. **Combined graph** → passed to TIMETABLE algorithm for scheduling

### Key Question

The question is: **Is it possible to design a query such that Neo4j can accept and return appropriate data?** And that appropriate data should still be a MERGEDTREE to be used in my algorithm.

That's the traditional SQL database mindset. What I need, I query. Customizable. The database stays immutable, but I can compose dynamic requirement structures on top of the extracted MERGEDTREE. And that's really the use case here.

## Proposed Approach

Let's think about what that query would look like. Actually scratch that, I instead propose that I fetch the MERGEDTREE first, and then I build my modifications on top of it.

Let's go through what it will look like, taking a complex CS Breadth and Depth requirement as an example:

### 1. Base Requirement
> "Complete 32 units of computing courses satisfying the following constraints:"

This is easy. This will be the **TRACK TARGET node** (where it all begins).

### 2. Complex Logic Requirements
> "Satisfy at least one CS Focus Area by completing 3 courses in the Area Primaries with at least one course at Level-4000 or above. Complete at least 12 units at level-4000 or above. Complete at least 6 units and at most 12 units of Industry Experience courses."

**What does this mean?**

There are currently 10 CS focus areas ([CS Focus Areas](https://www.comp.nus.edu.sg/programmes/ug/focus/)).

So this TRACK TARGET will connect to:
- **TRACK LOGIC (OR)** → 10 focus areas (TRACK LOGIC NOF: 3)

Based on the suggested requirements, each focus area TRACK LOGIC will require:
1. **1 LOGIC NODE (OR)** that connects to all of the 4000-level CS Modules in the area
2. **1 LOGIC NODE (NOF: 3)** that connects to any 4000-level CS Modules
3. **1 LOGIC NODE (NOF: 3)** that connects to all of the CS Modules in the area

This represents the 3 requirements:
- One 4000-level course in the area
- 3 modules in the area
- 3 4000-level courses in general

I do not worry about the overlapping requirements since one MODULE, if taken, will satisfy both parent LOGIC nodes' relationships.

## The Challenge

Already, I see that these are very complex to program and add to the MERGEDTREE one by one, not to mention that this is a single requirement among 5 that only applies to one single cohort.

What I really need is a **PARSER**.

While this may sound extremely daunting and challenging (I still remember my CS1101S Metacircular Evaluator), I believe their long-term rewards (and even short-term rewards if I want to successfully integrate the entire NUS curriculum into our system) outweigh the immediate, straightforward solution of adding to the MERGEDTREE, which is not only unmaintainable but also offers incorrect solutions. **It's fundamentally flawed.**

## Key Realization: TRACK Parser = Enhanced Tree Builder

Actually, after thinking about it, the PARSER I'm thinking about is really just a superior version of our current TREE BUILDER.

### Structural Similarity

**Prerequisite trees** and **TRACK requirement trees** are structurally identical:
- Both use AND/OR/NOF logic nodes
- Both connect to MODULE nodes
- Both create nested logic relationships
- Both use the same OPTION/REQUIRES edges

### Current Prerequisite JSON Format
```json
"CS3264": {
  "and": [
    "CS2109S:D",
    {"or": ["CS2040:D", "CS2040S:D", "CS2040C:D"]},
    {"or": ["MA1101R:D", "MA1311:D", "MA1513:D"]}
  ]
}
```

### TRACK Requirements Would Look Similar
```json
"CS_BREADTH_DEPTH": {
  "and": [
    {"nOf": [1, ["CS_FOCUS_AREA_AI", "CS_FOCUS_AREA_HCI"]]},
    {"nOf": [12, "CS4000_MODULES"]},
    {"nOf": [6, "INDUSTRY_EXP_MODULES"]}
  ]
}
```

### The Only Difference is Semantic

- **Prerequisites:** "You need X **before** you can take this module"
- **TRACK requirements:** "You need X **to complete** this degree track"

### What Can Be Reused

- **Tree building logic** - same recursive structure
- **JSON parsing** - same format, different content  
- **Neo4j relationship creation** - same OPTION/REQUIRES edges
- **Node ID resolution** - same module lookup logic

I just need to:
1. **Create TRACK target nodes** instead of attaching to existing modules
2. **Add some new relationship types** for TRACK semantics
3. **Extend the existing tree builder** to handle completion requirements

## Current Timetable Algorithm

The existing **TIMETABLE algorithm** is a sophisticated semester-by-semester scheduler that takes specific module targets as input and uses greedy selection with impact scoring to optimally schedule modules across semesters, considering prerequisites, semester offerings, credit limits, and module preclusions.

**The TRACK Solution:** Enable users to input their academic profile (cohort, degree, special programs, exemptions) through a checkbox-style frontend, then use a TRACK parser to resolve these into specific modules for the timetable algorithm.

## Re-scoped Challenge

**Can I take any statement from NUS (from the internet), decompose it into a set of readable instructions for an algorithm/parser to understand, then attach the desired TRACK tree output on top of the fetched MERGEDTREE, that will then be passed to my TIMETABLE algorithm to solve (with TRACK TARGETS and simple MODULE TARGETS)?**

To do this, I need to think about **language**. How should I define each part of the algorithm?

## Parser Implementation Strategy

After mulling about it, the challenge seems really difficult. Since input text is variable, and I don't believe that NUS will be consistent in their word choice, ultimately I still have to do some manual level of parsing, into a syntax suitable for actual parser.

This doesn't mean my current idea is bad, since it:
- **Saves massive amounts of work** from manually adding to the database
- **Protects our database** and keeps it immutable

### Ideal Workflow

Ideally, we should only do the large part of the parsing **once** (for about 100 requirements), while the manual part for different cohorts or double track combinations should be single-line inserts, like git diffs.

**But how can we achieve that?**

## Practical Implementation Approach

Let's start with a simple approach (DSL seems crazy overengineering after thinking about it):

### Phase 1: Manual JSON Templates

These are the ~100 manual templates that have to be converted from NUS requirements into a simple JSON format:

```json
{
  "CS_BREADTH_DEPTH": {
    "type": "AND",
    "requirements": [
      {"type": "NOF", "n": 1, "from": "CS_FOCUS_AREAS"},
      {"type": "NOF", "n": 12, "units": true, "level": "4000+"},
      {"type": "NOF_RANGE", "min": 6, "max": 12, "from": "INDUSTRY_EXP"}
    ]
  }
}
```

### Phase 2: Simple Template System

For the "git diff" approach, I can use variable substitution:

```json
{
  "cohort": "AY2022",
  "exemptions": ["CS1010"],
  "modifications": {
    "remove": ["CS1010"],
    "add": ["CS1010S"]
  }
}
```

### Phase 3: Basic Tree Building

Write functions that take JSON and build the logic nodes + relationships. The good news is these can largely reuse the existing tree builder infrastructure, just with different semantics and relationship directions.

### Incremental Development Plan

1. **Pick ONE requirement** (like GE pillars)
2. **Manually write it as JSON** using existing tree builder format
3. **Extend tree builder** to handle TRACK nodes and relationships
4. **Test with existing timetable algorithm**
5. **Add more requirements incrementally**

---

**P.S.** I wonder how NUSMODS parsed these information to their jsons HAHAHA Would be wonderful if I can do the same