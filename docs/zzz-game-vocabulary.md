# ZZZ Game Vocabulary

Status: game-domain term authority for the setup workbench foundation.

## Purpose And Boundary

This document fixes canonical game meanings only where the workbench must
display a value, calculate a current Result, or distinguish candidate
eligibility and setting-relevant game effects.

| Owns | Does not own |
| --- | --- |
| game entity, identity, stat, action, condition, and combat-result meaning | setup direction, setup role, formula family, formula component, source-fact treatment, recipient policy, display calculation |

Setup behavior belongs to `docs/setup-workbench-product-contract.md`. Formula
meaning belongs to `docs/zzz-formula-mechanics.md`. A term's appearance here
does not require a field, registry, lifecycle, or shared project axis.

## Game Entities And Equipment

| Term | Game meaning | Setting relevance |
| --- | --- | --- |
| Agent | playable party character with identity, stats, skills, and equipment eligibility | selected party member and subject of a setup or preview |
| Agent Rank | an Agent identity expressed by the source as S-Rank or A-Rank | selects the product's preparation-default Mindscape; does not establish setup role or formula family |
| W-Engine | equippable item with Base ATK, an advanced stat, and a passive effect qualified by W-Engine Specialty | candidate inspection, stat contribution, passive availability, conditions, values, scopes, and windows |
| W-Engine Rank | a W-Engine identity expressed by the source as S-Rank, A-Rank, or B-Rank | selects the product's preparation-default refinement for admitted S-Rank and A-Rank candidates |
| W-Engine refinement | W-Engine passive enhancement state whose source values vary by refinement | qualifies current passive values at the preparation default or current preview selection |
| Drive Disc | equippable item occupying one of six numbered slots and carrying a main stat and substats | main-stat candidates, substat pressure, and set composition |
| Drive Disc set | named equipment set with 2-piece and 4-piece effects | candidate set and party-effect pressure |
| main stat | slot's primary stat contribution | slot-specific candidate choice |
| substat | additional stat contribution on a Drive Disc | stat tuning inside a candidate setup |
| advanced stat | W-Engine's non-Base-ATK stat contribution | candidate stat pressure; separate from the W-Engine passive |

A W-Engine's Specialty qualification controls whether its passive is available
to the holder. It does not remove the W-Engine's Base ATK or advanced stat.
Matching Specialty therefore proves passive availability rather than candidate
value, while a non-matching W-Engine remains a partial package whose candidate
value belongs to setup policy.

Agent Rank, W-Engine Rank, and Drive Disc Rank qualify different entity types.
Their shared S-Rank and A-Rank labels do not make their progression states,
values, or workbench treatment interchangeable. The preparation-default
Mindscape and W-Engine refinement mappings belong to
`docs/setup-workbench-product-contract.md`.

### Level 15 S-Rank Drive Disc Main Stats

Each Drive Disc slot admits a game-defined main-stat pool. Slots 1, 2, and 3
each admit one fixed main stat. Slots 4, 5, and 6 admit the alternatives listed
below. The amount is the fixed main-stat value on a level 15 S-Rank Drive Disc.

| Slot | Eligible main stat | Level 15 S-Rank amount |
| --- | --- | ---: |
| Slot 1 | HP | 2,200 |
| Slot 2 | ATK | 316 |
| Slot 3 | DEF | 184 |
| Slot 4 | HP% | 30% |
| Slot 4 | ATK% | 30% |
| Slot 4 | DEF% | 48% |
| Slot 4 | CRIT Rate | 24% |
| Slot 4 | CRIT DMG | 48% |
| Slot 4 | Anomaly Proficiency | 92 |
| Slot 5 | HP% | 30% |
| Slot 5 | ATK% | 30% |
| Slot 5 | DEF% | 48% |
| Slot 5 | PEN Ratio | 24% |
| Slot 5 | Physical DMG Bonus | 30% |
| Slot 5 | Fire DMG Bonus | 30% |
| Slot 5 | Ice DMG Bonus | 30% |
| Slot 5 | Electric DMG Bonus | 30% |
| Slot 5 | Ether DMG Bonus | 30% |
| Slot 6 | HP% | 30% |
| Slot 6 | ATK% | 30% |
| Slot 6 | DEF% | 48% |
| Slot 6 | Anomaly Mastery | 30% |
| Slot 6 | Impact | 18% |
| Slot 6 | Energy Regen | 60% |

