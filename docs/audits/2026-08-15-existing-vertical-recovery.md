# Existing-Vertical Recovery Audit Index

This is a compact coverage and checkpoint index for the authority-governance
recovery. It records no current Agent fact, setup, source conclusion, candidate
answer, or Version boundary. Permanent product and game meaning remains in the
five direct `docs/*.md` owners; detailed traces remain in the reviewed PRs.

## Frozen scope

- Unverified baseline: `3b2456a19ce1f5c1a838e0a12405783a3f67eda9`
- Baseline roster source:
  `src/workbench/content/agents.ts` at that exact commit
- Identity count: 38
- Scope meaning: implementation evidence to audit, not an admitted-content or
  Version catalogue

The cohort union below names every baseline identity exactly once. A later
runtime addition cannot enter this recovery scope, and an identity is not
accepted merely because it appears here.

## Cohort status vocabulary

- `pending`: no accepted cohort merge has been indexed;
- `accepted`: the cohort audit merged against the recorded current mechanism
  checkpoint and a later index-only PR recorded its immutable references; or
- `invalidated`: an applicable owner, consumer, or common-mechanism change made
  the prior audit stale and renewed review is required.

Rows move to `accepted` only in an index-only PR after the cohort change has
already merged. An accepted row records the mechanism manifest digest, the
accepted cohort merge, and the index PR. It never records the cohort's product
conclusions.

## Mechanism-generation lifecycle

- `pending`: the single `—` placeholder row means no complete U5-U9 generation
  has been allocated yet;
- `accepted`: after all five ordered mechanism changes have merged, an
  index-only PR replaces the placeholder with the next positive integer,
  records every required reference and digest, and marks it accepted; or
- `invalidated`: an applicable owner, consumer, or common-mechanism change made
  a previously accepted generation stale.

Generation numbers increase monotonically and are never reused. Invalidating a
generation preserves its number and references and appends one new `—` pending
placeholder. Dependent accepted cohort rows become `invalidated` in that same
index-only transaction. A replacement number is allocated only after its full
ordered U5-U9 sequence has merged.

## Reference formats

- A completed merged change is `#<positive PR> @ <40 lowercase hexadecimal
  merge SHA>`.
- The current index-only change is `#<positive PR>`. Its merge SHA cannot be
  embedded because it does not exist until after the file has merged.
- A mechanism manifest digest is `sha256:<64 lowercase hexadecimal digits>`.
- An unfilled field is `—`. An `accepted` row has no `—` in any required field.

Construct a mechanism manifest from the five accepted full merge SHAs in U5
through U9 order. Lowercase every SHA, then hash the UTF-8 bytes of this exact
ASCII payload, including the final line feed (`LF`):

```text
formula-source=<U5 SHA>
w-engine=<U6 SHA>
drive-disc=<U7 SHA>
finite-preparation=<U8 SHA>
portrait-visual=<U9 SHA>
```

Each displayed line is terminated by one `LF` byte (`0x0A`), including the
last line.
Prefix the lowercase SHA-256 result with `sha256:`. No PR numbers, spaces,
carriage returns, or other fields enter the digest.

## Common-mechanism checkpoint

| Generation | Status | Formula/source merge | W-Engine merge | Drive Disc merge | Finite/preparation merge | Portrait/visual merge | Manifest digest | Index PR |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | accepted | #28 @ 417223fa4fefab0ec5cfd7d6aacca0a58091651b | #31 @ e5cc4807370b91eeeb58bdd8268d9b0e0e232ccf | #36 @ 5426264eec2ba5eac4f03f290c66e716084ee38c | #40 @ e51f73ea1247a2c6359fd9762ae1f0898607731a | #41 @ aafd0ec86d134d7ae1df2458d6e3616090a8c374 | sha256:85d48a26bae6b8a6836776f566ea8e0dc2143e979a204138c4e16cd21c905d65 | #42 |

No cohort can become accepted until one complete ordered mechanism generation
has been recorded by a later index-only PR. Reopening an applicable earlier
mechanism invalidates its dependent generation and cohort rows until the
ordered checks and reviews are renewed.

## Baseline cohort coverage

| Cohort | Baseline identities | Count | Status | Mechanism manifest digest | Accepted cohort merge | Index PR |
| --- | --- | ---: | --- | --- | --- | --- |
| Rupture | Yixuan; Yidhari; Manato; Banyue; Starlight Billy | 5 | accepted | sha256:85d48a26bae6b8a6836776f566ea8e0dc2143e979a204138c4e16cd21c905d65 | #43 @ b4293fccd4d8f90991d1df73961cad0257b93bfd | #44 |
| Anomaly | Grace Howard | 1 | pending | — | — | — |
| Attack A | Anby: Soldier 0; Seed; Cissia; Evelyn; Corin; Hugo; Ellen | 7 | accepted | sha256:85d48a26bae6b8a6836776f566ea8e0dc2143e979a204138c4e16cd21c905d65 | #45 @ 7692362b958bc14591c5d720b8d9bb74057af3b2 | #46 |
| Attack B | Soldier 11; Zhu Yuan; Orphie & Magus; Asaba Harumasa; Nekomata; Billy Kid; Ye Shunguang | 7 | pending | — | — | — |
| Stun A | Dialyn; Trigger; Ju Fufu; Lighter; Pulchra; Qingyi | 6 | pending | — | — | — |
| Stun B | Lycaon; Koleda Belobog; Anby Demara | 3 | pending | — | — | — |
| Support | Lucia; Astra Yao; Soukaku; Lucy; Nicole | 5 | pending | — | — | — |
| Defense | Pan Yinhu; Ben Bigger; Caesar King; Zhao | 4 | pending | — | — | — |

Total: 38 identities.

## Promotion boundary

This index is incomplete while any mechanism generation or cohort row is
`pending` or `invalidated`, any accepted authority change lacks its separate
owner amendment and dependent correction ordering, any known semantic or
portrait failure remains open, or any required remote check is unsuccessful.
Completeness is necessary for promotion but does not itself prove semantic
correctness or create trusted `main`.
