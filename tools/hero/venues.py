import random, sys, math
sys.path.insert(0,'/home/claude/hero')
from limbs import arm, seg_path
N='#0A1128'; O='#F2553F'; W='#FFFFFF'; LIFT='#131C3A'
TORSO='M-5 33C-8 37-15 38-21 40C-26 42-27.5 47-27.5 54L-25.5 100C-24 130-22 160-21 230H21C22 160 24 130 25.5 100L27.5 54C27.5 47 26 42 21 40C15 38 8 37 5 33Z'
SHORT='M-5 33C-8 37-15 38-21 40C-26 42-27.5 47-27.5 54L-26 112H26L27.5 54C27.5 47 26 42 21 40C15 38 8 37 5 33Z'
NECK='M-5.5 27H5.5L6 37H-6Z'
HEAD='<ellipse cx="0" cy="18" rx="10.5" ry="13"/>'
HAIR={'short':'','long':'<path d="M-12 17C-12 3 12 3 12 17L13.5 40C7 43-7 43-13.5 40Z"/>','bun':'<circle cx="0" cy="3" r="5.5"/>',
 'pony':'<path d="M6 10C15 12 17 26 13 37C11 29 9 21 5 16Z"/>','cap':'<path d="M-11 13C-10 2 10 2 11 13Z"/><path d="M7 11L21 13.5L7 15Z"/>','curly':'<circle cx="0" cy="15" r="14"/>'}
CSS=[]
def pivots(cls, S, E):
    CSS.append(f'.venue .{cls}-u {{ transform-box: view-box; transform-origin: {S[0]}px {S[1]}px; }} .venue .{cls}-f {{ transform-box: view-box; transform-origin: {E[0]}px {E[1]}px; }}')
def jarm(cls, S, E, Wp, hand='fist', extra=''):
    pivots(cls, S, E)
    a=arm(S,E,Wp,f'{cls}-u',f'{cls}-f',N,hand)
    if extra: a=a[:-len('</g></g>')]+extra+'</g></g>'
    return a
def fig(x,y,s,body,op=1,cls='',sx=1):
    return f'<g transform="translate({x:.1f} {y:.1f}) scale({s*sx:.3f} {s:.3f})" opacity="{op}"><g class="{cls}" fill="{N}">{body}</g></g>'
def torso(hair='short', short=False): return f'<path d="{SHORT if short else TORSO}"/><path d="{NECK}"/>'+HEAD+HAIR[hair]
# crowd arms reused from the club (classes up-r/up-l/fa-r/fa-l with pose pivots, already in the stylesheet)
S0=(19,47)
POSE={'up':((30,16),(27,-14),'open'),'v':((35,19),(43,-9),'open'),'point':((31,24),(47,7),'fist'),'pump':((33,23),(26,-3),'fist'),'phone':((27,21),(21,1),'fist')}
def crowd_arm(pose, side):
    E,Wp,hand=POSE[pose]; m=1 if side=='r' else -1
    s=(S0[0]*m,S0[1]); e=(E[0]*m,E[1]); w=(Wp[0]*m,Wp[1])
    out=arm(s,e,w,f'up-{side}',f'fa-{side} fa-{pose}-{side}',N,hand)
    if pose=='phone':
        px=w[0]-4.5*m; x0=min(px,px+9*m)
        out=out[:-8]+f'<rect x="{x0:.1f}" y="-13" width="9" height="15" fill="{N}"/><rect x="{x0+1.5:.1f}" y="-11.5" width="6" height="11" fill="{O}" opacity=".85"/></g></g>'
    return out
def crowd(seed, rows, poses, jump=.2, hair=None):
    rnd=random.Random(seed); out=[]
    for n,start,step,y0,s,op in rows:
        for i in range(n):
            x=start+i*step+rnd.uniform(-4,4); y=y0+rnd.uniform(-6,6)
            cls='p '+rnd.choice(['d1','d2','d3','d4'])+(' j' if rnd.random()<jump else '')
            arms=''.join(crowd_arm(p,sd) for p,sd in rnd.choice(poses))
            out.append(fig(x,y,s*rnd.uniform(.94,1.06),arms+torso(rnd.choice(hair or list(HAIR))),op,cls,rnd.uniform(.9,1.1)))
    return ''.join(out)