Slot eligibility is not setup relevance. The game pool states what a Disc in
that slot can carry; `docs/setup-workbench-product-contract.md` decides which
eligible main stats a selected setup direction offers as candidates.

Main-stat eligibility is also independent of Drive Disc set composition. A
set's pieces can occupy any compatible slots; the selected main stat and the
total pieces needed for a 2-piece or 4-piece effect remain separate equipment
facts.

Two pieces and four pieces of one named set unlock that set's respective
effects once. Four pieces already satisfy the 2-piece threshold; a fifth or
sixth piece does not unlock another copy or a separate 6-piece effect.

Rank and level are part of each amount's meaning. These values do not describe
lower-rank Discs or an S-Rank Disc below level 15, and they are not effective
substat hits.

The special attributes defined below do not add separate Slot 5 choices. Their
game-defined base-Attribute relationships determine which listed base
attribute DMG Bonus applies.

### S-Rank Drive Disc Substat Values

On an S-Rank Drive Disc, a substat's initial appearance and each later
enhancement to that substat contribute the same fixed amount. These are game
values, not setup priorities or recommended investment amounts.

A Drive Disc cannot carry a substat identical to its main stat. An S-Rank
Drive Disc receives five enhancement events by level 15. When it begins with
four substats, one eligible substat can therefore contribute at most six fixed
amounts on that Disc: one initial appearance and five enhancements. Across six
Discs on which the substat remains eligible, the absolute theoretical maximum
is 36. Selected main stats can reduce the physically eligible-Disc count. The
workbench deliberately does not derive a preview-specific input maximum from
that relation; its fixed input boundary belongs to
`docs/setup-workbench-product-contract.md`.

| Substat | Fixed amount from initial appearance or one enhancement |
| --- | ---: |
| HP | 112 |
| ATK | 19 |
| DEF | 15 |
| HP% | 3% |
| ATK% | 3% |
| DEF% | 4.8% |
| CRIT Rate | 2.4% |
| CRIT DMG | 4.8% |
| PEN | 9 |
| Anomaly Proficiency | 9 |

Drive Disc Rank remains part of the meaning: lower-rank Discs use different
amounts. Whether and how the workbench uses these values belongs to
`docs/setup-workbench-product-contract.md`.

The official English Version 3.0 update calls the displayed total the number of
effective `Sub-Stat hits`. Community guides also use `roll` for enhancement
events and sometimes for initial substat appearances. The game mechanic here
establishes the fixed contribution from an initial appearance or enhancement;
`docs/setup-workbench-product-contract.md` owns the qualified workbench term
that states whether such a contribution is effective for a setup direction.

## Agent Identity

### Agent Skill Investment Terms

| Term | Game meaning | Setting relevance |
| --- | --- | --- |
| ordinary skill level | upgrade level of an Agent's Basic Attack, Dodge, Assist, Special Attack, and Chain Attack categories; M3 and M5 each add two levels to the completed categories | not editable; a retained effect uses only the completed tier qualified by the product contract |
| Core Passive | game-named Agent effect with upgrade-dependent values | source value used by a setup, stat surface, modifier, threshold, or cap |
| Potential Awakening | game-named Agent effect with its own upgrade levels, present only for Agents whose current source supplies it | completed progression qualifier applied to the affected Agent sources; after maximum application it does not remain a separate current source identity |
| Mindscape | numbered Agent enhancement effects; M0 has no unlocked Mindscape effect, while M1 through M6 include effects through the stated number | qualifies applied Agent effects and selects any retained ordinary-skill tier defined by the product contract |

Ordinary skill level, Core Passive, Potential Awakening, and Mindscape are
separate Agent investment axes. Their workbench treatment belongs to
`docs/setup-workbench-product-contract.md`; none of these terms establishes a
setup role, formula family, or candidate priority.

### Specialty

