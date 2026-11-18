import random, sys
sys.path.insert(0,'/home/claude/hero')
from limbs import arm
random.seed(7)
N='#0A1128'; O='#F2553F'
TORSO='M-5 33C-8 37-15 38-21 40C-26 42-27.5 47-27.5 54L-25.5 100C-24 130-22 160-21 230H21C22 160 24 130 25.5 100L27.5 54C27.5 47 26 42 21 40C15 38 8 37 5 33Z'
NECK='M-5.5 27H5.5L6 37H-6Z'
HEAD='<ellipse cx="0" cy="18" rx="10.5" ry="13"/>'
HAIR={'short':'','long':'<path d="M-12 17C-12 3 12 3 12 17L13.5 40C7 43-7 43-13.5 40Z"/>','bun':'<circle cx="0" cy="3" r="5.5"/>',
 'pony':'<path d="M6 10C15 12 17 26 13 37C11 29 9 21 5 16Z"/>','cap':'<path d="M-11 13C-10 2 10 2 11 13Z"/><path d="M7 11L21 13.5L7 15Z"/>','curly':'<circle cx="0" cy="15" r="14"/>'}
S=(19,47)
POSE={ # name: (elbow, wrist, hand)
 'up':((30,16),(27,-14),'open'), 'v':((35,19),(43,-9),'open'), 'point':((31,24),(47,7),'fist'),
 'pump':((33,23),(26,-3),'fist'), 'phone':((27,21),(21,1),'fist')}
def one_arm(pose, side):
    E,W,hand=POSE[pose]
    m=1 if side=='r' else -1
    s=(S[0]*m,S[1]); e=(E[0]*m,E[1]); w=(W[0]*m,W[1])
    out=arm(s,e,w,f'up-{side}',f'fa-{side} fa-{pose}-{side}',N,hand)
    if pose=='phone':
        px=w[0]-4.5*m; out=out.replace('</g></g>',f'<rect x="{min(px,px+9*m):.1f}" y="-13" width="9" height="15" fill="{N}"/><rect x="{min(px,px+9*m)+1.5:.1f}" y="-11.5" width="6" height="11" fill="{O}" opacity=".85"/></g></g>')
    return out
POSES=[[],[('up','r')],[('up','l')],[('up','r'),('up','l')],[('v','r'),('v','l')],[('point','r')],[('phone','r')],[('up','l'),('phone','r')],[('pump','r')],[('v','r')]]
def person(x,y,s,sx,op,cls,hair,pose):
    arms=''.join(one_arm(p,sd) for p,sd in pose)
    return (f'<g transform="translate({x:.1f} {y:.1f}) scale({s*sx:.3f} {s:.3f})" opacity="{op}">'
            f'<g class="p {cls}" fill="{N}">{arms}<path d="{TORSO}"/><path d="{NECK}"/>{HEAD}{HAIR[hair]}</g></g>')
rows=[(13,-6,25,280,.40,.45),(9,-10,38,304,.60,.75),(5,-6,66,338,.95,1)]
ppl=[]
for n,start,step,y0,s,op in rows:
    for i in range(n):
        x=start+i*step+random.uniform(-4,4); y=y0+random.uniform(-6,6)
        cls=random.choice(['d1','d2','d3','d4'])+(' j' if random.random()<0.2 else '')
        ppl.append(person(x,y,s*random.uniform(.94,1.06),random.uniform(.9,1.1),op,cls,random.choice(list(HAIR)),random.choice(POSES)))
from limbs import arm as limb
dj_pump=limb((19,47),(33,23),(26,-3),'dj-up','dj-fa',N,'fist')
dj_deck=limb((-19,47),(-31,64),(-12,76),'dj-deck','dj-deck-fa',N,'fist')
dj=f'''<g class="stage">
  <ellipse cx="130" cy="214" rx="96" ry="60" fill="url(#vglow)"/>
  <g transform="translate(130 182) scale(.56)"><g class="dj" fill="{N}">
    {dj_pump}{dj_deck}
    <path d="M-5 33C-8 37-15 38-21 40C-26 42-27.5 47-27.5 54L-26 112H26L27.5 54C27.5 47 26 42 21 40C15 38 8 37 5 33Z"/><path d="{NECK}"/>
    <g class="dj-head"><ellipse cx="0" cy="18" rx="10.5" ry="13"/><path d="M-13 18C-13 0 13 0 13 18" fill="none" stroke="{N}" stroke-width="3"/><rect x="-16" y="13" width="6" height="11" rx="2"/><rect x="10" y="13" width="6" height="11" rx="2"/></g>
  </g></g>
  <path d="M44 268H216L220 283H40Z" fill="{N}" opacity=".85"/><rect x="44" y="267" width="172" height="1.6" fill="{O}" opacity=".7"/>
  <path d="M90 236H170L166 268H94Z" fill="{N}"/>
  <rect x="100" y="230" width="20" height="6" fill="{N}"/><rect x="140" y="230" width="20" height="6" fill="{N}"/>
  <path d="M121 236L126 222H138L140 236Z" fill="{N}"/><path d="M123.5 233L127 224H136L137.5 233Z" fill="{O}" opacity=".55"/>
  <rect class="led" x="98" y="243" width="64" height="2.5" fill="{O}"/>
</g>'''
svg=f'''<div class="venue" aria-hidden="true"><svg viewBox="0 0 300 604" preserveAspectRatio="none" focusable="false">
<defs><radialGradient id="vglow"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>
{dj}
<g class="crowd">{''.join(ppl)}</g>
</svg></div>'''
open('/home/claude/hero/venue.svg.html','w').write(svg)
# CSS: joint pivots in each figure's own units
css=['.venue .up-r, .venue .up-l, .venue [class^="fa-"], .venue [class*=" fa-"], .venue .dj-up, .venue .dj-fa { transform-box: view-box; }',
     '.venue .up-r, .venue .dj-up { transform-origin: 19px 47px; } .venue .up-l { transform-origin: -19px 47px; }']
for name,(E,W,h) in POSE.items():
    css.append(f'.venue .fa-{name}-r {{ transform-origin: {E[0]}px {E[1]}px; }} .venue .fa-{name}-l {{ transform-origin: {-E[0]}px {E[1]}px; }}')
css.append('.venue .dj-fa { transform-origin: 33px 23px; }')
open('/home/claude/hero/venue.css','w').write('\n'.join(css)+'\n')
print(len(svg))
