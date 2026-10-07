# Movements

Every `movement` id used by `routines.json`, and what the animation shows. One
animation per id. There are no easier or harder variants to draw, so `push-up`
is one drawing and nothing else.

A missing animation still works. The board shows the name and the number with
an empty panel, so these can land in any order. The batches are only the order
they are first needed.

Each panel sits beside up to five others on a TV across a room, so the shape
has to read small.

## Batch 1, needed from level 1

21 ids.

| id | What it shows |
|---|---|
| `arm-circle` | Standing, arms circling. Warm-up only. |
| `broad-jump` | Two-footed jump forward for distance, landing soft. |
| `donkey-kick` | On hands and knees, one heel driven up and back. |
| `flutter-kick` | On the back, legs straight, kicking alternately just off the floor. |
| `glute-bridge` | On the back, feet on the floor, hips driven up. |
| `hollow-hold` | On the back, shoulders and heels off the floor. A hold. |
| `jog` | Running easy. Needs to read as slower than `run`. |
| `jump-squat` | Squat into a jump, landing soft. |
| `mountain-climber` | Front plank, knees driving to the chest alternately. |
| `plank` | Front plank on the forearms. A hold, so it barely moves. |
| `prone-swimmer` | Face down, arms sweeping from overhead to the hips and back. |
| `push-up` | Full push-up from the hands and toes. |
| `reverse-lunge` | Step back into a lunge, return to standing. Alternating. |
| `run` | Running. Used for every distance, 100m to 800m. |
| `side-plank` | Side plank on one forearm. Drawn on one side only. |
| `single-leg-deadlift` | Standing on one leg, hinging at the hip, back leg rising behind. |
| `sit-up` | Full sit-up, shoulders to knees. |
| `split-squat` | Rear foot up on a chair, front leg does the work. |
| `squat` | Bodyweight squat, hips to below parallel. |
| `suicide-run` | Sprint down the road, turn, sprint back, turn, repeat. One unbroken effort, the turns are in it. |
| `wall-sit` | Back on a wall, thighs parallel to the floor. A hold. |

## Batch 2, needed from levels 2 and 3

16 ids.

| id | What it shows |
|---|---|
| `bicycle-crunch` | On the back, opposite elbow to knee, alternating. |
| `curtsy-lunge` | Step one leg behind and across, then stand. |
| `dead-bug` | On the back, opposite arm and leg extending. A slow hold. |
| `hip-thrust` | Shoulders on a couch or bed, feet on the floor, hips driven up. |
| `inchworm` | Bend to the floor, walk the hands out to a plank, walk them back. |
| `lateral-lunge` | Step wide to one side, sit into that hip, return. |
| `nordic-curl` | Kneeling, ankles held by your partner, lowering under control. |
| `pike-push-up` | Hips high, hands and feet down, head to the floor. |
| `plank-jack` | Front plank, feet jumping apart and together. |
| `russian-twist` | Sat up, feet off the floor, torso rotating side to side. |
| `single-leg-glute-bridge` | Glute bridge with one foot off the floor. |
| `skater-jump` | Bound side to side, landing on one leg each time. |
| `step-up` | Step up onto a chair or stair, drive through the top leg. |
| `superman-hold` | Face down, arms and legs lifted. A hold. |
| `table-row` | Under a sturdy table, heels on the floor, chest pulled to the edge. |
| `v-up` | On the back, legs and arms rising to meet over the hips. |

## Batch 3, needed from levels 4 and 5

5 ids.

| id | What it shows |
|---|---|
| `burpee` | Down to the floor, chest down, up to a jump. |
| `high-knees` | Running in place, knees high. Warm-up only. |
| `jumping-lunge` | Lunge, jump, land in the other lunge. |
| `shoulder-tap` | Front plank, one hand tapping the opposite shoulder. |
| `tuck-jump` | Jump, knees tucked to the chest, land soft. |

## The holds

`dead-bug`, `hollow-hold`, `plank`, `prone-swimmer`, `side-plank`, `superman-hold`, `wall-sit` are holds, not reps. They carry
`seconds`, which turns the circuit timer on, and every value in the routines is
30, 60, 90 or 120 so a hold starts on a beep and ends on a beep. Draw these as
a position being held, not a movement being repeated.

## The suicide run

`suicide-run` is one movement, not a set. The whole thing is a single
continuous effort and the turns are part of it, so the animation wants to show
the out and back with the turn, not a person running in a straight line.

Its number is a **count of down and backs**, not metres. `reps: 4` is four of
them without stopping. Metres would just read as an ordinary run.

## Mobility

Eight ids the rewritten level 1 brought in. All of them are held or moved
through slowly rather than performed, so the drawings barely move: the shape
is the whole instruction.

| id | What it shows |
|---|---|
| `calf-stretch` | Staggered stance, back leg straight, back heel pressed down. |
| `cat-cow` | On hands and knees, the spine arching up then dipping, head following. |
| `chest-stretch` | Standing, arms swept back and open, chest forward. |
| `hamstring-stretch` | Standing fold over straight legs, hands reaching down. |
| `hip-circle` | Standing, hands on hips, hips circling. The only one that travels. |
| `hip-flexor-stretch` | Half kneeling, back knee down, hips pushed forward. |
| `leg-swing` | On one leg, the other swinging forward and back, loose. |
| `reverse-snow-angel` | Face down, arms sweeping from overhead to the hips. |

## Movements that need a prop or a partner

`hip-thrust`, `split-squat` and `step-up` use furniture, a couch, a chair or a
stair. `table-row` is under a table. Draw the furniture, because the height is
what makes the movement. `nordic-curl` needs the partner drawn holding the
ankles, since without that it reads as nothing.