def scene(name, body, defs=''):
    return f'<svg class="venue-scene v-{name}" data-venue="{name}" viewBox="0 0 300 604" preserveAspectRatio="none" focusable="false"><defs>{defs}</defs>{body}</svg>'

# ---------------- LIVE MUSIC ----------------
def live():
    defs='<linearGradient id="spotg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".75"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>'
    spots=''.join(f'<path class="spot s{i}" d="M{x} -4L{x-34} 280H{x+34}Z" fill="url(#spotg)"/>' for i,x in enumerate([62,150,238]))
    CSS.append('.venue .spot { transform-box: fill-box; transform-origin: 50% 0; animation: spot 4s ease-in-out infinite alternate; } .venue .spot.s1 { animation-delay: -2s; } .venue .spot.s2 { animation-delay: -1s; animation-direction: alternate-reverse; }')
    stage=f'<path d="M30 258H270L284 284H16Z" fill="{N}" opacity=".9"/><rect x="30" y="257" width="240" height="1.6" fill="{O}" opacity=".8"/>'
    amps=''.join(f'<rect x="{x}" y="196" width="26" height="62" fill="{N}"/><circle cx="{x+13}" cy="214" r="7" fill="{LIFT}"/><circle cx="{x+13}" cy="238" r="9" fill="{LIFT}"/>' for x in (34,240))
    # drummer behind the kit
    drummer=fig(80,186,.44, jarm('drl',(-19,47),(-30,70),(-18,86))+jarm('drr',(19,47),(30,70),(18,86))+torso('cap',True),cls='p d2')
    kit=(f'<circle cx="80" cy="244" r="15" fill="{N}"/><circle cx="80" cy="244" r="9" fill="none" stroke="{O}" stroke-width="1.2" opacity=".6"/>'
         f'<rect x="58" y="228" width="16" height="7" fill="{N}"/><rect x="88" y="226" width="16" height="7" fill="{N}"/>'
         f'<line x1="54" y1="214" x2="54" y2="258" stroke="{N}" stroke-width="1.6"/><ellipse class="cym" cx="54" cy="213" rx="12" ry="2.5" fill="{N}"/>'
         f'<line x1="108" y1="210" x2="108" y2="258" stroke="{N}" stroke-width="1.6"/><ellipse class="cym c2" cx="108" cy="209" rx="12" ry="2.5" fill="{N}"/>')
    CSS.append('.venue .drl-f { animation: hit .25s ease-in infinite alternate; } .venue .drr-f { animation: hit .25s ease-in infinite alternate-reverse; } .venue .drl-u, .venue .drr-u { animation: none; }')
    CSS.append('.venue .cym { transform-box: fill-box; transform-origin: 50% 50%; animation: cym .5s ease-out infinite; } .venue .cym.c2 { animation-delay: -.25s; }')
    # singer with mic to mouth, other arm reaching out to the crowd
    mic=f'<rect x="4" y="9" width="5" height="11" rx="2" fill="{N}"/>'
    singer=fig(120,166,.52, jarm('sgm',(19,47),(29,31),(9,17),'fist',mic)+jarm('sgr',(-19,47),(-34,24),(-50,4),'open')+torso('long'),cls='p d1')
    stand=f'<line x1="132" y1="196" x2="138" y2="258" stroke="{N}" stroke-width="1.8"/><path d="M128 258L138 252L148 258Z" fill="{N}"/>'
    CSS.append('.venue .sgr-u { animation: reach 2s ease-in-out infinite; } .venue .sgr-f { animation: flex-l 1s ease-in-out infinite alternate; } .venue .sgm-u, .venue .sgm-f { animation: none; }')
    # guitarist
    guitar=f'<g><ellipse cx="6" cy="92" rx="15" ry="11" fill="{N}"/><ellipse cx="-6" cy="84" rx="10" ry="8" fill="{N}"/><rect x="-46" y="64" width="44" height="4" transform="rotate(-24 -2 66)" fill="{N}"/></g>'
    gtr=fig(166,174,.5, guitar+jarm('gst',(19,47),(27,74),(10,86))+jarm('gnk',(-19,47),(-35,62),(-47,54))+torso('curly'),cls='p d3')
    CSS.append('.venue .gst-f { animation: strum .25s ease-in-out infinite alternate; } .venue .gst-u, .venue .gnk-u, .venue .gnk-f { animation: none; }')
    rows=[(13,-6,25,282,.40,.45),(9,-10,38,306,.60,.75),(5,-6,66,340,.95,1)]
    c=crowd(21,rows,[[('up','r')],[('up','l'),('up','r')],[('v','r'),('v','l')],[('phone','r')],[('pump','r')],[('up','l'),('phone','r')],[]],jump=.15)
    return scene('live', spots+amps+stage+kit+drummer+stand+singer+gtr+f'<g class="crowd">{c}</g>', defs)

