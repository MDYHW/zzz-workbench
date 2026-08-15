# ZZZ Formula Mechanics

Status: game-mechanics authority for the setup workbench foundation.

## Purpose And Boundary

This document defines only the calculation distinctions needed to determine
valid stats, invalid stats, additive and multiplicative modifier regions,
formula-family exclusions, thresholds, caps, and party-dependent setting
pressure.

| Owns | Does not own |
| --- | --- |
| formula family, formula frame, formula component, stat-to-frame relationship, modifier-region relationship | game-term meaning, setup role, candidate ranking, source-fact treatment, active values, runtime calculation |

Game terms belong to `docs/zzz-game-vocabulary.md`. Setup and display behavior
belong to `docs/setup-workbench-product-contract.md`. The single Result retention gate
belongs to `docs/source-fact-boundary.md`.

## Stable Rule Identifiers

High-risk cross-cutting rules in this owner use the `FM-###` namespace. The
prefix is reserved to this file, and the number is an immutable reference label
rather than another rule or an expansion of the labeled section. Do not assign
these identifiers to Agent-local facts, examples, or ordinary explanatory
paragraphs.

Within the `FM-###` namespace, allocate numbers monotonically and never reuse
one. A heading move or wording clarification that preserves the same meaning
keeps its identifier. If an `FM-###` rule's meaning boundary splits, merges,
moves to another owner, or retires, reserve the old identifier under a local
`Retired Rule IDs` heading as `FM-### -> <successor IDs or none>: <reason>` and
allocate new owner-prefixed identifiers to every resulting current rule.

## Terms

| Term | Meaning |
| --- | --- |
| formula family | calculation family with one setting-relevant compositional frame |
| formula frame | ordered multiplication and addition regions used by a formula family |
| formula component | named calculation region inside a frame |
| stat input | game stat read by a component; not itself a formula component |
| modifier region | additive collection of applicable bonuses or reductions that becomes one multiplicative component in a frame |

A formula family is not a specialty. An Agent's source can associate a
specialty, stat, and formula family, but that association does not make them
equivalent or place them on one hierarchy.

## Stat Composition Surfaces

**Rule ID:** `FM-001`

The setting workbench must keep three stat surfaces because sources can read or
modify them differently.

| Surface | Calculation meaning | Setting consequence |
| --- | --- | --- |
| base stat | Agent base value plus source-applicable base contributions; for ATK, this includes W-Engine Base ATK | percentage and flat initial contributions need the correct base |
| initial stat | base stat after applicable pre-combat W-Engine advanced stats, Drive Disc stats, and 2-piece stat effects | a source that reads initial ATK must use this surface, not a combat buffed value |
| combat stat | initial stat after applicable in-combat stat modifiers such as W-Engine passives, Drive Disc 4-piece effects, and Agent buffs | party and equipment combat buffs change the combat baseline or fully enabled window without rewriting the initial surface |

Percentage-scaled stats such as ATK, Max HP, DEF, Impact, Anomaly Mastery, and
Energy Regen compose initial and combat percentages in different regions:

```text
Initial Stat = Base Stat * (1 + sum of initial Stat percentages) + flat initial Stat
Combat Stat = Initial Stat * (1 + sum of applicable combat Stat percentages) + flat combat Stat
```

Combat percentages of the same stat add together before multiplying the Initial
Stat. A combat-baseline value uses the combat percentages available on that
surface. The fully enabled value uses every mutually compatible combat
percentage available through that surface; it does not multiply each newly
enabled percentage into the preceding combat value. Percentage-point stats and
modifier regions keep their separately owned additive or multiplicative
relationships.

Base Energy Regen includes an Agent's applied Core-upgrade contribution when
the source names it as part of the base. The workbench composes the Energy
Regen stat from that base and applicable percentages before adding any
source-stated directly composable automatic per-second Energy recovery.

When Result projects Energy Regen, each surface shows the current automatic
Energy recovered per second:

```text
Current Energy recovery per second (surface)
  = composed Energy Regen stat (surface)
  + sum of applicable directly composable automatic Energy-per-second sources (surface)
```

