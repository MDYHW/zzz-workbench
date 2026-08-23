## Authority trace

- Change classification: protected
- Protected reason: Replace with the exact `GOV-001` reason, or `Not applicable: <reason>` for a structurally Agent-local change.
- Owning Rule IDs: `SW-###`; `SF-###`
- Exact consumers: `path/to/file.ts#symbol`; `path/to/other.ts#symbol`
- Nearest similar current case: Name the closest established consumer and the relevant shared meaning.
- Contrasting current case: Name the current case that prevents an over-broad conclusion.
- Candidate or prepared consequence: State the bounded candidate, representative, or no-change consequence.
- Lifecycle: State present, absent, and reselected behavior, or `Not applicable: <reason>`.
- Visible Setup or Result consequence: State the exact user-visible outcome.
- Behavior verification: Name mechanism tests, build, and browser or visual evidence when relevant.
- Prerequisites: Cite accepted ACR and owner amendment references, or `Not applicable: <reason>`.

## Testing delta

- New mechanism or materially distinct visible failure: Name it, or `None`.
- Nearest existing coverage: `path/to/test#case`.
- Exact uncovered failure: State what the existing coverage cannot prove, or `None`.
- Name/value independence: Explain why the assertion remains meaningful with an equivalent fixture, or why a local regression is materially distinct.
- Test change: Name the added or changed mechanism test, or `None — shared coverage already proves this behavior`.

Independent review publishes exactly one top-level App-authored evidence comment
for the current base, head, canonical tree digest, complete Authority-trace
digest, Rule IDs, and consumers. Do not paste that payload into this proposed
diff.