# ---------------- MEMBER LOUNGE ----------------
def lounge():
    defs=('<linearGradient id="lng" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1D2750"/><stop offset=".45" stop-color="#5A2A2C"/><stop offset="1" stop-color="#C8452F"/></linearGradient><linearGradient id="lfloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2553F" stop-opacity=".55"/><stop offset="1" stop-color="#F2553F" stop-opacity=".15"/></linearGradient>'
          '<radialGradient id="lamp"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".85"/><stop offset=".35" stop-color="#F2553F" stop-opacity=".45"/><stop offset="1" stop-color="#F2553F" stop-opacity="0"/></radialGradient>')
    bg=f'<rect width="300" height="604" fill="url(#lng)"/>'
    # back bar: lit shelves with bottles
    shelves=f'<rect x="20" y="96" width="260" height="140" fill="{O}" opacity=".45"/>'
    rnd=random.Random(5)
    for y in (132,176,220):
        shelves+=f'<rect x="20" y="{y}" width="260" height="3" fill="{N}"/>'
        x=26
        while x<272:
            h=rnd.uniform(18,30); w=rnd.uniform(6,9)
            shelves+=f'<rect x="{x:.1f}" y="{y-h:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{N}" opacity="{rnd.choice([.75,.9,1])}"/><rect x="{x+w/2-1.3:.1f}" y="{y-h-7:.1f}" width="2.6" height="8" fill="{N}"/>'
            x+=w+rnd.uniform(3,7)
    lamps=''.join(f'<g class="lamp l{i}"><line x1="{x}" y1="0" x2="{x}" y2="54" stroke="{N}" stroke-width="1.2"/><path d="M{x-11} 66L{x-6} 54H{x+6}L{x+11} 66Z" fill="{N}"/><circle cx="{x}" cy="70" r="26" fill="url(#lamp)"/></g>' for i,x in enumerate([62,150,238]))
    CSS.append('.venue .lamp { transform-box: view-box; animation: lamp 4s ease-in-out infinite alternate; } .venue .lamp.l0 { transform-origin: 62px 0; } .venue .lamp.l1 { transform-origin: 150px 0; animation-delay: -1.5s; } .venue .lamp.l2 { transform-origin: 238px 0; animation-delay: -3s; }')
    # bartender shaking a cocktail behind the counter
    shaker=f'<path d="M-4 -2H8L6 16H-2Z" fill="{N}"/>'
    bart=fig(118,166,.52, jarm('shk',(19,47),(31,34),(6,10),'fist',shaker)+jarm('shk2',(-19,47),(-28,32),(-4,12),'fist')+torso('bun',True),cls='')
    CSS.append('.venue .shk-u, .venue .shk2-u { animation: shake .25s ease-in-out infinite alternate; } .venue .shk-f, .venue .shk2-f { animation: none; }')
    counter=f'<rect x="0" y="246" width="300" height="26" fill="{N}"/><rect x="0" y="245" width="300" height="2" fill="{O}" opacity=".9"/><rect x="0" y="272" width="300" height="332" fill="url(#lfloor)"/>'
    stools=''.join(f'<rect x="{x}" y="286" width="3" height="40" fill="{N}"/><rect x="{x-9}" y="282" width="21" height="5" fill="{N}"/>' for x in (40,120,200,262))
    # guests: holding glasses, toasting now and then, chatting
    glass=lambda: f'<path d="M-3 -6H9L6 4H0Z" fill="{N}"/><rect x="2" y="4" width="2" height="7" fill="{N}"/>'
    rnd=random.Random(9); g=[]
    rows=[(7,10,44,300,.62,.7),(4,0,80,346,.95,1)]
    for n,start,step,y0,s,op in rows:
        for i in range(n):
            x=start+i*step+rnd.uniform(-5,5); y=y0+rnd.uniform(-5,5)
            d=rnd.choice(['d1','d2','d3','d4']); kind=rnd.choice(['toast','hold','talk','hold'])
            if kind=='toast': a=jarm(f'tst{d}',(19,47),(30,62),(30,38),'fist',glass())
            elif kind=='hold': a=jarm('hold',(19,47),(27,74),(31,56),'fist',glass())
            else: a=jarm('talk',(-19,47),(-28,72),(-36,52),'open')
            g.append(fig(x,y,s*rnd.uniform(.94,1.06),a+torso(rnd.choice(list(HAIR))),op,f'chat {d}',rnd.uniform(.9,1.1)))
    for d,delay in (('d1',0),('d2',-1),('d3',-2),('d4',-2.8)):
        CSS.append(f'.venue .tst{d}-u {{ animation: toast 3.5s ease-in-out {delay}s infinite; }} .venue .tst{d}-f {{ animation: none; }}')
    CSS.append('.venue .hold-u, .venue .hold-f { animation: none; } .venue .talk-u { animation: none; } .venue .talk-f { animation: talk 1s ease-in-out infinite alternate; }')
    CSS.append('.venue .chat { transform-box: fill-box; transform-origin: 50% 100%; animation: chat 2s ease-in-out infinite alternate; } .venue .chat.d2 { animation-delay: -.5s; } .venue .chat.d3 { animation-delay: -1s; } .venue .chat.d4 { animation-delay: -1.5s; }')
    return scene('lounge', bg+shelves+lamps+bart+counter+''.join(g), defs)