A directly composable automatic Energy-per-second source is added after
percentage composition and is never multiplied by an Energy Regen percentage.
Its `/s` amount remains a distinct atomic contribution in the expanded Result
even though the surface aggregate includes it. Once any directly observed
eligibility state such as off-field holds, no repeated action, trigger
frequency, resource-spending cadence, field-time share, or uptime assumption
determines its stated rate.

An event-conditioned Energy or Adrenaline grant is outside this composition.
Neither a source cooldown nor a theoretically repeatable trigger converts its
per-event amount into automatic recovery or a `/s` value. One-time grants and
cooldown-limited action grants therefore enter neither the Energy Regen
aggregate nor a standalone Result operation. A percentage shown on a setup
input or source contribution is likewise not the unit of the composed current
stat or the later automatic per-second source.

This section identifies composition order and source basis. It does not define
storage fields or calculate a final character sheet.

## Formula Families And Frames

**Rule ID:** `FM-002`

The current foundation needs five formula families:

- `general_damage`;
- `sheer_damage`;
- `anomaly_damage`;
- `daze_buildup`; and
- `anomaly_buildup`.

The frames below show setting-relevant regions. They do not select a skill,
enemy, stack count, duration, refresh behavior, or trigger frequency.

```text
general_damage
  = base_damage
  * dmg_bonus_multiplier
  * crit_multiplier
  * def_multiplier
  * res_multiplier
  * stun_dmg_multiplier
  * dmg_taken_multiplier

sheer_damage
  = sheer_base_damage
  * dmg_bonus_multiplier
  * crit_multiplier
  * res_multiplier
  * stun_dmg_multiplier
  * dmg_taken_multiplier
  * sheer_dmg_bonus_multiplier

anomaly_damage
  = anomaly_base_damage
  * anomaly_proficiency_multiplier
  * dmg_bonus_multiplier
  * anomaly_buff_multiplier
  * def_multiplier
  * res_multiplier
  * stun_dmg_multiplier
  * dmg_taken_multiplier

daze_buildup
  = skill_daze
  * impact_multiplier
  * daze_bonus_multiplier
  * daze_res_multiplier
  * daze_taken_multiplier

anomaly_buildup
  = skill_buildup
  * anomaly_mastery_multiplier
  * buildup_bonus_multiplier
  * buildup_res_multiplier
```

Attribute Anomaly and Disorder use the `anomaly_damage` family for the
setting distinctions defined here. Their `anomaly_base_damage` calculation and
applicable anomaly bonus can differ by game result and attribute. Sharing the
frame does not make those results interchangeable.

Anomaly damage does not use `crit_multiplier` unless a source explicitly makes
the applicable result crit-capable. That exception remains source-scoped; it
does not make CRIT Rate generally valid for every Anomaly setup.

## Base Components

**Rule ID:** `FM-003`

The three damage families use deliberately different base components because
they read different scaling relationships.

| Component | Owning frame | Setting-level relationship |
| --- | --- | --- |
| `base_damage` | `general_damage` | applicable skill multiplier times ATK |
| `sheer_base_damage` | `sheer_damage` | applicable skill multiplier times Sheer Force |
| `anomaly_base_damage` | `anomaly_damage` | applicable anomaly coefficient times ATK; Disorder can use the source result's stated remaining-duration or result-specific basis to determine that coefficient |

At the setting-mechanics abstraction, the core scaling relations are explicit:

```text
base_damage = skill_multiplier * ATK
sheer_base_damage = skill_multiplier * Sheer Force
anomaly_base_damage = anomaly_coefficient * ATK
```

These relations establish stat and modifier pressure; they do not make the base
coefficients or calculated base components Result rows. The workbench does not
reproduce an action's base DMG Multiplier. Mindscape may select a retained
effect's level-12, level-14, or level-16 value without admitting that action's
ordinary coefficient. When a current source independently modifies a retained
action's DMG Multiplier, the Result may expose only that operation and its action
applicability without calculating the base multiplier or `base_damage`.