Specialty is an Agent and W-Engine identity used by party qualifications and
W-Engine passive qualification.

Current setting-relevant specialty values are:

- Attack;
- Stun;
- Anomaly;
- Support;
- Defense; and
- Rupture.

Specialty does not define setup role, formula family, scaling stat, field
position, or stat priority. Those relationships require separate setup policy and current game meaning.

### Attribute

Attribute is the elemental context used for damage, anomaly buildup, anomaly
results, party qualifications, weaknesses, resistances, and attribute-scoped
effects.

Current base attributes used by the workbench are:

- Physical;
- Fire;
- Ice;
- Electric;
- Ether.

Attribute is not formula family. One attribute can occur in direct damage,
anomaly damage, anomaly buildup, Daze, or a character-specific formula.

### Faction

Faction is an Agent identity used by source-stated party qualifications. It
does not define setup role, field position, recipient, or formula behavior.

The workbench keeps faction identity only when a party condition or Result
requires it; this document does not duplicate a complete faction catalogue.

## Special Attributes

A special Attribute is a game-named Attribute with a defined relationship to a
base Attribute. Keep both names only when the distinction changes current
applicability or calculation; otherwise use the base relationship.

| Special Attribute | Base relationship |
| --- | --- |
| Frost | damage and buff effects calculate from Ice |
| Auric Ink | damage and buff effects calculate from Ether |

This relationship does not make the two attribute names synonyms. The special
Attribute can keep its own anomaly buildup and source-local behavior while
using the base Attribute for the defined damage and buff relationship.
It does not create a formula family or setup role.

## Stats

A stat is a named game value on an Agent, W-Engine, Drive Disc, enemy, or
combat state. A stat can be a displayed value, a formula input, a source scaling
basis, a threshold, or an equipment contribution. Those uses do not make the
stat itself a formula component.

### Setting-Relevant Agent Stats

| Stat | Game meaning needed by the workbench | Not the same as |
| --- | --- | --- |
| HP | health stat; Max HP can also be a source scaling basis | Sheer Force or damage output |
| ATK | attack stat and common damage or buff scaling input | Base ATK, DMG Bonus, or damage output |
| DEF | defense stat | target DEF multiplier or DEF Reduction |
| Impact | stat used to increase Daze dealt | Daze output or Stun state |
| CRIT Rate | probability that crit-capable damage critically hits | CRIT DMG or expected-damage policy |
| CRIT DMG | bonus applied when crit-capable damage critically hits | DMG Bonus or Stun DMG Multiplier |
| PEN | flat defense penetration | PEN Ratio or DEF Reduction |
| PEN Ratio | percentage defense penetration | PEN, DEF Ignore, or DEF Reduction |
| Anomaly Proficiency | stat that increases applicable anomaly damage | Anomaly Mastery or Anomaly Buildup |
| Anomaly Mastery | stat that increases anomaly buildup | Anomaly Proficiency or anomaly damage |
| Energy Regen | stat that changes Energy recovery | Energy, Adrenaline, or action frequency |
| Sheer Force | stat used as the scaling input for Sheer DMG | Rupture specialty, Sheer DMG, or `sheer_base_damage` |

### Stat Surfaces Named By Sources

| Term | Game meaning needed by the workbench | Boundary |
| --- | --- | --- |
| Base Stat | value before equipment and other stat bonuses; Agent and W-Engine Base ATK contribute to the applicable base | composition belongs to formula mechanics |
| Base Energy Regen | Agent Energy Regen basis before percentage contributions; applied Core upgrades can increase this base when the source names them | composition belongs to formula mechanics; per-second operations are not part of this base or its percentage region, and one-time Energy gains remain separate |
| initial stat | stat shown before combat after applicable pre-combat equipment contributions; some source effects explicitly read this value | the product contract owns the initial-stat display surface |
| combat stat | stat after in-combat stat changes are applied | the product contract owns the combat-baseline display surface |

When a source explicitly says `initial ATK`, do not substitute current combat
ATK. When a W-Engine says `Base ATK`, do not treat it as an ATK percentage or a
combat ATK buff.

## Actions And Source-Local Conditions

