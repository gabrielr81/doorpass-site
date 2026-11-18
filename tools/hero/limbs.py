import math
def seg_path(pts, widths):
    """Smooth tapered limb outline through centerline pts with half-widths."""
    L=[];R=[]
    n=len(pts)
    for i,(x,y) in enumerate(pts):
        if i==0: dx,dy=pts[1][0]-x,pts[1][1]-y
        elif i==n-1: dx,dy=x-pts[i-1][0],y-pts[i-1][1]
        else: dx,dy=pts[i+1][0]-pts[i-1][0],pts[i+1][1]-pts[i-1][1]
        d=math.hypot(dx,dy) or 1; nx,ny=-dy/d,dx/d; w=widths[i]
        L.append((x+nx*w,y+ny*w)); R.append((x-nx*w,y-ny*w))
    def smooth(P):
        s=f'{P[0][0]:.1f} {P[0][1]:.1f}'
        for i in range(1,len(P)):
            p0=P[i-2] if i>=2 else P[i-1]; p1=P[i-1]; p2=P[i]; p3=P[i+1] if i+1<len(P) else P[i]
            c1=(p1[0]+(p2[0]-p0[0])/6, p1[1]+(p2[1]-p0[1])/6); c2=(p2[0]-(p3[0]-p1[0])/6, p2[1]-(p3[1]-p1[1])/6)
            s+=f'C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p2[0]:.1f} {p2[1]:.1f}'
        return s
    Rr=R[::-1]
    return 'M'+smooth(L)+'L'+smooth(Rr)[0:].split('C',1)[0]+('C'+smooth(Rr).split('C',1)[1] if 'C' in smooth(Rr) else '')+'Z'
def lerp(a,b,t): return (a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t)
def bend(a,b,amt):
    m=lerp(a,b,.5); dx,dy=b[0]-a[0],b[1]-a[1]; d=math.hypot(dx,dy); return (m[0]-dy/d*amt, m[1]+dx/d*amt)
def arm(S,E,W,cls_u,cls_f,fill,hand='fist'):
    up=seg_path([S,bend(S,E,1.2),E],[6.2,5.4,4.4])
    fa=seg_path([E,bend(E,W,-.8),W],[4.6,3.9,3.0])
    dx,dy=W[0]-E[0],W[1]-E[1]; d=math.hypot(dx,dy); ang=math.degrees(math.atan2(dy,dx))+90
    hx,hy=W[0]+dx/d*4.2,W[1]+dy/d*4.2
    if hand=='fist': h=f'<ellipse cx="{hx:.1f}" cy="{hy:.1f}" rx="4.1" ry="4.9" transform="rotate({ang:.0f} {hx:.1f} {hy:.1f})"/>'
    else: h=(f'<ellipse cx="{hx:.1f}" cy="{hy+0:.1f}" rx="3.6" ry="6" transform="rotate({ang:.0f} {hx:.1f} {hy:.1f})"/>'
             f'<ellipse cx="{hx+ (3.5 if dx>=0 else -3.5):.1f}" cy="{hy+2:.1f}" rx="1.3" ry="3.4" transform="rotate({ang+(-35 if dx>=0 else 35):.0f} {hx:.1f} {hy:.1f})"/>')
    return f'<g class="{cls_u}" fill="{fill}"><path d="{up}"/><g class="{cls_f}"><path d="{fa}"/>{h}</g></g>'