The anomaly coefficient remains specific to the applicable attribute result.
Disorder can determine that coefficient from remaining duration or
another result-specific basis. This does not change the `ATK` scaling stat.

A source-stated additive increase to an Attribute Anomaly or Disorder DMG
Multiplier changes the applicable coefficient inside `anomaly_base_damage`; it
is not an `anomaly_buff_multiplier` bonus. A result-specific percentage of an
original Disorder likewise belongs to that result's `anomaly_base_damage`
basis. By contrast, a source that increases Attribute Anomaly or Disorder DMG
without changing the source result's multiplier contributes to
`anomaly_buff_multiplier` when current mechanics establish that bonus
region.

Here `ATK` identifies the scaling stat exposed across the three product
surfaces. The workbench does not combine multiple Agents' anomaly-buildup
shares into a damage result. A fully enabled ATK value is therefore a
setting-tuning value, not a reproduced anomaly-application history.

`base_damage` is not a universal parent for every damage formula. The component
names preserve which scaling relation a setup must strengthen. A proposal to
merge them must first show that valid stats, invalid stats, current Result, and
displayed modifier regions remain unchanged.

## Component Meanings

**Rule ID:** `FM-004`

| Component | Meaning for setting decisions |
| --- | --- |
| `dmg_bonus_multiplier` | `1 +` the sum of applicable regular DMG bonuses, including all-type, attribute, action, and other source scopes that apply to the selected output |
| `crit_multiplier` | non-critical value `1`; critical value `1 + CRIT DMG`; expected crit-capable value `1 + min(CRIT Rate, 100%) * CRIT DMG` |
| `def_multiplier` | target DEF region after applicable DEF Reduction, DEF Ignore, PEN Ratio, and flat PEN |
| `res_multiplier` | target resistance region after applicable RES Reduction and RES Ignore |
| `stun_dmg_multiplier` | target damage multiplier used in the Stunned damage window and changed by source effects that explicitly modify it |
| `dmg_taken_multiplier` | general target-side region after applicable DMG Taken Increase and incoming DMG Reduction; not a synonym for an attacker dealing more damage to or against a target |
| `sheer_dmg_bonus_multiplier` | `1 +` the sum of applicable Sheer DMG bonuses; separate from regular DMG Bonus |
| `anomaly_proficiency_multiplier` | damage scaling contributed by Anomaly Proficiency to applicable anomaly damage |
| `anomaly_buff_multiplier` | `1 +` applicable Attribute Anomaly or Disorder bonus that the source and result rules include; multiplicative with regular DMG Bonus |
| `skill_daze` | source skill's Daze value; its base value is not a current Result row |
| `impact_multiplier` | Daze scaling contributed by Impact |
| `daze_bonus_multiplier` | `1 +` applicable Daze bonuses |
| `daze_res_multiplier` | target Daze resistance region |
| `daze_taken_multiplier` | target Daze-taken region |
| `skill_buildup` | source skill's base Anomaly Buildup |
| `anomaly_mastery_multiplier` | buildup scaling contributed by Anomaly Mastery |
| `buildup_bonus_multiplier` | `1 +` applicable Anomaly Buildup bonuses |
| `buildup_res_multiplier` | target Anomaly Buildup resistance after applicable reduction |

Applicable regular-DMG contributions add inside `dmg_bonus_multiplier` only
when each contribution's action scope, attribute scope, and other source scope
match the output being inspected. An unscoped contribution and an
Ultimate-scoped contribution therefore remain separate atomic inputs even
though both occupy the same modifier region. Their applicable total is a
derived result for that output, not a stored source fact.

### Stun DMG Multiplier And Veil Replacement

**Rule ID:** `FM-005`

Ordinary Stun DMG Multiplier contributions add to the target's bonus above its
neutral `100%` total. They remain one target-side formula region and do not
become regular DMG Bonus, Daze, or a setup stat.

Ye Shunguang supplies the current bounded replacement consumer. While Ether
Veil: Verdict is active, her skill damage against an enemy inside the Veil
ignores that enemy's ordinary Stun DMG Multiplier and instead uses Veil
Vulnerability. For the workbench's editable target total and currently
applicable party contributions:

```text
target_stun_bonus = target_stun_dmg_multiplier - 100%

raw_veil_vulnerability_bonus =
  target_stun_bonus
  + applicable_party_stun_dmg_multiplier_additions

veil_vulnerability_bonus =
  min(raw_veil_vulnerability_bonus, veil_vulnerability_cap)
```

The base cap is `+110%`; Ye Shunguang M4 raises that cap to `+200%`. The raw
bonus remains visible as the cap basis so oversupply is inspectable, while the
clamped bonus is the replacement used by Ye's applicable Fully Enabled damage.
For example, a `200%` target supplies `+100%`; adding Trigger's `+35%` produces
the raw `+135%` basis and the M0 replacement remains `+110%`.

This relationship is evaluated only for Ye's Fully Enabled Ether Veil window.
It does not cap, replace, or reinterpret another Agent's ordinary Stun DMG
Multiplier Result.

A source-stated DMG Multiplier modifier operation changes the action's skill
multiplier inside its base component; it is not regular DMG Bonus. A
source-stated Daze Multiplier modifier operation changes the action's
`skill_daze`; it is not Daze Bonus. For a retained action, the workbench can
display an independent added amount or scale factor with action scope while
omitting the ordinary base multiplier, calculated base component, and final
output. A value that is itself an additional skill-table action coefficient is
part of the excluded base component, not a retained modifier operation.

### DEF Composition Order

**Rule ID:** `FM-006`

The DEF region keeps its internal buckets distinct. At the setting-mechanics
abstraction used by the workbench:

```text
target_def =
  target_base_def
  * (1 + target_def_percent - def_reduction - def_ignore)
  + flat_target_def

effective_def = max(target_def * (1 - pen_ratio) - flat_pen, 0)

def_multiplier =
  level_coefficient / (level_coefficient + effective_def)
```

Applicable DEF Reduction and DEF Ignore add in the pre-PEN bucket. PEN Ratio
then removes a percentage of the remaining target DEF, and flat PEN is applied
after that percentage step. These inputs occupy one `def_multiplier` component,
but they are not one additive bucket or independent final multipliers.

Ignoring flat terms for a bounded comparison, the remaining DEF factor is
`(1 - reduction - ignore) * (1 - pen_ratio)`. Its expansion includes the
positive cross term `pen_ratio * (reduction + ignore)`. Therefore splitting a
fixed amount of DEF bypass between the pre-PEN and PEN buckets leaves more DEF
than concentrating that amount in either bucket. For example, 36% DEF Ignore
and 24% PEN Ratio leave `0.64 * 0.76 = 48.64%` of the original DEF, not 40%.
After the 36% Ignore, the 24% PEN Ratio removes 15.36% of the original DEF.

Each input can still increase damage while effective DEF remains above zero.
Its marginal value depends on the enemy DEF basis, level coefficient, existing
effects in both buckets, and whether its source scope covers the inspected
output. This relationship establishes formula pressure only; setup policy owns
candidate admission and user-selection boundaries.

Canonical action scope is an applicability qualifier. It is not another
formula component, formula family, setup role, or instruction to calculate the
action's final damage.

Stats such as ATK, Sheer Force, Impact, Anomaly Proficiency, and Anomaly Mastery
remain game stats even when a formula component reads them. A source effect that
changes a stat belongs on the stat surface; a source effect that changes a
modifier region belongs on the relevant component.

Stun duration is a game-domain time span, not a component of `daze_buildup`
and not another name for `skill_daze`, Impact, or Stun DMG Multiplier. A
source can use remaining Stun duration as an entity-local input to a skill
multiplier or Daze-return relation, as Hugo does, without creating a universal
Stun-duration formula family or modifier bucket. The workbench can display a
Stun-duration extension as an operation even when no current formula consumes
that time.

## Formula-Family Stat Consequences

**Rule ID:** `FM-007`

