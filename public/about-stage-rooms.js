(function () {
  function create(options) {
    var THREE = options.THREE;
    var group = options.group;
    var chapters = options.chapters;
    var wash = options.wash;
    var ink = options.ink;
    var paper = options.paper;
    var lineMaterial = options.lineMaterial;
    var addLine = options.addLine;
    var addEdges = options.addEdges;
    var chapterText = options.chapterText;
    var floaters = [];
    var cameraZ = 8;

    function dispose() {
      while (group.children.length) {
        var child = group.children.pop();
        child.traverse(function (node) {
          if (node.geometry && node.geometry.dispose) node.geometry.dispose();
          if (!node.material) return;
          var materials = Array.isArray(node.material) ? node.material : [node.material];
          materials.forEach(function (material) {
            if (material.map && material.map.dispose) material.map.dispose();
            if (material.dispose) material.dispose();
          });
        });
      }
      floaters = [];
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
      var line = '';
      var lines = [];
      Array.from(text || '').forEach(function (char) {
        var test = line + char;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = char;
        } else line = test;
      });
      if (line) lines.push(line);
      lines.slice(0, maxLines).forEach(function (value, index) {
        ctx.fillText(value, x, y + index * lineHeight);
      });
    }

    function textTexture(index) {
      var chapter = chapters[index];
      var canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      var ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(23,24,20,.48)';
      ctx.font = '400 25px Arial, sans-serif';
      ctx.fillText(String(index + 1).padStart(2, '0'), 70, 60);
      ctx.textAlign = 'right';
      ctx.fillText(chapterText(chapter, '.chapter-date'), 1130, 60);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#171814';
      var title = chapterText(chapter, 'h3');
      ctx.font = '400 ' + (title.length > 7 ? 82 : 112) + 'px "Noto Serif SC", Georgia, serif';
      ctx.fillText(title, 70, 168);
      ctx.fillStyle = 'rgba(23,24,20,.64)';
      ctx.font = '400 30px Arial, sans-serif';
      wrapText(ctx, chapterText(chapter, '.chapter-place'), 72, 340, 920, 45, 2);
      ctx.fillStyle = '#' + wash[index].toString(16).padStart(6, '0');
      ctx.fillRect(70, 468, 82, 5);
      ctx.fillStyle = 'rgba(23,24,20,.82)';
      ctx.font = '400 42px "Noto Serif SC", Georgia, serif';
      wrapText(ctx, chapterText(chapter, '.chapter-detail'), 72, 520, 900, 66, 3);
      var texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      return texture;
    }

    function circle(parent, x, y, radius, color, opacity, z) {
      var mesh = new THREE.Mesh(
        new THREE.CircleGeometry(radius, 48),
        new THREE.MeshBasicMaterial({ color: color, transparent: opacity < 1, opacity: opacity, side: THREE.DoubleSide })
      );
      mesh.position.set(x, y, z == null ? 0 : z);
      parent.add(mesh);
      return mesh;
    }

    function box(parent, x, y, z, width, height, depth, color, opacity) {
      var mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        new THREE.MeshBasicMaterial({ color: color, transparent: opacity < 1, opacity: opacity })
      );
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }

    function floating(object, baseY, phase, amount) {
      floaters.push({ object: object, baseY: baseY, phase: phase, amount: amount });
    }

    function motif(index, mobile) {
      var art = new THREE.Group();
      art.position.set(mobile ? 0 : 3.8, mobile ? 6.6 : 4, -9.55);
      art.scale.setScalar(mobile ? .56 : 1);
      group.add(art);
      var accent = wash[index];

      if (index === 0) {
        addEdges(art, new THREE.RingGeometry(1.3, 1.35, 64), lineMaterial(accent,.72));
        addEdges(art, new THREE.RingGeometry(2, 2.05, 64), lineMaterial(ink,.18));
        floating(circle(art,0,0,.5,accent,.22,.05),0,0,.11);
      } else if (index === 1) {
        [[-1.5,.7,.7],[0,1.4,.48],[1.35,.35,.62],[-.65,-.85,.4],[.85,-1.1,.52]].forEach(function(item,i){
          var shape = i%2 ? circle(art,item[0],item[1],item[2],accent,.22,.04) : box(art,item[0],item[1],.02,item[2]*1.5,item[2]*1.5,.18,accent,.22);
          floating(shape,item[1],i*.8,.1+i*.008);
        });
      } else if (index === 2) {
        box(art,0,-.2,0,4.6,3.3,.16,0xf6f2e8,.98);
        for(var row=-2;row<=2;row++) addLine(art,[[-2,row*.5,.1],[2,row*.5,.1]],lineMaterial(ink,.22));
        addLine(art,[[-1.35,-1.35,.12],[-1.35,1.35,.12]],lineMaterial(accent,.72));
        var pencil=box(art,1.7,.15,.28,.14,3.5,.14,accent,.78); pencil.rotation.z=-.28;
      } else if (index === 3) {
        addLine(art,[[-2,-1.5,.1],[2,-1.5,.1],[.4,1.65,.1],[-2,-1.5,.1]],lineMaterial(ink,.48));
        addEdges(art,new THREE.CircleGeometry(1.05,48),lineMaterial(accent,.66),[.45,.1,.12]);
        addLine(art,[[-2.2,0,.13],[2.2,0,.13],[0,1.9,.13],[0,-1.9,.13]],lineMaterial(ink,.18));
      } else if (index === 4) {
        for(var bar=-2;bar<=2;bar++) box(art,bar*.78,-.15,0,.3,2.2+Math.abs(bar)*.45,.22,bar===0?accent:ink,bar===0?.48:.12);
        addLine(art,[[-2.2,1.65,.2],[2.2,1.65,.2]],lineMaterial(ink,.35));
        addEdges(art,new THREE.CircleGeometry(.72,48),lineMaterial(accent,.68),[0,1.65,.22]);
      } else if (index === 5) {
        var wave=[]; for(var p=0;p<70;p++) wave.push([-2.3+p*.067,Math.sin(p*.38)*(.28+p*.006)-.1,.1]);
        addLine(art,wave,lineMaterial(accent,.82));
        [-1.8,-.9,0,.9,1.8].forEach(function(x,i){var node=circle(art,x,Math.sin(i*1.2)*.5,.13,ink,.55,.16);floating(node,node.position.y,i*.55,.055);});
      } else if (index === 6) {
        var nodes=[[-1.8,-1],[-1.3,1.1],[0,.25],[1.15,1.45],[1.9,-.8],[.35,-1.55]];
        [[0,1],[0,2],[1,2],[2,3],[2,4],[2,5],[3,4],[4,5]].forEach(function(pair){addLine(art,[[nodes[pair[0]][0],nodes[pair[0]][1],.08],[nodes[pair[1]][0],nodes[pair[1]][1],.08]],lineMaterial(ink,.24));});
        nodes.forEach(function(n,i){var node=circle(art,n[0],n[1],i===2?.24:.15,i===2?accent:ink,i===2?.72:.5,.16);floating(node,n[1],i*.4,.045);});
      } else {
        for(var r=-1;r<=1;r++) for(var col=-2;col<=2;col++){var block=box(art,col*.82,r*.9,0,.62,.62,.16,(r+col)%3===0?accent:ink,(r+col)%3===0?.38:.09);if((r+col)%2===0)floating(block,block.position.y,(r+2)*(col+3),.04);}
        addEdges(art,new THREE.BoxGeometry(4.7,3.4,.12),lineMaterial(ink,.32));
      }
    }

    function build(index) {
      dispose();
      var mobile = window.innerWidth <= 820;
      group.visible = true;
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(18,24),new THREE.MeshBasicMaterial({color:0xe8e1d3,side:THREE.DoubleSide}));
      floor.rotation.x=-Math.PI/2; floor.position.set(0,0,-2); group.add(floor);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(18,10),new THREE.MeshBasicMaterial({color:paper,side:THREE.DoubleSide}));
      back.position.set(0,5,-10); group.add(back);
      var sideMat = new THREE.MeshBasicMaterial({color:0xf2eee5,side:THREE.DoubleSide});
      var left = new THREE.Mesh(new THREE.PlaneGeometry(24,10),sideMat); left.rotation.y=Math.PI/2; left.position.set(-9,5,-2); group.add(left);
      var right = left.clone(); right.rotation.y=-Math.PI/2; right.position.x=9; group.add(right);
      for(var grid=-8;grid<=8;grid+=2) addLine(group,[[grid,.012,8],[grid,.012,-10]],lineMaterial(ink,.06));
      for(var depth=8;depth>=-10;depth-=2) addLine(group,[[-9,.012,depth],[9,.012,depth]],lineMaterial(ink,.06));
      addLine(group,[[-9,0,-10],[-9,10,-10],[9,10,-10],[9,0,-10]],lineMaterial(ink,.18));
      var width=mobile?5.8:7.8;
      var panel=new THREE.Mesh(new THREE.PlaneGeometry(width,width*.75),new THREE.MeshBasicMaterial({map:textTexture(index),transparent:true,depthWrite:false}));
      panel.position.set(mobile?0:-3.3,mobile?3.7:4.15,-9.72); group.add(panel);
      motif(index,mobile);
      cameraZ=mobile?7.2:8.2;
      return cameraZ;
    }

    function animate(time, pointerX, pointerY, camera, delta) {
      floaters.forEach(function(item,index){
        item.object.position.y=item.baseY+Math.sin(time*.75+item.phase)*item.amount;
        item.object.rotation.z=Math.sin(time*.32+index)*.018;
      });
      var targetX=pointerX*(window.innerWidth<=820?.18:.38);
      var targetY=3.35-pointerY*.16;
      camera.position.x+=(targetX-camera.position.x)*(1-Math.exp(-3.2*delta));
      camera.position.y+=(targetY-camera.position.y)*(1-Math.exp(-3.2*delta));
      camera.position.z+=(cameraZ-camera.position.z)*(1-Math.exp(-4*delta));
      camera.lookAt(pointerX*.45,3.4-pointerY*.28,-9);
    }

    return { build: build, animate: animate, dispose: dispose, getCameraZ: function(){return cameraZ;} };
  }

  window.JourneyStageRooms = { create: create };
})();