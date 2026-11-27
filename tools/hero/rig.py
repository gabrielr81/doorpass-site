"""Jointed crowd figures for the DoorPass hero (v2 site, Task 5).

Every crowd figure is nested joint groups that reuse shared body parts:
  <g class="p p3 [j]">                     root: bob or jump on the 120 BPM grid; p1..p8 set --d (delay), --a (amplitude), --o (sway offset)
    <g class="hip">  thigh-l > shin-l, thigh-r > shin-r   knees bend on the beat
    <g class="torso"> upper-arm-r > fore-arm-r, ..., body, <g class="head">   torso leads, head and forearms lag 60-120 ms
The parts are <symbol>s defined once in the page (DEFS goes in the inline club SVG); the other venues only <use> them,
which keeps the bundle small. Joint pivots live in styles.css, in each figure's own units:
  shoulder (+-19, 47), hip (+-9.5, 106), knee (+-9.5, 168), neck (0, 34), waist (0, 112).
"""
import re, random
from limbs import arm, seg_path

N = '#0A1128'; O = '#F2553F'
HIPX, HIPY, KNEEY, FOOTY = 9.5, 106, 168, 224
TORSO = ('M-5 33C-8 37-15 38-21 40C-26 42-27.5 47-27.5 54L-24.5 90C-23.5 100-22.5 108-21.5 116'
         'C-14 119.5 14 119.5 21.5 116C22.5 108 23.5 100 24.5 90L27.5 54C27.5 47 26 42 21 40C15 38 8 37 5 33Z')
NECK = 'M-5.5 27H5.5L6 37H-6Z'
HAIR = {'short': '', 'long': '<path d="M-12 17C-12 3 12 3 12 17L13.5 40C7 43-7 43-13.5 40Z"/>', 'bun': '<circle cx="0" cy="3" r="5.5"/>',
        'pony': '<path d="M6 10C15 12 17 26 13 37C11 29 9 21 5 16Z"/>', 'cap': '<path d="M-11 13C-10 2 10 2 11 13Z"/><path d="M7 11L21 13.5L7 15Z"/>',
        'curly': '<circle cx="0" cy="15" r="14"/>'}
S0 = (19, 47)
POSE = {'up': ((30, 16), (27, -14), 'open'), 'v': ((35, 19), (43, -9), 'open'), 'point': ((31, 24), (47, 7), 'fist'),
        'pump': ((33, 23), (26, -3), 'fist'), 'phone': ((27, 21), (21, 1), 'fist')}


def _sym(i, body):
    return f'<symbol id="r-{i}" overflow="visible">{body}</symbol>'


def _arm_parts(pose, side):
    E, Wp, hand = POSE[pose]; m = 1 if side == 'r' else -1
    a = arm((S0[0] * m, S0[1]), (E[0] * m, E[1]), (Wp[0] * m, Wp[1]), 'U', 'F', N, hand)
    upper = re.search(r'<path d="[^"]*"/>', a).group(0)
    fore = a.split('<g class="F">', 1)[1].rsplit('</g></g>', 1)[0]
    if pose == 'phone':
        px = Wp[0] * m - 4.5 * m; x0 = min(px, px + 9 * m)
        fore += f'<rect x="{x0:.1f}" y="-13" width="9" height="15"/><rect x="{x0 + 1.5:.1f}" y="-11.5" width="6" height="11" fill="{O}" opacity=".85"/>'
    return upper, fore


def defs():
    """Shared body parts, placed once in the inline club SVG."""
    out = [_sym('torso', f'<path d="{TORSO}"/><path d="{NECK}"/>'),
           _sym('head', '<ellipse cx="0" cy="18" rx="10.5" ry="13"/>'),
           _sym('thigh', f'<path d="{seg_path([(0, HIPY), (-.6, 137), (0, KNEEY)], [8.6, 7.6, 6.4])}"/>'),
           _sym('shin', f'<path d="{seg_path([(0, KNEEY), (.6, 196), (0, FOOTY)], [6.4, 5.3, 4.2])}"/><ellipse cx="1.5" cy="{FOOTY + 3}" rx="6" ry="3.2"/>')]
    out += [_sym(f'h-{k}', v) for k, v in HAIR.items() if v]
    for pose in POSE:
        for side in 'rl':
            u, f = _arm_parts(pose, side)
            out += [_sym(f'ua-{pose}-{side}', u), _sym(f'fa-{pose}-{side}', f)]
    return ''.join(out)


def use(i, x=None):
    return f'<use href="#r-{i}"' + (f' x="{x}"' if x is not None else '') + '/>'


def legs(level):
    """level 2 (front row): thighs and shins bend. 1 (middle): thighs only. 0 (back): still. Still joints get no class,
    so the stylesheet has nothing to match or animate on them."""
    c = lambda name, lv: f' class="{name}"' if level >= lv else ''
    return (f'<g class="hip"><g{c("thigh-l", 2)}>{use("thigh", -HIPX)}<g{c("shin-l", 2)}>{use("shin", -HIPX)}</g></g>'
            f'<g{c("thigh-r", 2)}>{use("thigh", HIPX)}<g{c("shin-r", 2)}>{use("shin", HIPX)}</g></g></g>')


def crowd_arms(pose, moving=True):
    """pose: list of (name, side). Upper arm swings at the shoulder, forearm (nested) at the elbow."""
    if not moving:
        return ''.join(f'<g>{use(f"ua-{p}-{s}")}<g>{use(f"fa-{p}-{s}")}</g></g>' for p, s in pose)
    return ''.join(f'<g class="upper-arm-{s} ua-{s}">{use(f"ua-{p}-{s}")}<g class="fore-arm-{s} fa-{p}-{s}">{use(f"fa-{p}-{s}")}</g></g>'
                   for p, s in pose)


def level(s):
    """How much of a figure moves, by row. Back rows (small) only bounce; the middle row adds torso and arms;
    the front row adds head and knees. Every moving joint is work for the phone, so detail goes where it shows."""
    return 0 if s < .5 else 2 if s >= .9 else 1


def person(x, y, s, sx, op, root, hair, pose=None, arms='', has_legs=True):
    """root: classes on the figure root, e.g. 'p p3 j' (crowd), 'fan w2 p5', 'chat p1'.
    pose: crowd arm pose [(name, side)], or arms: custom arm markup (performers, glasses)."""
    lv = level(s)
    if pose is not None: arms = crowd_arms(pose, lv >= 1)
    head = f'<g{" class=\"head\"" if lv >= 2 else ""}>{use("head")}{use("h-" + hair) if HAIR[hair] else ""}</g>'
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({s * sx:.3f} {s:.3f})" opacity="{op}"><g class="{root}" fill="{N}">'
            f'{legs(lv) if has_legs else ""}<g{" class=\"torso\"" if lv >= 1 else ""}>{arms}{use("torso")}{head}</g></g></g>')


def variant(rnd):
    return f'p{rnd.randint(1, 8)}'