# ---------------- COMEDY / THEATER ----------------
def comedy():
    defs=('<radialGradient id="pool"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".5" stop-color="#F2553F" stop-opacity=".45"/><stop offset="1" stop-color="#F2553F" stop-opacity="0"/></radialGradient>'
          '<linearGradient id="spill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F2553F" stop-opacity=".75"/><stop offset=".5" stop-color="#B8402F" stop-opacity=".45"/><stop offset="1" stop-color="#1D2750" stop-opacity=".3"/></linearGradient>'
          '<linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".05"/></linearGradient>')
    bg=f'<rect width="300" height="604" fill="{LIFT}"/>'
    folds=''.join(f'<rect x="{x}" y="0" width="13" height="300" fill="{N}" opacity="{.55 if i%2 else .85}"/>' for i,x in enumerate(range(0,300,13)))
    valance=f'<path d="M0 0H300V34Q285 46 270 34Q255 46 240 34Q225 46 210 34Q195 46 180 34Q165 46 150 34Q135 46 120 34Q105 46 90 34Q75 46 60 34Q45 46 30 34Q15 46 0 34Z" fill="{N}"/>'
    light=f'<path class="cone" d="M118 30L70 270H170Z" fill="url(#cone)"/><ellipse cx="120" cy="214" rx="78" ry="70" fill="url(#pool)"/>'
    CSS.append('.venue .cone { animation: cone 3.5s ease-in-out infinite alternate; }')
    mic=f'<rect x="4" y="9" width="5" height="11" rx="2" fill="{N}"/>'
    comic=fig(120,152,.54, jarm('cmic',(19,47),(29,31),(9,17),'fist',mic)+jarm('gest',(-19,47),(-36,62),(-52,44),'open')+torso('short'),cls='comic')
    CSS.append('.venue .cmic-u, .venue .cmic-f { animation: none; } .venue .gest-u { animation: gesture 1.75s ease-in-out infinite alternate; } .venue .gest-f { animation: flex-l .875s ease-in-out infinite alternate; }')
    CSS.append('.venue .comic { transform-box: fill-box; transform-origin: 50% 100%; animation: chat 1.75s ease-in-out infinite alternate; }')
    stand=f'<line x1="156" y1="214" x2="156" y2="282" stroke="{N}" stroke-width="2"/><path d="M146 282L156 276L166 282Z" fill="{N}"/>'
    stool=f'<rect x="72" y="248" width="26" height="5" fill="{N}"/><rect x="76" y="253" width="3" height="30" fill="{N}"/><rect x="91" y="253" width="3" height="30" fill="{N}"/>'
    stage=f'<rect x="0" y="282" width="300" height="14" fill="{N}"/><rect x="0" y="281" width="300" height="1.6" fill="{O}" opacity=".9"/><rect x="0" y="296" width="300" height="308" fill="url(#spill)"/>'
    # seated audience: heads and shoulders in rows, laughing in ripples on each punchline
    rnd=random.Random(13); aud=[]
    for n,start,step,y0,s,op in [(12,-4,26,318,.5,.6),(9,-8,36,352,.72,.82),(6,-12,56,398,1,1)]:
        for i in range(n):
            x=start+i*step+rnd.uniform(-3,3); y=y0+rnd.uniform(-3,3); d=rnd.choice(['d1','d2','d3','d4'])
            aud.append(fig(x,y,s*rnd.uniform(.95,1.05),torso(rnd.choice(list(HAIR))),op,f'laugh {d}',rnd.uniform(.92,1.08)))
    CSS.append('.venue .laugh { transform-box: fill-box; transform-origin: 50% 100%; animation: laugh 3.5s ease-in-out infinite; } .venue .laugh.d2 { animation-delay: -.12s; } .venue .laugh.d3 { animation-delay: -.25s; } .venue .laugh.d4 { animation-delay: .1s; }')
    seats=''
    return scene('comedy', bg+folds+valance+light+stool+stand+comic+stage+''.join(aud)+seats, defs)