A canonical action kind is a shared move class used by setting logic, such as
Basic Attack, Dash Attack, Dodge Counter, Special Attack, EX Special Attack,
Assist, Assist Follow-Up, Chain Attack, or Ultimate. A trigger action, the
action affected by an effect, and the effect recipient remain separate axes
even when one source sentence names all three.

A game effect can name a particular move, form, or state inside one canonical
action kind. Use the canonical kind when it produces the same candidate and
Result. Keep an entity-local qualifier only when two forms of the same action
kind produce different current Results.

A source-local condition is a requirement stated with a game identity, action,
state, resource, mark, stance, action property, enemy condition, stat threshold,
equipment state, stack count, or local mechanism. Its original name does not
become a calculation input merely because the source names it.

Keep the smallest functional condition that changes activation, applicability,
compatibility, affected scope, value, recipient, or display calculation. If a
named state only mediates one applied effect, model the effect directly. This
does not create a global action catalogue, state lifecycle, transition graph,
resource model, or universal effect taxonomy.

### Identical Non-Stacking Effects

When multiple Agents provide the same effect and its wording does not state
that the effect stacks with another copy, the copies do not add together. This
compatibility statement remains separate from stacks accumulated inside one
game effect.

Non-stacking wording alone does not establish whether combat reapplication
refreshes, replaces, or protects an active value, or whether trigger order
changes the result. Those live-state relationships remain unresolved and
outside this service. The
[fully enabled party window](setup-workbench-product-contract.md#fully-enabled-party-window)
owns the product's non-sequential value choice.

## Daze And Stun

| Term | Game meaning | Setting boundary |
| --- | --- | --- |
| Daze | output accumulated on an enemy's Daze gauge | Impact and Daze bonuses can change accumulation; Daze is not Impact |
| Stunned | enemy condition reached when its Daze gauge is filled | enables source-stated Stun interactions; does not mean every effect triggered by a Stun Agent applies only while Stunned |
| Stun duration | time span for which an enemy remains in the Stunned condition | a source can extend this time span without adding Daze or changing Stun DMG Multiplier |
| Stun DMG Multiplier | target multiplier associated with the Stunned damage window and source effects that modify it | distinct from Daze dealt, CRIT DMG, and generic DMG Bonus |

A source-stated Stun-duration extension does not by itself establish a universal
base duration, additive stacking with other extensions, or priority among
non-stacking effects.

A source may explicitly increase Stun DMG Multiplier before the target is
Stunned. The recipient and source-stated duration remain valid even though the
multiplier affects damage only in its applicable calculation context.

## Attribute Anomaly Results

Attribute Anomaly is the result of filling an attribute's anomaly gauge. The
following names are setting-relevant because character, equipment, and party
effects can scope their conditions or bonuses to them.

| Attribute context | Anomaly results used by setting facts |
| --- | --- |
| Physical | Assault and Flinch |
| Fire | Burn |
| Ice and Frost | Freeze, Shatter, and Frostbite |
| Electric | Shock |
| Ether and Auric Ink | Corruption |

Repeatable attacks that deal an Attribute can build and establish that
Attribute's matching anomaly. A same-Attribute teammate may accelerate that
process without being inherently required.

The [product contract](setup-workbench-product-contract.md#fully-enabled-party-window)
owns enabled-window treatment.

These are game results and conditions, not formula components. Their damage,
duration, Daze, and modifier relationships belong to formula mechanics when a
setting result needs them.

### Cross-Attribute Results

| Term | Game meaning needed by the workbench | Boundary |
| --- | --- | --- |
| Disorder | result produced when a different attribute anomaly overwrites an existing anomaly, subject to source-specific exceptions | formula mechanics owns its damage calculation; source facts may affect Disorder without affecting the underlying anomaly |

The same word `Anomaly` can appear in a specialty, a stat relationship, a gauge,
a damage family, or a named result. Each occurrence keeps its stated semantic
kind; shared wording does not merge those axes.

## Admission Rule

Game-term retention follows only
[The Single Retention Gate](source-fact-boundary.md#the-single-retention-gate).
This section defines no second admission rule.
