# Village Alchemist AAPI

## Application + Agent Programming Interface

Village Alchemist is building a new type of digital infrastructure layer: an **Application + Agent Programming Interface (AAPI)**.

The goal is not just to expose data through APIs.

The goal is to create a governed execution layer where:

- applications can interact with business data;
- humans can delegate tasks safely;
- AI agents can operate on behalf of people;
- permissions, context, and authority remain explicit;
- users retain ownership and control over their data.

The API is only the first interface.

The deeper idea is creating a safe operating boundary between **people, applications, and autonomous agents**.

---

# The Problem

Small businesses and individuals are increasingly expected to operate like technology companies.

They need:

- websites;
- customer management;
- payments;
- analytics;
- automation;
- AI assistance;
- digital workflows.

But most people do not need another giant SaaS platform.

They need:

> A simple digital foundation that they own, understand, and can safely extend.

The current web forces people into fragmented systems:

- website builder here;
- payment processor there;
- CRM somewhere else;
- analytics platform collecting everything;
- AI tools requesting broad access.

The result is complexity and loss of control.

Village Alchemist is designed to provide the missing layer.

---

# The AAPI Concept

A traditional API asks:

> "Does this credential have permission to call this endpoint?"

An AAPI asks:

> "Who is acting, on whose behalf, for what purpose, with what authority, against what data, and what should they be allowed to do?"

The fundamental unit is not an endpoint.

It is a **governed action**.

Example:

```
Agent requests:

Action:
    Analyze customer inquiries

Actor:
    Taylor's personal assistant agent

Purpose:
    Help Taylor make better decisions

Allowed:
    Read approved sports data
    Read Taylor's own history
    Generate analysis

Forbidden:
    Access unrelated personal data
    Change financial limits
    Execute external actions without approval

Result:
    Analysis generated
    Decision recorded
    Audit trail preserved
```

---

# Core Architecture

```
                     Village Alchemist AAPI

        Applications
        Humans
        Services
        Agents
             |
             |
             v

    -----------------------------
        AAPI Governance Layer
    -----------------------------

        Identity
        Delegation
        Capabilities
        Policies
        Approvals
        Audit Records

             |
             |

    -----------------------------
        Domain Capabilities
    -----------------------------

        Leads
        Commerce
        Memberships
        Analytics
        Personal Assistants

             |
             |

    -----------------------------
        Data + External Systems
    -----------------------------

        Websites
        Payments
        APIs
        Databases
        Models
```

---

# Current Reference Applications

Village Alchemist begins with real-world use cases.

## Anastasia

### Small Business + Commerce

Example:

- Gallery
- Non-alcoholic cocktail lounge
- Coworking memberships
- Events
- Customer relationships

The AAPI provides:

- customer inquiry handling;
- membership management;
- payment workflows;
- owner-controlled automation.

Future agents could:

- monitor membership health;
- identify customers needing attention;
- draft communications;
- prepare business insights.

The owner remains in control.

---

## Tony

### Creative Services

Example:

- Styling;
- Fashion;
- Photography;
- Creative projects.

The AAPI provides:

- lead capture;
- client workflows;
- project information;
- service inquiries.

Future agents could:

- summarize inquiries;
- organize projects;
- prepare client communication;
- identify opportunities.

---

# Taylor Agent Arm

## Personal Agent Example

Taylor represents a different category:

Not a business.

A person.

The Taylor AAPI arm demonstrates the concept of a personal delegated agent.

The goal is not:

> "Build a bot that bets for Taylor."

The goal is:

> "Build an intelligent assistant that Taylor can safely delegate specific capabilities to."

---

# Taylor Sports Intelligence Agent

## Example Purpose

A personal agent designed to help Taylor understand sports markets, trends, and decisions.

The agent could combine:

- sports data;
- historical performance;
- Taylor's preferences;
- Taylor's personal strategy;
- market information.

But it operates inside strict boundaries.

---

# Example Permission Model

## Taylor grants:

```
Capability:

sports.analysis.read

Purpose:

Help me understand sports markets

Allowed:

✓ Analyze public sports data
✓ Track selected teams
✓ Review historical performance
✓ Explain reasoning
✓ Generate reports

Forbidden:

✗ Access unrelated personal data
✗ Move money
✗ Change account settings
✗ Place wagers automatically
✗ Override risk limits
```

---

# The Important Difference

A normal AI assistant says:

> "Here is a recommendation."

An AAPI-powered agent says:

> "Here is the recommendation, here is the data I used, here is why I was allowed to access it, here are the constraints I operated under, and here is what I am not permitted to do."

---

# Human Authority Model

The agent can assist.

The human remains sovereign.

Example:

```
Taylor:

"Analyze tonight's games."

        |
        v

Agent:

"I analyzed approved data sources.
Here are three opportunities.
Confidence:
72%

I cannot place a wager.
I cannot change your limits.
I can prepare a recommendation."

        |
        v

Taylor decides.
```

---

# Future Agent Actions

## Low Risk

Allowed automatically:

- summarize information;
- analyze trends;
- generate reports;
- organize data;
- monitor conditions.

## Medium Risk

Requires policies:

- prepare recommendations;
- draft communications;
- create proposed actions.

## High Risk

Requires explicit approval:

- spending money;
- placing transactions;
- changing financial settings;
- modifying important records.

---

# Why This Matters

The future is not about whether AI agents can perform tasks.

They obviously can.

The real problem is:

> How do we let agents become powerful without giving away ownership, privacy, and control?

Village Alchemist approaches this by making authority itself programmable.

---

# The AAPI Principles

## 1. Data Ownership

People and businesses own their data.

The platform provides infrastructure.

---

## 2. Explicit Delegation

Agents do not inherit unlimited authority.

Every capability is granted.

---

## 3. Purpose-Bound Access

An agent should know:

- who it serves;
- why it is acting;
- what it may access;
- what it may not do.

---

## 4. Auditable Actions

Every important action creates a record:

```
Who acted?

What did they request?

Why were they allowed?

What data was used?

What happened?

What was the result?
```

---

## 5. Human Sovereignty

Automation should amplify humans.

It should not replace ownership.

---

# The Long-Term Vision

Village Alchemist is building toward a world where:

- a small business can have enterprise-grade digital infrastructure;
- a person can have a trusted personal AI assistant;
- agents can operate safely;
- applications and agents share the same governed interface;
- people remain in control of their data and decisions.

The future is not humans versus AI.

The future is humans with powerful agents that they actually own.

---

# Current Development Path

## Phase 1

Public AAPI foundation:

- identity;
- permissions;
- workspaces;
- properties;
- leads;
- commerce.

## Phase 2

Agent capabilities:

- MCP integration;
- delegated actions;
- policy enforcement;
- audit trails.

## Phase 3

Personal and business agent ecosystems:

- personal assistants;
- business operators;
- specialized domain agents;
- local/private deployments.

---

# The Thesis

The internet gave everyone a publishing layer.

Cloud computing gave everyone infrastructure.

Village Alchemist is exploring the next layer:

> A trusted interface between people, applications, and agents where capability is powerful, but authority remains controlled.