# ---------------- OUTDOOR FESTIVAL ----------------
def festival():
    defs=('<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1128"/><stop offset=".45" stop-color="#1D2750"/><stop offset=".8" stop-color="#B8402F"/><stop offset="1" stop-color="#F2553F"/></linearGradient>'
          '<linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F2553F"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".8"/></linearGradient>')
    bg=f'<rect width="300" height="604" fill="url(#sky)"/>'
    rnd=random.Random(3)
    stars=''.join(f'<circle class="star t{rnd.randint(0,3)}" cx="{rnd.uniform(5,295):.1f}" cy="{rnd.uniform(4,120):.1f}" r="{rnd.uniform(.6,1.4):.1f}" fill="{W}"/>' for _ in range(36))
    CSS.append('.venue .star { animation: star 2s ease-in-out infinite alternate; } .venue .star.t1 { animation-delay: -.5s; } .venue .star.t2 { animation-delay: -1s; } .venue .star.t3 { animation-delay: -1.5s; }')
    # string lights
    wire='M-10 40Q75 82 150 46Q225 10 310 52'
    bulbs=''
    for i in range(15):
        t=i/14; x=-10+320*t
        y=(1-t)**2*40+2*(1-t)*t*(82 if t<.5 else 10)+t*t*52 if False else None
    pts=[(-10,40),(20,55),(50,64),(80,66),(110,60),(140,50),(170,38),(200,30),(230,30),(260,36),(290,46),(310,52)]
    bulbs=''.join(f'<circle class="bulb b{i%2}" cx="{x}" cy="{y+5}" r="2.6" fill="{O if i%3 else W}"/>' for i,(x,y) in enumerate(pts))
    CSS.append('.venue .bulb { animation: bulb 1s steps(2, jump-none) infinite; } .venue .bulb.b1 { animation-delay: -.5s; }')
    lights=f'<path d="M-10 40C40 70 90 74 150 48S260 22 310 52" fill="none" stroke="{N}" stroke-width="1.2"/>'+bulbs
    # distant main stage with truss, LED screen and lasers
    stage=(f'<path d="M50 236V126H250V236" fill="none" stroke="{N}" stroke-width="5"/><rect x="50" y="122" width="200" height="8" fill="{N}"/>'
           f'<rect class="screen" x="92" y="140" width="116" height="62" fill="url(#screen)"/><rect x="40" y="232" width="220" height="22" fill="{N}"/>')
    CSS.append('.venue .screen { animation: screen .5s ease-in-out infinite alternate; }')
    lasers=''.join(f'<path class="laser z{i}" d="M150 130L{x} -10" stroke="{W if i%2 else O}" stroke-width="1.6" opacity=".7"/>' for i,x in enumerate([20,90,210,280]))
    CSS.append('.venue .laser { transform-box: view-box; transform-origin: 150px 130px; animation: laser 2s ease-in-out infinite alternate; } .venue .laser.z1 { animation-delay: -.5s; animation-direction: alternate-reverse; } .venue .laser.z2 { animation-delay: -1s; } .venue .laser.z3 { animation-delay: -1.5s; animation-direction: alternate-reverse; }')
    performer=fig(150,190,.34, jarm('fpf',(19,47),(33,23),(26,-3))+torso('cap',True),cls='p d1')
    CSS.append('.venue .fpf-u { animation: dj-up 1s ease-in-out infinite; transform-origin: 19px 47px; } .venue .fpf-f { animation: dj-fa 1s ease-in-out infinite; }')
    # crowd with a flag and someone on shoulders
    flag=f'<g class="flag"><line x1="98" y1="206" x2="98" y2="300" stroke="{N}" stroke-width="2"/><path class="flag-cloth" d="M98 206C110 200 118 212 132 206V226C118 232 110 220 98 226Z" fill="{O}"/></g>'
    CSS.append('.venue .flag-cloth { transform-box: fill-box; transform-origin: 0 50%; animation: flag 1s ease-in-out infinite alternate; }')
    rows=[(14,-8,23,282,.38,.45),(9,-10,38,304,.6,.75),(5,-6,66,340,.95,1)]
    c=crowd(33,rows,[[('up','r'),('up','l')],[('v','r'),('v','l')],[('up','r')],[('phone','r')],[('pump','r')],[('up','l')]],jump=.3)
    shoulders=fig(150,262,.6, crowd_arm('v','r')+crowd_arm('v','l')+torso('long'),.8,'p d2')
    return scene('festival', bg+stars+lasers+stage+performer+lights+shoulders+flag+f'<g class="crowd">{c}</g>', defs)