| Formula family | Direct setting pressures | Formula exclusions relevant to setting |
| --- | --- | --- |
| `general_damage` | ATK, applicable DMG Bonus, CRIT Rate and CRIT DMG for crit-capable output, DEF-region effects, RES-region effects, Stun DMG Multiplier | Anomaly Proficiency, Anomaly Mastery, and Sheer Force do not strengthen this frame without a separate source conversion |
| `sheer_damage` | Sheer Force and the stats a source converts into it, applicable regular DMG Bonus, CRIT Rate and CRIT DMG, RES-region effects, Stun DMG Multiplier, Sheer DMG Bonus | the frame omits `def_multiplier`; DEF Reduction, DEF Ignore, PEN Ratio, and flat PEN do not strengthen Sheer DMG |
| `anomaly_damage` | ATK, Anomaly Proficiency, applicable regular DMG Bonus, applicable anomaly bonus, DEF-region effects, RES-region effects, Stun DMG Multiplier | CRIT Rate and CRIT DMG are invalid by default; Anomaly Mastery changes buildup rather than damage per application |
| `daze_buildup` | skill Daze, Impact, Daze Bonus, target Daze resistance, Daze Taken | CRIT, regular DMG Bonus, and damage formula modifiers do not increase Daze unless a source explicitly converts them through an explicit relationship |
| `anomaly_buildup` | skill buildup, Anomaly Mastery, Buildup Bonus, target buildup resistance | Anomaly Proficiency increases anomaly damage rather than buildup unless a source states another relationship |

General `dmg_taken_multiplier` remains in each applicable damage frame because
enemy, stage, or other target mechanics can change it. It is not a direct
setting pressure: the current setup-source boundary admits only Caesar King's
qualified enemy-context DMG Taken contribution, projected after the party
condition is established rather than used to author a recipient's equipment or
stat candidates. Source-fact treatment owns that bounded admission and the
wording distinctions used to preserve it.

A current mechanics relationship states that current Rupture Agents convert
30% of current ATK and 10% of current Max HP into Sheer Force. The Max HP
clause appears as the first clause of each current Rupture Agent Core Passive,
but it is already applied before combat. The source container therefore does not
make this conversion a combat-baseline activation.

For every display surface:

```text
rupture_sheer_force(surface)
  = current_ATK(surface) * 0.30
  + current_Max_HP(surface) * 0.10
```

`current ATK` and `current Max HP` mean the calculated values on that
same display surface, not the names of separate fixed stat surfaces. Initial,
combat-baseline, and fully-enabled Sheer Force each read their respective ATK
and Max HP values, although equal inputs can produce equal outputs.

Direct Sheer Force additions are applied after this conversion on the surface
where their own source becomes available. Unless another source explicitly
fixes a basis surface, any other retained conversion likewise reads its basis
stat on each applicable display surface; a source that says `initial ATK`
remains fixed to initial stats. `Rupture` remains a specialty, ATK, Max
HP, and Sheer Force remain separate stats, and `sheer_damage` remains a
formula family; the conversion relates these axes without merging them.

A source conversion creates a relationship between axes; it does not rename
any of those axes.

## Modifier Balance And Party Pressure

**Rule ID:** `FM-008`

Applicable bonuses inside one modifier region add before that region multiplies
with other regions. This produces the setting pressure the workbench must expose
without turning the formula authority into a ranking engine or automatic setup selector.

For example, placing a total 20% increase in one region gives a factor of `1.2`.
Placing 10% in each of two independent positive multiplicative regions gives
`1.1 * 1.1 = 1.21`. The example explains why selected-party modifiers can change
the relative pressure on a user-selected setup even when the total displayed bonus
percentage looks similar.