# ---------------- GAME DAY (school and league sports, not a pro stadium) ----------------
def gameday():
    defs=('<linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1128"/><stop offset="1" stop-color="#1D2750"/></linearGradient>'
          '<linearGradient id="gbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></linearGradient>'
          '<radialGradient id="gfield"><stop offset="0" stop-color="#2E5A4A"/><stop offset="1" stop-color="#173A33"/></radialGradient>')
    bg='<rect width="300" height="604" fill="url(#gsky)"/>'
    # four light towers: two near, two far, each with a bank of lamps and a soft beam onto the field
    def tower(x,top,h,s,i):
        bank=''.join(f'<circle cx="{x-9*s+c*6*s:.1f}" cy="{top+4*s+r*6*s:.1f}" r="{2.1*s:.1f}" fill="{W}"/>' for r in range(2) for c in range(4))
        beam=f'<path class="gbeam b{i}" d="M{x-14*s:.1f} {top+12*s:.1f}L{x+14*s:.1f} {top+12*s:.1f}L{150+(x-150)*.25+40:.1f} 292L{150+(x-150)*.25-40:.1f} 292Z" fill="url(#gbeam)" opacity=".35"/>'
        return beam+f'<rect x="{x-1.5*s:.1f}" y="{top:.1f}" width="{3*s:.1f}" height="{h:.1f}" fill="{N}"/><rect x="{x-12*s:.1f}" y="{top:.1f}" width="{24*s:.1f}" height="{13*s:.1f}" fill="{N}"/>'+bank
    towers=tower(78,96,150,.75,2)+tower(222,96,150,.75,3)+tower(26,36,230,1,0)+tower(274,36,230,1,1)
    CSS.append('.venue .gbeam { animation: screen 2s ease-in-out infinite alternate; } .venue .gbeam.b1 { animation-delay: -.5s; } .venue .gbeam.b2 { animation-delay: -1s; } .venue .gbeam.b3 { animation-delay: -1.5s; }')
    # small scoreboard (a school one, not a jumbotron)
    board=(f'<rect x="118" y="112" width="64" height="30" fill="{N}" stroke="{O}" stroke-width="1"/><rect x="148.5" y="142" width="3" height="40" fill="{N}"/>'
           f'<text x="134" y="122" font-size="6" fill="{W}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700">HOME</text>'
           f'<text x="166" y="122" font-size="6" fill="{W}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700">GUEST</text>'
           f'<text x="134" y="137" font-size="12" fill="{O}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700">14</text>'
           f'<text x="166" y="137" font-size="12" fill="{O}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700">7</text>')
    # the field, lit from the towers, with a few yard lines
    field=f'<path d="M30 212H270L318 300H-18Z" fill="url(#gfield)"/>'+''.join(f'<path d="M{150+(t-150)*.8:.1f} 212L{150+(t-150)*1.4:.1f} 300" stroke="{W}" stroke-width=".8" opacity=".35"/>' for t in (60,105,150,195,240))
    # two players passing a ball
    pA=fig(100,232,.26, jarm('gpa',(19,47),(34,22),(44,6))+torso('short',True),cls='gp')
    pB=fig(200,232,.26, jarm('gpb',(19,47),(34,22),(44,6))+torso('cap',True),cls='gp',sx=-1)
    CSS.append('.venue .gpa-u, .venue .gpb-u { animation: throw 2s ease-in-out infinite; } .venue .gpb-u { animation-delay: -1s; } .venue .gpa-f, .venue .gpb-f { animation: none; }')
    ball=f'<g class="ballx"><g class="bally"><ellipse cx="111" cy="236" rx="2.8" ry="1.9" fill="{O}"/></g></g>'
    CSS.append('.venue .ballx { animation: ballx 1s ease-in-out infinite alternate; } .venue .bally { animation: bally .5s ease-out infinite alternate; }')
    # concession stand at the end of the bleachers
    stand=(f'<rect x="238" y="256" width="58" height="40" fill="{N}"/><rect x="244" y="268" width="46" height="16" fill="{O}" opacity=".55"/>'
           + ''.join(f'<rect x="{236+i*8.75:.1f}" y="250" width="8.75" height="8" fill="{O if i%2 else W}"/>' for i in range(7))
           + f'<text x="267" y="279" font-size="7" fill="{W}" text-anchor="middle" font-family="Poppins,Arial,sans-serif" font-weight="700">SNACKS</text>')
    # bleachers, fans doing the wave on the 120 BPM grid (4 s, two bars), left to right
    rnd=random.Random(21); fans=[]
    rows=[(10,6,30,330,.5,.6),(7,0,44,392,.72,.8),(5,-4,66,470,.98,1)]
    for r,(n,start,step,y0,sc,op) in enumerate(rows):
        bench=f'<rect x="-10" y="{y0+sc*104:.1f}" width="320" height="{6*sc:.1f}" fill="{LIFT}"/><rect x="-10" y="{y0+sc*104:.1f}" width="320" height="1" fill="{O}" opacity=".5"/>'
        fans.append(bench)
        for i in range(n):
            x=start+i*step+rnd.uniform(-3,3); y=y0+rnd.uniform(-3,3)
            w=min(7,int(max(0,x)/300*8))
            pose=rnd.choice([[('v','r'),('v','l')],[('up','r'),('up','l')],[('pump','r')],[('phone','r')]])
            arms=''.join(crowd_arm(p,sd) for p,sd in pose)
            fans.append(fig(x,y,sc*rnd.uniform(.95,1.05),arms+torso(rnd.choice(list(HAIR)),True),op,f'fan w{w} d{rnd.randint(1,4)}',rnd.uniform(.9,1.1)))
    CSS.append('.venue .fan { transform-box: fill-box; transform-origin: 50% 100%; animation: wave 4s infinite; }' + ''.join(f' .venue .fan.w{k} {{ animation-delay: {-4+k*.25:.2f}s; }}' for k in range(8)))
    return scene('gameday', bg+towers+board+field+pA+pB+ball+stand+''.join(fans), defs)