That positive-bonus example does not describe DEF's internal order. As defined
in [DEF Composition Order](#def-composition-order), spreading bypass between
the pre-PEN and PEN buckets reduces the combined bypass because PEN Ratio acts
only on the DEF that remains.

Consequences for the workbench include:

- a party that already supplies a large regular DMG Bonus can increase the
  relative pressure on a different valid region;
- PEN Ratio and Puffer Electro can be credible candidates when the DEF region is
  valid and otherwise under-supplied;
- applicable DEF Reduction or DEF Ignore on a direction-defining output can
  lower PEN Ratio's relative pressure because they compose in different ordered
  buckets inside the same DEF region;
- Puffer Electro's PEN Ratio does not strengthen `sheer_damage` because that
  family omits the DEF region; and
- CRIT Rate and CRIT DMG form one expected crit component, while candidate
  policy may separately account for critical-hit stability.

Scope is evaluated relative to the authored direction rather than by breadth
alone. An action-scoped modifier can create compositional pressure when it
covers a direction-defining output, while a broad or numerically large modifier
does not by itself prove candidate exclusion. Formula mechanics establishes
only that applicability and pressure. Current setup policy admits broad pre-PEN
pressure as a candidate-membership consumer; admitting an action-scoped
membership consumer requires a separate current product decision rather than
being inferred from the formula. The
[Candidate Preparation Dependency](setup-workbench-product-contract.md#candidate-preparation-dependency)
classifies that pressure as no setup change, a prepared-choice-only adjustment,
or a candidate-membership adjustment after current competitive-practice review.
It does so without runtime action share, uptime, scoring, or optimization; the
user makes the final setup selection.

## Stat-Derived Scaling Relationships

**Rule ID:** `FM-009`

A linear stat scaling relationship connects a basis stat at one display surface
to a derived output. The relationship does not make the basis and output the
same stat, formula component, or setup role.

For the bounded linear relationships consumed by the current workbench:

```text
eligible_basis = max(basis_value - basis_threshold, 0)
uncapped_output =
  base_output + eligible_basis / basis_increment * output_increment
active_output = min(uncapped_output, output_cap)
```

A relationship without a source threshold uses zero eligible-basis offset.
Source facts own the threshold, increments, base output, and cap. Formula
mechanics owns their calculation relationship, and the product contract owns
which current basis and linked output the result exposes.

The current bounded Ben relationship reads Initial DEF twice without turning
DEF or shields into a new formula family:

```text
Ben Combat ATK addition = 0.8 * Ben Initial DEF
Ben Core shield per EX follow-up =
  (0.3 * Ben Initial DEF + 550) * (1 + sum of applicable Shield Effect)
```

Shield Effect percentages add in one modifier region before they scale the
source-stated shield basis. Initial DEF changes both retained outputs; Shield
Effect changes only the shield output. This relationship does not define
incoming damage, shield uptime, replacement, duration optimization, or a
generic survival formula.

When initial ATK is a scaling basis, ATK% and flat ATK remain separate inputs.
An ATK% contribution reads the current base ATK, which includes
the selected W-Engine's Base ATK, while a flat contribution does not. Therefore
a remaining output difference does not identify one required effective substat
hit count without choosing an investment path and current equipment context.

## Thresholds, Caps, And Active Values

**Rule ID:** `FM-010`

A source threshold or cap can change which stat target is useful, but it is not
an internal formula component. Current examples include Astra Yao's initial-ATK output cap, Timeweaver's
Anomaly Proficiency threshold, Yuzuha's party-scaling caps, and Lucia's direct
Sheer Force cap.

Formula mechanics explains what the affected stat or modifier changes. Source
facts preserve the threshold, cap, condition, and timing. Setup policy decides
whether the value changes a candidate or Result relationship.

## Excluded Calculation Detail

**Rule ID:** `FM-011`

The current foundation does not keep editable ordinary-skill levels, unused
skill-table values, base action DMG or Daze Multipliers, calculated
`base_damage` or `skill_daze`, or detail solely to reproduce skill damage,
enemy-specific output, rotations, uptime, action frequency, average stacks,
distance penalties, anomaly trigger cooldowns, or a complete combat simulation.
This exclusion does not remove the level-12, level-14, and level-16 variants of
a retained setting effect or an independent source-stated DMG or Daze Multiplier
modifier operation whose action scope changes the visible Result. A later source
case must demonstrate another distinct workbench result before further detail
can enter the permanent foundation.