KEYS='''@keyframes spot { from { transform: rotate(-14deg); } to { transform: rotate(14deg); } }
@keyframes hit { from { transform: rotate(-10deg); } to { transform: rotate(16deg); } }
@keyframes cym { 0% { transform: rotate(-8deg); } 30% { transform: rotate(6deg); } 100% { transform: rotate(0); } }
@keyframes reach { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(10deg); } }
@keyframes strum { from { transform: rotate(-12deg); } to { transform: rotate(10deg); } }
@keyframes lamp { from { transform: rotate(-2.5deg); } to { transform: rotate(2.5deg); } }
@keyframes shake { from { transform: translateY(0); } to { transform: translateY(-6px); } }
@keyframes toast { 0%, 55%, 100% { transform: rotate(0); } 68%, 82% { transform: rotate(-38deg); } }
@keyframes talk { from { transform: rotate(-12deg); } to { transform: rotate(10deg); } }
@keyframes chat { from { transform: rotate(-1.5deg); } to { transform: rotate(1.5deg); } }
@keyframes cone { from { opacity: .7; } to { opacity: 1; } }
@keyframes gesture { from { transform: rotate(-18deg); } to { transform: rotate(22deg); } }
@keyframes laugh { 0%, 8%, 60%, 100% { transform: translateY(0) rotate(0); } 14% { transform: translateY(-4px) rotate(-3deg); } 20% { transform: translateY(0) rotate(0); } 26% { transform: translateY(-3px) rotate(-2deg); } 34% { transform: translateY(0) rotate(0); } }
@keyframes star { from { opacity: .25; } to { opacity: 1; } }
@keyframes bulb { from { opacity: 1; } to { opacity: .35; } }
@keyframes screen { from { opacity: .75; } to { opacity: 1; } }
@keyframes laser { from { transform: rotate(-18deg); } to { transform: rotate(18deg); } }
@keyframes flag { from { transform: skewY(-6deg) scaleX(.94); } to { transform: skewY(6deg) scaleX(1); } }
@keyframes throw { 0%, 40%, 100% { transform: rotate(0); } 15% { transform: rotate(28deg); } 25% { transform: rotate(-34deg); } }
@keyframes ballx { from { transform: translateX(0); } to { transform: translateX(78px); } }
@keyframes bally { from { transform: translateY(0); } to { transform: translateY(-22px); } }
@keyframes wave { 0%, 60%, 100% { transform: translateY(0) scaleY(1); } 12% { transform: translateY(-10px) scaleY(1.04); animation-timing-function: cubic-bezier(.3, 0, .5, 1); } 30% { transform: translateY(-14px) scaleY(1.05); } 48% { transform: translateY(0) scaleY(1); } }'''

if __name__=='__main__':
    # Writes the bundle that hero-venues.js loads: venues-vN.html (all scenes but the club) and venues-vN.css (deduped).
    out=sys.argv[1] if len(sys.argv)>1 else '/home/claude/hero/venues-v2'
    svgs={'live':live(),'lounge':lounge(),'comedy':comedy(),'festival':festival(),'gameday':gameday()}
    open(out+'.html','w').write(''.join(svgs.values())+'\n')
    seen=[]; [seen.append(r) for r in CSS if r not in seen]
    name=out.rsplit('/',1)[-1]
    open(out+'.css','w').write(f'/* DoorPass hero: animations for the concert, members lounge, comedy, festival and game day venues (loaded with {name}.html). Generated by tools/hero/venues.py. */\n'+'\n'.join(seen)+'\n'+KEYS+'\n')
    print({k:len(v) for k,v in svgs.items()}, len(seen))
