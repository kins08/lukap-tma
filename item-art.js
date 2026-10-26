(function () {
  'use strict';

  function mix(hex, target, amount) {
    const a = hex.replace('#', '');
    const b = target.replace('#', '');
    const parse = (value) => [0, 2, 4].map((offset) => parseInt(value.slice(offset, offset + 2), 16));
    const source = parse(a.length === 3 ? a.split('').map((c) => c + c).join('') : a);
    const dest = parse(b.length === 3 ? b.split('').map((c) => c + c).join('') : b);
    const channels = source.map((channel, index) => Math.round(channel + (dest[index] - channel) * amount));
    return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  function brandGlyph(item, size, color) {
    const mark = item.mark || 'wing';
    if (mark === 'slash') {
      return `<g fill="${color}"><path d="M-8 5 L-2 -5 L2 -5 L-4 5Z"/><path d="M1 5 L7 -5 L11 -5 L5 5Z"/><circle cx="9" cy="-7" r="1.6"/></g>`;
    }
    if (mark === 'peak') {
      return `<g fill="${color}"><path d="M-10 5 L-4 -4 L1 2 L4 -5 L11 5Z"/><path d="M-2 -1 L2 -7 L5 -2Z" opacity=".55"/></g>`;
    }
    if (mark === 'orbit') {
      return `<g fill="none" stroke="${color}" stroke-width="1.6"><circle r="6.2"/><ellipse rx="9.4" ry="3.4" transform="rotate(-24)"/></g><circle r="1.7" fill="${color}"/>`;
    }
    if (mark === 'sun') {
      const rays = Array.from({ length: 12 }).map((_, index) => {
        const a = (index / 12) * Math.PI * 2;
        return `<path d="M${(Math.cos(a) * 5.4).toFixed(2)} ${(Math.sin(a) * 5.4).toFixed(2)} L${(Math.cos(a) * 8.2).toFixed(2)} ${(Math.sin(a) * 8.2).toFixed(2)}"/>`;
      }).join('');
      return `<circle r="3.1" fill="${color}"/><g stroke="${color}" stroke-width="1.3" stroke-linecap="round">${rays}</g>`;
    }
    if (mark === 'monogram') {
      return `<rect x="-7.5" y="-7.5" width="15" height="15" rx="1.8" fill="none" stroke="${color}" stroke-width="1.3"/><path d="M-3.8 4.4 L0 -4.6 L3.8 4.4 M-1.9 1 L1.9 1" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>`;
    }
    if (mark === 'bolt') {
      return `<path d="M-2 -8 L-7 1 L-1 1 L-3 8 L7 -2 L1 -2 L4 -8Z" fill="${color}"/>`;
    }
    if (mark === 'diamond') {
      return `<path d="M0 -8 L7 0 L0 8 L-7 0Z" fill="none" stroke="${color}" stroke-width="1.5"/><path d="M0 -4.2 L3.7 0 L0 4.2 L-3.7 0Z" fill="${color}"/>`;
    }
    if (mark === 'arc') {
      return `<path d="M-8.5 4 C-8.5 -5 -3 -8.5 0 -8.5 C4.5 -8.5 8.5 -4.5 8.5 4" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/><circle cx="0" cy="4.4" r="1.5" fill="${color}"/>`;
    }
    if (mark === 'wave') {
      return `<path d="M-9 1 C-5.5 -4.5 -2 4.5 1.5 1 C5 -2.5 7.5 3 9 0.5" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round"/><path d="M-9 5.5 C-5.5 0 -2 9 1.5 5.5 C5 2 7.5 7.5 9 5" fill="none" stroke="${color}" stroke-width="1.3" stroke-linecap="round" opacity=".55"/>`;
    }
    return `<g fill="${color}"><path d="M-11 4 L-1 -6 L3 -2 L-5 5Z"/><path d="M1 4 L11 -6 L14 -3 L5 5Z" opacity=".72"/></g>`;
  }

  function brandLockup(item, x, y, color, options = {}) {
    if (!item.brand) return '';
    const scale = options.scale || 1;
    const word = options.word === false ? '' : `<text x="11" y="2.2" font-family="Manrope, Arial, sans-serif" font-size="5.4" font-weight="800" letter-spacing=".7" fill="${color}">${item.brand}</text>`;
    return `<g transform="translate(${x} ${y}) scale(${scale})">${brandGlyph(item, 1, color)}${word}</g>`;
  }

  function isLightColor(value) {
    const hex = value.replace('#', '');
    const parts = hex.length === 3 ? hex.split('').map((char) => char + char) : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)];
    const [r, g, b] = parts.map((part) => parseInt(part, 16));
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
  }

  let artSerial = 0;

  function safeId(item) {
    return `ia-${item.id}`.replace(/[^a-z0-9-]/gi, '');
  }

  function nextArtId(item) {
    artSerial = (artSerial + 1) % 100000;
    return `${safeId(item)}-${artSerial.toString(36)}`;
  }

  function frame(item, content, artId) {
    const p = item.palette;
    const id = artId || nextArtId(item);
    const accent = p.accent;
    return `
      <svg class="item-art-svg" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="${id}-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fdfaf4"/>
            <stop offset=".6" stop-color="#f8f1e6"/>
            <stop offset="1" stop-color="#eee2d1"/>
          </linearGradient>
          <radialGradient id="${id}-halo" cx="50%" cy="37%" r="66%">
            <stop offset="0" stop-color="${accent}" stop-opacity=".28"/>
            <stop offset=".62" stop-color="${accent}" stop-opacity=".07"/>
            <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
          </radialGradient>
          <linearGradient id="${id}-metal" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="${mix(p.metal, '#ffffff', .32)}"/>
            <stop offset=".5" stop-color="${p.metal}"/>
            <stop offset="1" stop-color="${mix(p.metal, '#000000', .28)}"/>
          </linearGradient>
          <radialGradient id="${id}-floor" cx="50%" cy="50%" r="50%">
            <stop offset="0" stop-color="#5d4732" stop-opacity=".24"/>
            <stop offset=".55" stop-color="#5d4732" stop-opacity=".1"/>
            <stop offset="1" stop-color="#5d4732" stop-opacity="0"/>
          </radialGradient>
          <pattern id="${id}-grain" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.1" r=".5" fill="#6b5641" opacity=".045"/>
            <circle cx="5.2" cy="4.4" r=".35" fill="#ffffff" opacity=".26"/>
          </pattern>
        </defs>
        <rect width="240" height="240" fill="url(#${id}-bg)"/>
        <rect width="240" height="240" fill="url(#${id}-grain)"/>
        <circle cx="120" cy="102" r="102" fill="url(#${id}-halo)"/>
        <path d="M22 194 C62 182 178 182 218 194" fill="none" stroke="#c8b49c" stroke-opacity=".22" stroke-width="1"/>
        <ellipse cx="120" cy="211" rx="78" ry="11" fill="url(#${id}-floor)"/>
        <g>${content}</g>
        ${item.brand ? `<g opacity=".46">${brandLockup(item, 207, 20, '#5f513f', { scale: .62, word: false })}</g>` : ''}
        <rect x="5" y="5" width="230" height="230" rx="16" fill="none" stroke="#d8c8b4" stroke-opacity=".32"/>
        <text x="17" y="227" font-family="Manrope, Arial, sans-serif" font-size="5.2" letter-spacing="1.35" fill="#6b5641" opacity=".38">LUKAP / ${item.brand || item.collection.toUpperCase()}</text>
      </svg>`;
  }

  function topArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const light = mix(main, '#ffffff', .17);
    const dark = mix(main, '#000000', .28);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const cream = '#f0e8db';
    const stitch = `stroke="${light}" stroke-width="1" stroke-dasharray="2 3" fill="none" opacity=".7"`;

    if (item.variant === 'hoodie') {
      return frame(item, `
        <path d="M76 73 C58 82 50 106 48 146 L43 191 C48 201 63 201 68 191 L80 120Z" fill="${main}"/>
        <path d="M164 73 C182 82 190 106 192 146 L197 191 C192 201 177 201 172 191 L160 120Z" fill="${main}"/>
        <path d="M76 72 C90 62 106 59 120 64 C134 59 150 62 164 72 L169 191 C151 205 89 205 71 191Z" fill="${main}"/>
        <path d="M94 68 C94 44 146 44 146 68 C137 79 103 79 94 68Z" fill="${dark}"/>
        <path d="M99 67 C101 51 139 51 141 67 C132 73 108 73 99 67Z" fill="${mix(main, '#000000', .45)}"/>
        <path d="M95 69 C85 78 83 91 89 101 C98 110 142 110 151 101 C157 91 155 78 145 69Z" fill="none" stroke="${light}" stroke-width="2" opacity=".65"/>
        <path d="M84 154 C102 146 138 146 156 154 L156 186 C138 193 102 193 84 186Z" fill="${dark}" opacity=".75"/>
        <path d="M84 154 C102 146 138 146 156 154" fill="none" stroke="${light}" stroke-width="1.5" opacity=".6"/>
        <path d="M102 77 L102 142 M138 77 L138 142" stroke="${cream}" stroke-width="2" opacity=".7"/>
        <circle cx="102" cy="143" r="3" fill="${metal}"/>
        <circle cx="138" cy="143" r="3" fill="${metal}"/>
        <path d="M75 185 C86 191 154 191 165 185" fill="none" stroke="${accent}" stroke-width="7" opacity=".85"/>
        <path d="M84 102 L84 124 M156 102 L156 124" ${stitch}/>
        <path d="M96 96 C106 101 116 103 120 103 C124 103 134 101 144 96" fill="none" stroke="${light}" stroke-width="1.2" opacity=".5"/>
        <path d="M100 52 L120 66 L140 52" fill="none" stroke="${accent}" stroke-width="2" opacity=".8"/>
        <circle cx="120" cy="165" r="9" fill="none" stroke="${accent}" stroke-width="2" opacity=".8"/>
        ${item.brand ? `<g>${brandLockup(item, 120, 166, isLightColor(main) ? accent : cream, { scale: .62 })}</g>` : ''}
      `, id);
    }

    if (item.variant === 'racer') {
      return frame(item, `
        <path d="M76 76 C58 84 52 106 50 146 L46 186 C50 195 63 195 68 186 L80 120Z" fill="${main}"/>
        <path d="M164 76 C182 84 188 106 190 146 L194 186 C190 195 177 195 172 186 L160 120Z" fill="${main}"/>
        <path d="M76 74 C91 64 107 61 120 66 C133 61 149 64 164 74 L168 173 C151 185 89 185 72 173Z" fill="${main}"/>
        <path d="M103 63 L120 83 L137 63 L130 55 L120 68 L110 55Z" fill="${dark}"/>
        <path d="M104 68 L120 86 L136 68" fill="none" stroke="${accent}" stroke-width="3"/>
        <path d="M104 88 L139 164" stroke="${metal}" stroke-width="5"/>
        <path d="M104 88 L139 164" stroke="${light}" stroke-width="1" opacity=".7"/>
        <path d="M76 182 C92 189 148 189 164 182" fill="none" stroke="${accent}" stroke-width="8" opacity=".85"/>
        <path d="M60 122 L48 190 M180 122 L192 190" stroke="${accent}" stroke-width="5" opacity=".85"/>
        <path d="M80 100 L80 126 M160 100 L160 126" ${stitch}/>
        <rect x="86" y="108" width="22" height="14" rx="2" fill="${accent}" opacity=".8"/>
        <path d="M89 111 L105 111 M89 115 L101 115" stroke="${dark}" stroke-width="1.3" opacity=".7"/>
        <circle cx="120" cy="150" r="3" fill="${metal}"/>
      `, id);
    }

    return frame(item, `
      <path d="M74 72 C56 80 48 104 46 146 L41 192 C46 202 62 201 67 191 L79 119Z" fill="${main}"/>
      <path d="M166 72 C184 80 192 104 194 146 L199 192 C194 202 178 201 173 191 L161 119Z" fill="${main}"/>
      <path d="M74 70 C89 60 105 57 120 62 C135 57 151 60 166 70 L171 190 C152 205 88 205 69 190Z" fill="${main}"/>
      <path d="M70 157 C88 166 152 166 170 157 L172 208 C150 220 90 220 68 208Z" fill="${dark}"/>
      <path d="M74 70 C89 60 105 57 120 62 C135 57 151 60 166 70" fill="none" stroke="${light}" stroke-width="2" opacity=".7"/>
      <path d="M108 66 L120 118 L132 66 L126 61 L120 75 L114 61Z" fill="${cream}"/>
      <path d="M108 66 L120 118 L96 132 L86 87 L98 70Z" fill="${accent}" opacity=".92"/>
      <path d="M132 66 L120 118 L144 132 L154 87 L142 70Z" fill="${accent}" opacity=".92"/>
      <path d="M104 62 L120 79 L136 62 L130 54 L120 68 L110 54Z" fill="${cream}"/>
      <path d="M120 79 L120 111 L115 128 L120 139 L125 128 L120 111Z" fill="${detail}"/>
      <path d="M88 78 C97 91 108 101 120 108 C132 101 143 91 152 78" fill="none" stroke="${metal}" stroke-width="2.5"/>
      <path d="M120 108 L113 119 L120 128 L127 119Z" fill="${metal}"/>
      <circle cx="120" cy="139" r="3.2" fill="${metal}"/>
      <circle cx="120" cy="152" r="2.5" fill="${metal}"/>
      <path d="M84 148 L156 148 L156 157 L84 157Z" fill="${dark}"/>
      <rect x="111" y="148" width="18" height="9" rx="2" fill="${metal}"/>
      <path d="M147 93 L159 99 L156 115 L144 109Z" fill="${detail}"/>
      <path d="M73 68 L99 64 L100 72 L74 78Z" fill="${accent}" opacity=".8"/>
      <path d="M167 68 L141 64 L140 72 L166 78Z" fill="${accent}" opacity=".8"/>
      <circle cx="86" cy="71" r="2.4" fill="${metal}"/>
      <circle cx="154" cy="71" r="2.4" fill="${metal}"/>
      <path d="M52 184 L64 184 M176 184 L188 184" stroke="${accent}" stroke-width="5"/>
      <path d="M86 103 L92 127 L86 154 M154 103 L148 127 L154 154" ${stitch}/>
      <path d="M100 178 L140 178 M100 190 L140 190" ${stitch}/>
      <path d="M70 201 C94 211 146 211 170 201" fill="none" stroke="${accent}" stroke-width="2" opacity=".6"/>
      <circle cx="120" cy="202" r="2.5" fill="${metal}"/>
      ${item.brand ? `<g opacity=".9">${brandLockup(item, 136, 89, light, { scale: .52 })}</g>` : ''}
    `, id);
  }

  function bottomArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const light = mix(main, '#ffffff', .18);
    const dark = mix(main, '#000000', .3);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const cargo = item.variant === 'cargo';
    const wide = item.variant === 'wide';
    const stitch = `stroke="${light}" stroke-width="1" stroke-dasharray="2 3" fill="none" opacity=".7"`;
    const leftInner = wide ? 116 : 112;
    const rightInner = wide ? 124 : 128;
    return frame(item, `
      <path d="M78 60 L162 60 L166 82 L74 82Z" fill="${dark}"/>
      <path d="M78 82 L162 82 L164 94 L76 94Z" fill="${main}"/>
      <path d="M76 94 C74 132 70 172 66 210 L98 212 C104 174 108 136 ${leftInner} 98Z" fill="${main}"/>
      <path d="M164 94 C166 132 170 172 174 210 L142 212 C136 174 132 136 ${rightInner} 98Z" fill="${main}"/>
      <path d="M76 94 L164 94" fill="none" stroke="${light}" stroke-width="1.2" opacity=".7"/>
      <path d="M120 94 L120 116" stroke="${dark}" stroke-width="2" opacity=".75"/>
      <path d="M79 96 C92 102 104 104 112 104 M161 96 C148 102 136 104 128 104" fill="none" stroke="${light}" stroke-width="1.2" opacity=".5"/>
      <path d="M84 100 C82 134 78 172 74 199 M156 100 C158 134 162 172 166 199" ${stitch}/>
      <path d="M84 122 C88 153 84 184 80 203 M156 122 C152 153 156 184 160 203" fill="none" stroke="${light}" stroke-width="1" opacity=".35"/>
      <path d="M78 82 L78 94 M104 82 L104 94 M136 82 L136 94 M162 82 L162 94" stroke="${metal}" stroke-width="2.5"/>
      <rect x="108" y="85" width="24" height="7" rx="2" fill="${metal}"/>
      <path d="M74 59 L166 59" stroke="${accent}" stroke-width="3" opacity=".8"/>
      <path d="M84 60 L84 82 M102 60 L102 82" stroke="${light}" stroke-width="1.2" opacity=".5"/>
      <path d="M76 158 L112 158 M128 158 L164 158" stroke="${dark}" stroke-width="1.2" opacity=".55"/>
      <path d="M72 204 L97 204 M143 204 L168 204" stroke="${accent}" stroke-width="4" opacity=".8"/>
      <path d="M85 118 C91 120 98 120 104 119 M136 119 C142 120 149 120 155 118" fill="none" stroke="${light}" stroke-width="1.2" opacity=".5"/>
      <path d="M86 112 L108 112 L106 133 L88 133Z" fill="${dark}" opacity=".65"/>
      <path d="M132 112 L154 112 L152 133 L134 133Z" fill="${dark}" opacity=".65"/>
      <path d="M88 115 L106 115 M134 115 L152 115" stroke="${light}" stroke-width="1" opacity=".55"/>
      <path d="M164 101 C158 111 156 126 160 139" fill="none" stroke="${metal}" stroke-width="2.4"/>
      <circle cx="160" cy="142" r="4" fill="${metal}"/>
      <path d="M78 143 L78 151 M162 143 L162 151" stroke="${light}" stroke-width="1" opacity=".55"/>
      <path d="M102 94 L102 100 L108 100 L108 94" fill="${accent}" opacity=".8"/>
      ${cargo ? `
        <path d="M70 136 L94 136 L92 168 L68 168Z" fill="${main}" stroke="${dark}" stroke-width="1.2"/>
        <path d="M70 136 L94 136 L92 144 L68 144Z" fill="${accent}" opacity=".8"/>
        <rect x="78" y="147" width="9" height="7" rx="1" fill="${metal}"/>
        <path d="M146 136 L170 136 L172 168 L148 168Z" fill="${main}" stroke="${dark}" stroke-width="1.2"/>
        <path d="M146 136 L170 136 L172 144 L148 144Z" fill="${accent}" opacity=".8"/>
        <rect x="153" y="147" width="9" height="7" rx="1" fill="${metal}"/>
      ` : ''}
      ${wide ? `<path d="M70 190 C68 202 70 210 66 218 L98 218 C99 210 104 200 108 190Z" fill="${main}"/><path d="M170 190 C172 202 170 210 174 218 L142 218 C141 210 136 200 132 190Z" fill="${main}"/>` : ''}
      ${item.brand ? `<g opacity=".9">${brandLockup(item, 136, 89, light, { scale: .52 })}</g>` : ''}
    `, id);
  }

  function extendedTopArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const light = mix(main, '#ffffff', .2);
    const dark = mix(main, '#000000', .3);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const cream = '#f0e8db';
    const fit = item.fit || 'regular';
    const oversize = fit === 'oversize';
    const cropped = fit === 'cropped';
    const slim = fit === 'slim';
    const scale = oversize ? 1.12 : slim ? .88 : cropped ? 1.04 : 1;
    const variant = item.variant;
    const hem = cropped ? 154 : 199;
    let content = '';

    if (variant === 'tee' || variant === 'tank' || variant === 'longsleeve') {
      const tank = variant === 'tank';
      const long = variant === 'longsleeve';
      const bodyPath = cropped
        ? 'M86 72 C97 66 108 64 120 66 C132 64 143 66 154 72 L159 148 C146 157 94 157 81 148Z'
        : 'M86 72 C97 66 108 64 120 66 C132 64 143 66 154 72 L165 198 C149 208 91 208 75 198Z';
      const shortL = 'M86 75 C71 79 60 91 53 109 L43 136 C49 144 61 145 68 137 L79 111 L96 87Z';
      const shortR = 'M154 75 C169 79 180 91 187 109 L197 136 C191 144 179 145 172 137 L161 111 L144 87Z';
      const longL = 'M86 75 C70 82 61 101 60 128 L56 190 C56 199 65 204 74 199 L82 190 L85 121 L97 87Z';
      const longR = 'M154 75 C170 82 179 101 180 128 L184 190 C184 199 175 204 166 199 L158 190 L155 121 L143 87Z';
      const sleeves = tank ? '' : long
        ? `<path d="${longL}" fill="${main}"/><path d="${longR}" fill="${main}"/>
           <path d="M57 186 C64 191 72 192 79 188 L81 197 C73 202 64 201 57 196Z" fill="${mix(main, '#000000', .18)}"/>
           <path d="M183 186 C176 191 168 192 161 188 L159 197 C167 202 176 201 183 196Z" fill="${mix(main, '#000000', .18)}"/>
           <path d="M63 100 C67 128 66 158 67 183 M177 100 C173 128 174 158 173 183" stroke="${light}" stroke-width="1" opacity=".35" fill="none"/>`
        : `<path d="${shortL}" fill="${main}"/><path d="${shortR}" fill="${main}"/>
           <path d="M54 130 C61 137 69 138 75 132" stroke="${light}" stroke-width="1.1" opacity=".5" fill="none"/>
           <path d="M186 130 C179 137 171 138 165 132" stroke="${light}" stroke-width="1.1" opacity=".5" fill="none"/>`;
      const tankPath = 'M97 71 C104 82 112 87 120 87 C128 87 136 82 143 71 L154 78 C155 92 149 99 144 103 L156 198 C142 208 98 208 84 198 L96 103 C91 99 85 92 86 78Z';
      const teeBody = tank ? tankPath : bodyPath;
      const neck = tank
        ? `<path d="M96 74 C105 88 111 92 120 92 C129 92 135 88 144 74" fill="none" stroke="${light}" stroke-width="2" opacity=".65"/>
           <path d="M86 80 C89 94 96 102 103 106 M154 80 C151 94 144 102 137 106" fill="none" stroke="${accent}" stroke-width="1.3" opacity=".55"/>`
        : `<path d="M100 69 C106 84 134 84 140 69 C137 90 103 90 100 69Z" fill="${mix(main, '#000000', .3)}" opacity=".72"/>
           <path d="M100 69 C107 84 133 84 140 69" fill="none" stroke="${light}" stroke-width="1.6" opacity=".7"/>`;
      const print = item.brand
        ? `<g opacity=".94">${brandLockup(item, 120, 118, accent, { scale: 1.55 })}</g>
           <path d="M98 131 h44" stroke="${detail}" stroke-width="1.4" opacity=".55"/>
           <path d="M96 126 h10 M134 126 h10" stroke="${accent}" stroke-width="1.2" opacity=".45"/>`
        : item.collection === 'street'
          ? `<path d="M108 112 l5 10 11 2 -8 8 2 11 -10 -5 -10 5 2 -11 -8 -8 11 -2Z" fill="${accent}" opacity=".92"/>
             <path d="M100 146 h40" stroke="${detail}" stroke-width="2" opacity=".55"/>`
          : item.collection === 'muse'
            ? `<path d="M120 110 C114 104 106 108 107 116 C108 124 120 131 120 136 C120 131 132 124 133 116 C134 108 126 104 120 110Z" fill="${accent}" opacity=".8"/>`
            : `<rect x="103" y="111" width="34" height="20" rx="2" fill="${accent}" opacity=".14"/>
               <path d="M108 118 h24 M108 123 h18" stroke="${accent}" stroke-width="1.4" opacity=".8"/>`;
      content = `
        <g transform="translate(120 134) scale(${scale}) translate(-120 -134)">
          ${sleeves}
          <path d="${teeBody}" fill="${main}"/>
          <path d="M88 84 C84 122 84 166 88 192" stroke="${light}" stroke-width="1.1" opacity=".35" fill="none"/>
          <path d="M152 84 C156 122 156 166 152 192" stroke="${dark}" stroke-width="1.2" opacity=".22" fill="none"/>
          ${neck}
          ${print}
          <path d="M78 ${hem - 2} C95 ${hem + 7} 145 ${hem + 7} 162 ${hem - 2}" fill="none" stroke="${light}" stroke-width="1.2" opacity=".55"/>
          <path d="M80 ${hem + 4} C96 ${hem + 12} 144 ${hem + 12} 160 ${hem + 4}" fill="none" stroke="${detail}" stroke-width="2" opacity=".35"/>
          <rect x="86" y="${hem - 12}" width="10" height="5" rx="1" fill="${cream}" opacity=".85"/>
          <path d="M92 88 C88 120 88 158 92 188 M148 88 C152 120 152 158 148 188" stroke="${detail}" stroke-width=".8" opacity=".28" fill="none"/>
        </g>`;
    } else if (variant === 'shirt') {
      const body = 'M82 72 C94 65 107 63 120 66 C133 63 146 65 158 72 L166 211 C150 220 90 220 74 211Z';
      const longL = 'M84 75 C68 82 59 101 58 128 L54 188 C54 197 63 202 72 197 L80 188 L84 121 L96 87Z';
      const longR = 'M156 75 C172 82 181 101 182 128 L186 188 C186 197 177 202 168 197 L160 188 L156 121 L144 87Z';
      const stripes = [94, 104, 114, 124, 134, 144].map((x) => `<path d="M${x} 80 L${x - 2} 207" stroke="${light}" stroke-width=".8" opacity=".13"/>`).join('');
      content = `
        <g transform="translate(120 134) scale(${scale}) translate(-120 -134)">
          <path d="${longL}" fill="${main}"/><path d="${longR}" fill="${main}"/>
          <path d="${body}" fill="${main}"/>
          ${stripes}
          <path d="M86 84 C82 122 82 172 87 207" stroke="${light}" stroke-width="1.1" opacity=".32" fill="none"/>
          <path d="M154 84 C158 122 158 172 153 207" stroke="${dark}" stroke-width="1.2" opacity=".2" fill="none"/>
          <path d="M102 69 L120 91 L138 69 L132 59 L120 77 L108 59Z" fill="${light}" opacity=".95"/>
          <path d="M97 73 L110 60 L120 77 L108 88Z" fill="${accent}" opacity=".82"/>
          <path d="M143 73 L130 60 L120 77 L132 88Z" fill="${accent}" opacity=".82"/>
          <rect x="115" y="82" width="10" height="125" fill="${light}" opacity=".32"/>
          ${[94, 113, 132, 151, 170, 189].map((y) => `<circle cx="120" cy="${y}" r="2.1" fill="${metal}"/>`).join('')}
          <path d="M91 113 h27 v24 l-13 6 -14 -6Z" fill="${main}" stroke="${light}" stroke-width="1" opacity=".9"/>
          <path d="M96 118 h17" stroke="${light}" stroke-width="1.2" opacity=".75"/>
          <path d="M57 184 C64 189 72 190 79 186 L81 195 C73 200 64 199 57 194Z" fill="${mix(main, '#000000', .16)}"/>
          <path d="M183 184 C176 189 168 190 161 186 L159 195 C167 200 176 199 183 194Z" fill="${mix(main, '#000000', .16)}"/>
          <circle cx="69" cy="189" r="1.8" fill="${metal}"/><circle cx="171" cy="189" r="1.8" fill="${metal}"/>
          <path d="M75 207 C98 217 142 217 165 207" fill="none" stroke="${light}" stroke-width="1.4" opacity=".55"/>
          <path d="M88 197 C101 202 139 202 152 197" fill="none" stroke="${detail}" stroke-width=".9" opacity=".3"/>
          <rect x="88" y="194" width="10" height="5" rx="1" fill="${cream}" opacity=".8"/>
        </g>`;
    } else if (variant === 'bomber') {
      const bomberHem = cropped ? 166 : 190;
      const body = `M76 76 C92 64 108 62 120 66 C132 62 148 64 164 76 L171 ${bomberHem} C150 ${bomberHem + 14} 90 ${bomberHem + 14} 69 ${bomberHem}Z`;
      const sleeveL = 'M78 79 C60 86 51 108 49 137 L43 178 C43 189 53 194 63 189 L73 178 L85 116 L99 89Z';
      const sleeveR = 'M162 79 C180 86 189 108 191 137 L197 178 C197 189 187 194 177 189 L167 178 L155 116 L141 89Z';
      content = `
        <g transform="translate(120 132) scale(${scale}) translate(-120 -132)">
          <path d="${sleeveL}" fill="${main}"/><path d="${sleeveR}" fill="${main}"/>
          <path d="${body}" fill="${main}"/>
          <path d="M78 82 C72 112 72 154 78 184" stroke="${light}" stroke-width="1.2" opacity=".35" fill="none"/>
          <path d="M162 82 C168 112 168 154 162 184" stroke="${dark}" stroke-width="1.4" opacity=".22" fill="none"/>
          <path d="M96 71 C103 86 107 91 120 92 C133 91 137 86 144 71" fill="${mix(main, '#000000', .26)}" stroke="${light}" stroke-width="1.2" opacity=".7"/>
          <path d="M118 88 L118 ${bomberHem + 2}" stroke="${metal}" stroke-width="2.4"/>
          <circle cx="118" cy="88" r="2.8" fill="${metal}"/>
          <path d="M91 112 h26 v17 l-13 5 -13 -5Z" fill="${accent}" opacity=".82"/>
          <path d="M95 117 h18 M95 122 h12" stroke="${detail}" stroke-width="1.1" opacity=".55"/>
          <path d="M72 ${bomberHem - 2} C95 ${bomberHem + 8} 145 ${bomberHem + 8} 168 ${bomberHem - 2}" stroke="${mix(main, '#000000', .35)}" stroke-width="7" fill="none" opacity=".6"/>
          <path d="M84 118 C96 110 112 108 122 114 M158 118 C146 110 130 108 120 114" stroke="${light}" stroke-width=".9" opacity=".3" fill="none"/>
          <path d="M57 174 C64 179 72 180 79 176 L81 185 C73 190 64 189 57 184Z" fill="${mix(main, '#000000', .2)}"/>
          <path d="M183 174 C176 179 168 180 161 176 L159 185 C167 190 176 189 183 184Z" fill="${mix(main, '#000000', .2)}"/>
          <rect x="89" y="188" width="10" height="5" rx="1" fill="${cream}" opacity=".85"/>
          <path d="M60 132 L81 136" stroke="${light}" stroke-width="1.1" opacity=".45"/>
          <path d="M180 132 L159 136" stroke="${light}" stroke-width="1.1" opacity=".45"/>
        </g>`;
    } else if (variant === 'vest') {
      const body = 'M98 70 C104 88 112 94 120 94 C128 94 136 88 142 70 L154 78 C154 96 146 104 142 108 L152 207 C138 216 102 216 88 207 L98 108 C94 104 86 96 86 78Z';
      content = `
        <g transform="translate(120 134) scale(${scale}) translate(-120 -134)">
          <path d="${body}" fill="${main}"/>
          <path d="M107 68 L120 92 L133 68 L128 58 L120 75 L112 58Z" fill="${cream}" opacity=".95"/>
          <path d="M103 74 L120 98 L112 122 L94 101Z" fill="${accent}" opacity=".84"/>
          <path d="M137 74 L120 98 L128 122 L146 101Z" fill="${accent}" opacity=".84"/>
          <path d="M120 99 L120 195" stroke="${mix(main, '#000000', .3)}" stroke-width="1.2" opacity=".45"/>
          ${[112, 132, 152, 172].map((y) => `<circle cx="120" cy="${y}" r="2" fill="${metal}"/>`).join('')}
          <path d="M92 118 L118 118 L116 138 L94 138Z" fill="${dark}" opacity=".28"/>
          <path d="M122 118 L148 118 L146 138 L124 138Z" fill="${dark}" opacity=".28"/>
          <path d="M96 123 h17 M126 123 h17" stroke="${light}" stroke-width="1" opacity=".55"/>
          <path d="M86 84 C88 98 94 104 99 108 M154 84 C152 98 146 104 141 108" stroke="${light}" stroke-width="1.6" opacity=".45" fill="none"/>
          <path d="M90 199 C104 207 136 207 150 199" stroke="${light}" stroke-width="1.3" opacity=".5" fill="none"/>
          <rect x="87" y="190" width="10" height="5" rx="1" fill="${cream}" opacity=".8"/>
        </g>`;
    }
    if (item.brand && ['shirt', 'bomber', 'vest'].includes(variant)) {
      content = `${content}<g opacity=".94">${brandLockup(item, variant === 'shirt' ? 96 : 120, 118, accent, { scale: 1.18 })}</g>`;
    }
    return frame(item, content, id);
  }

  function extendedBottomArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const light = mix(main, '#ffffff', .2);
    const dark = mix(main, '#000000', .32);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const fit = item.fit || 'mid';
    const rise = fit === 'low' ? 80 : fit === 'high' ? 58 : 68;
    const variant = item.variant;
    let content = '';

    if (variant === 'flare') {
      content = `
        <path d="M80 ${rise - 8} L160 ${rise - 8} L166 ${rise + 8} L156 ${rise + 17} L151 111 C151 136 158 176 170 216 L118 216 C120 184 122 152 120 124 C118 152 114 184 108 216 L56 216 C68 176 75 136 75 111 L70 ${rise + 17} L68 ${rise + 8}Z" fill="${main}"/>
        <path d="M80 ${rise - 8} L160 ${rise - 8} L160 ${rise + 2} L80 ${rise + 2}Z" fill="${dark}"/>
        <path d="M82 ${rise + 2} L158 ${rise + 2} L156 ${rise + 18} L84 ${rise + 18}Z" fill="${mix(main, '#000000', .18)}"/>
        <path d="M87 ${rise + 4} L87 ${rise + 16} M103 ${rise + 4} L103 ${rise + 16} M137 ${rise + 4} L137 ${rise + 16} M153 ${rise + 4} L153 ${rise + 16}" stroke="${metal}" stroke-width="2"/>
        <path d="M120 86 L120 112" stroke="${dark}" stroke-width="2" opacity=".65"/>
        <path d="M88 94 C84 132 88 176 100 208 M152 94 C156 132 152 176 140 208" stroke="${light}" stroke-width="1.2" opacity=".55" fill="none"/>
        <path d="M92 102 C88 140 92 178 103 208 M148 102 C152 140 148 178 137 208" stroke="${detail}" stroke-width="1" opacity=".28" fill="none"/>
        <path d="M61 210 C88 219 152 219 165 210" fill="none" stroke="${accent}" stroke-width="4" opacity=".6"/>
        <path d="M58 212 C88 221 152 221 168 212" fill="none" stroke="${light}" stroke-width="1" opacity=".45"/>
        <path d="M120 128 L120 210" stroke="${light}" stroke-width="1" opacity=".35"/>
        <rect x="84" y="${rise + 2}" width="8" height="4" rx="1" fill="${accent}" opacity=".8"/>
        <circle cx="120" cy="${rise + 10}" r="2.5" fill="${metal}"/>
      `;
    } else if (variant === 'baggy') {
      content = `
        <path d="M76 ${rise - 6} L164 ${rise - 6} L168 ${rise + 12} L158 ${rise + 22} L164 216 L120 216 C120 178 120 148 120 122 C120 148 120 178 120 216 L76 216 L82 ${rise + 22} L72 ${rise + 12}Z" fill="${main}"/>
        <path d="M76 ${rise - 6} L164 ${rise - 6} L164 ${rise + 4} L76 ${rise + 4}Z" fill="${dark}"/>
        <path d="M79 ${rise + 4} L161 ${rise + 4} L159 ${rise + 15} L81 ${rise + 15}Z" fill="${mix(main, '#000000', .17)}"/>
        <path d="M84 ${rise + 6} L84 ${rise + 13} M104 ${rise + 6} L104 ${rise + 13} M136 ${rise + 6} L136 ${rise + 13} M156 ${rise + 6} L156 ${rise + 13}" stroke="${metal}" stroke-width="2"/>
        <path d="M88 94 C82 134 84 174 92 204 M152 94 C158 134 156 174 148 204" stroke="${light}" stroke-width="1.2" opacity=".48" fill="none"/>
        <path d="M97 166 C111 174 129 174 143 166 M95 185 C110 192 130 192 145 185 M92 201 C108 208 132 208 148 201" fill="none" stroke="${detail}" stroke-width="1.3" opacity=".4"/>
        <path d="M85 110 L111 110 L110 130 L86 130Z" fill="${dark}" opacity=".4"/>
        <path d="M129 110 L155 110 L154 130 L130 130Z" fill="${dark}" opacity=".4"/>
        <path d="M78 207 C91 220 149 220 162 207" fill="none" stroke="${main}" stroke-width="8" opacity=".85"/>
        <path d="M77 211 C92 222 149 222 163 211" fill="none" stroke="${accent}" stroke-width="2" opacity=".6"/>
        <path d="M120 84 L120 110" stroke="${dark}" stroke-width="2" opacity=".6"/>
        <rect x="86" y="${rise + 4}" width="9" height="4" rx="1" fill="${accent}" opacity=".75"/>
        <circle cx="121" cy="${rise + 11}" r="2.4" fill="${metal}"/>
      `;
    } else if (variant === 'parachute') {
      content = `
        <path d="M74 ${rise - 4} L166 ${rise - 4} L171 ${rise + 14} L158 ${rise + 24} L170 202 C156 214 132 216 120 214 C108 216 84 214 70 202 L82 ${rise + 24} L69 ${rise + 14}Z" fill="${main}"/>
        <path d="M74 ${rise - 4} L166 ${rise - 4} L166 ${rise + 6} L74 ${rise + 6}Z" fill="${dark}"/>
        <path d="M77 ${rise + 6} L163 ${rise + 6} L160 ${rise + 18} L80 ${rise + 18}Z" fill="${mix(main, '#000000', .16)}"/>
        <path d="M83 ${rise + 8} L83 ${rise + 16} M101 ${rise + 8} L101 ${rise + 16} M139 ${rise + 8} L139 ${rise + 16} M157 ${rise + 8} L157 ${rise + 16}" stroke="${metal}" stroke-width="2"/>
        <path d="M84 98 C78 138 80 176 70 199 M156 98 C162 138 160 176 170 199" stroke="${light}" stroke-width="1.2" opacity=".5" fill="none"/>
        <path d="M100 103 C96 140 98 176 91 203 M140 103 C144 140 142 176 149 203" stroke="${detail}" stroke-width="1" opacity=".38"/>
        <path d="M70 188 C84 197 102 200 120 198 C138 200 156 197 170 188" fill="none" stroke="${dark}" stroke-width="5" opacity=".55"/>
        <path d="M68 198 C84 207 102 210 120 208 C138 210 156 207 172 198" stroke="${accent}" stroke-width="8" fill="none" opacity=".75"/>
        <path d="M83 120 L106 120 L104 143 L82 143Z" fill="${main}" stroke="${dark}" stroke-width="1"/>
        <path d="M134 120 L157 120 L159 143 L137 143Z" fill="${main}" stroke="${dark}" stroke-width="1"/>
        <path d="M83 120 L106 120 L105 128 L82 128Z" fill="${accent}" opacity=".78"/>
        <path d="M134 120 L157 120 L158 128 L135 128Z" fill="${accent}" opacity=".78"/>
        <rect x="92" y="131" width="8" height="6" rx="1" fill="${metal}"/>
        <rect x="143" y="131" width="8" height="6" rx="1" fill="${metal}"/>
        <path d="M81 205 L74 214 M159 205 L166 214" stroke="${accent}" stroke-width="2"/>
        <circle cx="72" cy="216" r="2" fill="${metal}"/><circle cx="168" cy="216" r="2" fill="${metal}"/>
      `;
    } else if (variant === 'track') {
      content = `
        <path d="M82 ${rise - 4} L158 ${rise - 4} L164 ${rise + 13} L156 ${rise + 22} L146 196 C140 205 132 210 124 211 L116 211 C108 210 100 205 94 196 L76 ${rise + 22} L74 ${rise + 13}Z" fill="${main}"/>
        <path d="M82 ${rise - 4} L158 ${rise - 4} L158 ${rise + 6} L82 ${rise + 6}Z" fill="${dark}"/>
        <path d="M79 ${rise + 6} L161 ${rise + 6} L159 ${rise + 18} L81 ${rise + 18}Z" fill="${mix(main, '#000000', .17)}"/>
        <path d="M91 ${rise + 9} C92 74 92 64 92 58" stroke="${accent}" stroke-width="3" opacity=".7"/>
        <path d="M82 88 C84 64 106 56 120 58 C134 56 156 64 158 88" fill="none" stroke="${accent}" stroke-width="2" opacity=".45"/>
        <path d="M86 96 C84 134 88 166 98 190 M154 96 C156 134 152 166 142 190" stroke="${light}" stroke-width="1.2" opacity=".45" fill="none"/>
        <path d="M84 147 C100 155 140 155 156 147" stroke="${detail}" stroke-width="1" opacity=".32" fill="none"/>
        <path d="M80 198 C86 208 101 213 120 213 C139 213 154 208 160 198" fill="none" stroke="${dark}" stroke-width="9" opacity=".86"/>
        <path d="M83 204 C92 211 105 214 120 214 C135 214 148 211 157 204" stroke="${accent}" stroke-width="2" fill="none" opacity=".65"/>
        <path d="M88 193 L88 199 M152 193 L152 199" stroke="${metal}" stroke-width="2"/>
        <rect x="86" y="${rise + 4}" width="9" height="4" rx="1" fill="${accent}" opacity=".75"/>
        <circle cx="121" cy="${rise + 12}" r="2.3" fill="${metal}"/>
      `;
    } else if (variant === 'skirt') {
      const length = item.length || 'midi';
      const hemY = length === 'mini' ? 148 : length === 'maxi' ? 221 : 186;
      const bottomW = length === 'mini' ? 46 : length === 'maxi' ? 56 : 50;
      const sideL = 120 - bottomW;
      const sideR = 120 + bottomW;
      const cargo = item.cargo ? `
        <path d="M77 ${Math.round((rise + hemY) / 2) - 10} L103 ${Math.round((rise + hemY) / 2) - 10} L100 ${Math.round((rise + hemY) / 2) + 18} L76 ${Math.round((rise + hemY) / 2) + 18}Z" fill="${main}" stroke="${dark}" stroke-width="1"/>
        <path d="M137 ${Math.round((rise + hemY) / 2) - 10} L163 ${Math.round((rise + hemY) / 2) - 10} L164 ${Math.round((rise + hemY) / 2) + 18} L140 ${Math.round((rise + hemY) / 2) + 18}Z" fill="${main}" stroke="${dark}" stroke-width="1"/>
        <path d="M77 ${Math.round((rise + hemY) / 2) - 10} L103 ${Math.round((rise + hemY) / 2) - 10} L102 ${Math.round((rise + hemY) / 2) - 2} L76 ${Math.round((rise + hemY) / 2) - 2}Z" fill="${accent}" opacity=".78"/>
        <path d="M137 ${Math.round((rise + hemY) / 2) - 10} L163 ${Math.round((rise + hemY) / 2) - 10} L163 ${Math.round((rise + hemY) / 2) - 2} L138 ${Math.round((rise + hemY) / 2) - 2}Z" fill="${accent}" opacity=".78"/>
        <rect x="86" y="${Math.round((rise + hemY) / 2) + 5}" width="8" height="6" rx="1" fill="${metal}"/>
        <rect x="146" y="${Math.round((rise + hemY) / 2) + 5}" width="8" height="6" rx="1" fill="${metal}"/>` : '';
      content = `
        <path d="M84 ${rise - 6} L156 ${rise - 6} L163 ${rise + 10} L158 ${rise + 22} L${sideR} ${hemY} C142 ${hemY + 10} 98 ${hemY + 10} ${sideL} ${hemY} L82 ${rise + 22} L77 ${rise + 10}Z" fill="${main}"/>
        <path d="M84 ${rise - 6} L156 ${rise - 6} L156 ${rise + 4} L84 ${rise + 4}Z" fill="${dark}"/>
        <path d="M82 ${rise + 4} L158 ${rise + 4} L156 ${rise + 17} L84 ${rise + 17}Z" fill="${mix(main, '#000000', .16)}"/>
        <path d="M88 ${rise + 6} L88 ${rise + 15} M104 ${rise + 6} L104 ${rise + 15} M136 ${rise + 6} L136 ${rise + 15} M152 ${rise + 6} L152 ${rise + 15}" stroke="${metal}" stroke-width="2"/>
        ${[92, 104, 116, 128, 140, 152].map((x, index) => `<path d="M${120 + (x - 120) * .45} ${rise + 20} L${120 + (x - 120) * 1.15} ${hemY - 4}" stroke="${index % 2 ? light : detail}" stroke-width=".8" opacity="${index % 2 ? '.28' : '.2'}"/>`).join('')}
        <path d="M120 ${rise + 20} L120 ${hemY - 3}" stroke="${dark}" stroke-width="1.1" opacity=".32"/>
        <path d="M136 ${rise + 24} L150 ${hemY - 4}" stroke="${light}" stroke-width="2" opacity=".55"/>
        <path d="M${sideL + 4} ${hemY - 2} C92 ${hemY + 8} 148 ${hemY + 8} ${sideR - 4} ${hemY - 2}" fill="none" stroke="${light}" stroke-width="1.2" opacity=".55"/>
        <path d="M${sideL + 3} ${hemY + 4} C94 ${hemY + 13} 146 ${hemY + 13} ${sideR - 3} ${hemY + 4}" fill="none" stroke="${accent}" stroke-width="2" opacity=".55"/>
        ${cargo}
        <rect x="84" y="${rise + 4}" width="9" height="4" rx="1" fill="${accent}" opacity=".78"/>
        <circle cx="121" cy="${rise + 12}" r="2.3" fill="${metal}"/>
      `;
    } else if (variant === 'jorts') {
      content = `
        <path d="M78 ${rise - 6} L162 ${rise - 6} L166 ${rise + 11} L156 ${rise + 20} L160 151 L126 151 L120 128 L114 151 L80 151 L84 ${rise + 20} L74 ${rise + 11}Z" fill="${main}"/>
        <path d="M78 ${rise - 6} L162 ${rise - 6} L162 ${rise + 4} L78 ${rise + 4}Z" fill="${dark}"/>
        <path d="M81 ${rise + 4} L159 ${rise + 4} L157 ${rise + 16} L83 ${rise + 16}Z" fill="${mix(main, '#000000', .16)}"/>
        <path d="M87 ${rise + 6} L87 ${rise + 14} M105 ${rise + 6} L105 ${rise + 14} M135 ${rise + 6} L135 ${rise + 14} M153 ${rise + 6} L153 ${rise + 14}" stroke="${metal}" stroke-width="2"/>
        <path d="M87 82 C85 110 82 134 79 149 M153 82 C155 110 158 134 161 149" stroke="${light}" stroke-width="1.1" opacity=".45" fill="none"/>
        <path d="M85 149 L92 141 L99 149 L106 142 L113 150 L86 150Z" fill="${main}" opacity=".9"/>
        <path d="M127 150 L134 142 L141 149 L148 141 L155 149 L127 150Z" fill="${main}" opacity=".9"/>
        <path d="M89 149 L95 144 M137 149 L143 143" stroke="${accent}" stroke-width="1" opacity=".7"/>
        <path d="M84 104 L108 104 L107 126 L85 126Z" fill="${dark}" opacity=".4"/>
        <path d="M132 104 L156 104 L155 126 L133 126Z" fill="${dark}" opacity=".4"/>
        <path d="M120 82 L120 112" stroke="${dark}" stroke-width="2" opacity=".65"/>
        <rect x="84" y="${rise + 4}" width="9" height="4" rx="1" fill="${accent}" opacity=".78"/>
        <circle cx="120" cy="${rise + 11}" r="2.3" fill="${metal}"/>
      `;
    } else if (variant === 'wide') {
      content = `
        <path d="M78 ${rise - 6} L162 ${rise - 6} L168 ${rise + 12} L164 ${rise + 22} L174 200 C168 210 154 216 138 216 L120 112 L102 216 C86 216 72 210 66 200 L76 ${rise + 22} L72 ${rise + 12}Z" fill="${main}" stroke="${mix(main, '#000000', .45)}" stroke-width=".7" stroke-opacity=".35"/>
        <path d="M120 112 L138 216 L102 216Z" fill="#5d4732" opacity=".16"/>
        <path d="M104 216 L120 114 L136 216" stroke="${dark}" stroke-width="3.2" fill="none" opacity=".78"/>
        <path d="M68 199 C78 210 88 214 100 216 M140 216 C152 214 162 210 172 199" stroke="${dark}" stroke-width="2.4" fill="none" opacity=".6"/>
        <path d="M70 202 L100 202 M140 202 L170 202" stroke="${accent}" stroke-width="1.5" opacity=".45"/>
        <path d="M80 108 L96 108 L94 132 L81 132Z" fill="${dark}" opacity=".22"/>
        <path d="M144 108 L160 108 L159 132 L146 132Z" fill="${dark}" opacity=".22"/>
        <path d="M83 111 L93 111 M147 111 L157 111" stroke="${light}" stroke-width=".9" opacity=".6"/>
        <path d="M78 ${rise - 6} L162 ${rise - 6} L162 ${rise + 4} L78 ${rise + 4}Z" fill="${dark}"/>
        <path d="M81 ${rise + 4} L159 ${rise + 4} L157 ${rise + 16} L83 ${rise + 16}Z" fill="${mix(main, '#000000', .17)}"/>
        <path d="M87 ${rise + 6} L87 ${rise + 14} M105 ${rise + 6} L105 ${rise + 14} M135 ${rise + 6} L135 ${rise + 14} M153 ${rise + 6} L153 ${rise + 14}" stroke="${metal}" stroke-width="2"/>
        <path d="M120 84 L120 132" stroke="${dark}" stroke-width="2" opacity=".6"/>
        <path d="M88 92 C84 128 86 170 92 204 M152 92 C156 128 154 170 148 204" stroke="${light}" stroke-width="1.2" opacity=".48" fill="none"/>
        <path d="M95 118 C108 124 132 124 145 118 M94 150 C108 157 132 157 146 150 M93 182 C108 189 132 189 147 182" fill="none" stroke="${detail}" stroke-width="1.2" opacity=".36"/>
        <path d="M86 128 C96 134 104 144 106 156 M154 128 C144 134 136 144 134 156" fill="none" stroke="${light}" stroke-width=".9" opacity=".4"/>
        <path d="M78 204 C90 212 108 215 120 214 C132 215 150 212 162 204" stroke="${dark}" stroke-width="8" opacity=".7" fill="none"/>
        <path d="M77 208 C92 217 148 217 163 208" stroke="${accent}" stroke-width="1.6" opacity=".55" fill="none"/>
        <rect x="86" y="${rise + 4}" width="9" height="4" rx="1" fill="${accent}" opacity=".75"/>
        <circle cx="121" cy="${rise + 11}" r="2.3" fill="${metal}"/>
      `;
    }
    if (variant !== 'skirt') {
      const hem = variant === 'jorts' ? 150 : 208;
      content += `
        <g opacity=".62" fill="none" stroke-linecap="round">
          <path d="M95 126 C101 130 107 135 109 143 M143 131 C137 136 133 141 132 149" stroke="${detail}" stroke-width=".8" opacity=".42"/>
          <path d="M92 159 C98 163 104 168 106 176 M146 162 C140 167 137 173 136 181" stroke="${light}" stroke-width=".9" opacity=".42"/>
          <path d="M96 ${hem - 34} C101 ${hem - 31} 105 ${hem - 27} 107 ${hem - 22} M142 ${hem - 30} C137 ${hem - 27} 133 ${hem - 23} 131 ${hem - 18}" stroke="${detail}" stroke-width=".7" opacity=".34"/>
          <path d="M88 ${hem - 4} L108 ${hem - 4} M132 ${hem - 4} L152 ${hem - 4}" stroke="${accent}" stroke-width="1.1" opacity=".32"/>
          <path d="M96 ${hem - 8} L98 ${hem - 4} M142 ${hem - 8} L140 ${hem - 4}" stroke="${dark}" stroke-width="1.4" opacity=".45"/>
        </g>`;
    }
    if (item.brand) {
      content += `<g opacity=".8">${brandLockup(item, 101, rise + 11, accent, { scale: .62, word: false })}</g>`;
    }
    return frame(item, content, id);
  }

  function shoesArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const dark = mix(main, '#000000', .35);
    const light = mix(main, '#ffffff', .2);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const boot = item.variant === 'boot';
    const sneaker = item.variant === 'sneaker';
    if (boot) {
      return frame(item, `
        <path d="M80 47 L144 47 L152 154 L72 158Z" fill="${main}"/>
        <path d="M72 146 C58 160 49 178 52 198 C65 210 145 210 184 196 C190 186 183 172 170 158 L150 146Z" fill="${main}"/>
        <path d="M52 197 C68 207 147 208 184 195 L186 207 C156 219 70 218 50 205Z" fill="${dark}"/>
        <path d="M72 157 C96 163 136 163 154 155" stroke="${light}" stroke-width="2" opacity=".5" fill="none"/>
        <path d="M76 54 L146 54 M78 67 L146 67 M79 80 L144 80" stroke="${light}" stroke-width="1.2" opacity=".55" stroke-dasharray="3 3"/>
        <path d="M150 62 L139 150" stroke="${metal}" stroke-width="5"/>
        <path d="M124 176 C139 173 158 174 174 181 L173 194 C152 198 133 197 119 191Z" fill="${metal}" opacity=".9"/>
        <path d="M72 188 C92 194 123 195 148 190" stroke="${detail}" stroke-width="2" opacity=".7" fill="none"/>
        <path d="M80 47 L144 47" stroke="${accent}" stroke-width="4" opacity=".8"/>
        <path d="M63 205 C102 216 155 213 184 204" stroke="${light}" stroke-width="1" opacity=".35" fill="none" stroke-dasharray="4 3"/>
        <rect x="91" y="104" width="22" height="10" rx="2" fill="${accent}" opacity=".75"/>
        <circle cx="102" cy="109" r="2.3" fill="${metal}"/>
        ${item.brand ? `<g opacity=".9">${brandLockup(item, 112, 122, light, { scale: .55 })}</g>` : ''}
      `, id);
    }
    if (sneaker) {
      const sole = item.sole || 'mid';
      const soleLayers = { low: 1, mid: 2, high: 3, max: 4 }[sole] || 2;
      const soleStack = Array.from({ length: soleLayers }).map((_, index) => `<path d="M44 ${196 + index * 3.4} C84 ${203 + index * 3.4} 168 ${204 + index * 3.4} 206 ${196 + index * 3.4}" fill="none" stroke="${index % 2 ? light : accent}" stroke-width="1.1" opacity="${.5 - index * .08}"/>`).join('');
      const upper = item.upper || 'leather';
      const grain = upper === 'mesh'
        ? Array.from({ length: 16 }).map((_, index) => `<circle cx="${88 + (index % 8) * 7}" cy="${136 + Math.floor(index / 8) * 9}" r=".9" fill="${detail}" opacity=".35"/>`).join('')
        : upper === 'suede' || upper === 'nubuck'
          ? Array.from({ length: 22 }).map((_, index) => `<circle cx="${86 + (index % 11) * 5.4}" cy="${132 + Math.floor(index / 11) * 7 + (index % 2) * 2}" r=".7" fill="${detail}" opacity=".28"/>`).join('')
          : upper === 'canvas'
            ? `<path d="M84 130 L150 170 M88 126 L154 166 M80 136 L146 176" stroke="${detail}" stroke-width=".6" opacity=".28"/>`
            : upper === 'knit'
              ? `<path d="M84 138 C94 132 104 138 114 132 M88 148 C98 142 108 148 118 142 M132 150 C142 144 152 150 162 144" stroke="${detail}" stroke-width=".8" opacity=".3" fill="none"/>`
              : `<path d="M82 140 C94 134 106 136 116 142 M128 146 C140 140 154 142 164 148" stroke="${light}" stroke-width="1" opacity=".42" fill="none"/>`;
      return frame(item, `
        <path d="M74 142 C76 128 86 117 101 114 C110 112 116 116 116 124 L113 151 C99 149 85 152 74 160Z" fill="#efe6d7" opacity=".96"/>
        <path d="M78 137 C85 127 94 122 103 121 M76 145 C85 137 95 133 106 133" stroke="#d3c5b1" stroke-width="1.2" fill="none" opacity=".8"/>
        <path d="M43 177 C68 166 84 152 96 128 L112 133 C128 157 151 168 185 172 C204 174 210 184 206 197 L42 197Z" fill="${main}"/>
        <path d="M42 194 C77 203 164 205 207 195 L208 211 C170 222 76 221 40 209Z" fill="${dark}"/>
        ${soleStack}
        <path d="M64 187 C95 194 167 195 196 187" stroke="${light}" stroke-width="6" opacity=".55" fill="none"/>
        <path d="M90 143 C117 151 145 156 178 160" stroke="${accent}" stroke-width="4" opacity=".85" fill="none"/>
        <path d="M95 126 C105 144 126 157 156 166" stroke="${light}" stroke-width="2" opacity=".6" fill="none"/>
        <path d="M108 143 L120 153 M121 139 L133 149 M135 137 L147 147" stroke="${accent}" stroke-width="2.5"/>
        <path d="M174 170 C188 170 199 177 201 187 L191 191 C184 184 174 181 165 182Z" fill="${metal}" opacity=".9"/>
        <path d="M71 177 C80 168 90 167 98 174 L94 183 L75 186Z" fill="${light}" opacity=".55"/>
        <path d="M40 197 L207 197" stroke="${accent}" stroke-width="2" opacity=".68"/>
        <path d="M42 190 C82 199 168 200 207 190" stroke="${light}" stroke-width="1.3" opacity=".75"/>
        <path d="M44 194 C84 202 166 203 205 194" stroke="${accent}" stroke-width="1" stroke-dasharray="3 2" opacity=".75"/>
        ${grain}
        ${item.brand ? `<g opacity=".92">${brandLockup(item, 128, 160, accent, { scale: 1.15 })}</g>` : ''}
        <circle cx="117" cy="150" r="3" fill="${metal}"/>
      `, id);
    }
    return frame(item, `
      <path d="M50 150 C50 138 56 128 70 124 C84 120 96 125 106 132 C118 141 136 146 155 148 C162 149 166 153 165 158 L54 160 C50 157 49 154 50 150Z" fill="${dark}"/>
      <path d="M46 156 C76 162 137 162 166 156 L167 166 C136 173 72 173 45 166Z" fill="${mix(main, '#000000', .45)}"/>
      <path d="M66 133 C74 128 84 127 92 131 C83 138 73 140 65 137Z" fill="${mix(main, '#000000', .55)}"/>
      <path d="M105 136 C117 142 131 146 147 148" stroke="${light}" stroke-width="1" opacity=".45" fill="none"/>
      <path d="M46 190 C46 178 52 168 66 163 C80 158 94 160 107 166 C119 172 127 180 142 186 C157 192 178 194 194 196 C201 197 205 201 204 207 L50 207 C46 203 45 197 46 190Z" fill="${main}"/>
      <path d="M44 203 C48 215 62 219 82 219 L188 219 C202 218 208 211 206 203Z" fill="${dark}"/>
      <path d="M44 203 C76 209 166 211 206 203" stroke="${mix(main, '#000000', .5)}" stroke-width="3" fill="none"/>
      <path d="M68 174 C70 165 80 160 93 161 C104 162 113 168 116 176 C103 182 83 182 68 174Z" fill="#3c3128" opacity=".9"/>
      <path d="M68 174 C83 182 103 182 116 176 C133 183 155 189 178 192" stroke="${light}" stroke-width="1.4" opacity=".6" fill="none"/>
      <path d="M58 170 C60 181 59 193 56 201" stroke="${mix(main, '#000000', .35)}" stroke-width="1.1" opacity=".55" fill="none"/>
      <path d="M125 178 C133 182 141 185 149 189 L146 199 L121 189Z" fill="${accent}" opacity=".92"/>
      <path d="M130 183 L141 187" stroke="${detail}" stroke-width="2" opacity=".8"/>
      <rect x="132" y="180" width="7" height="5" rx="1" fill="${metal}" transform="rotate(18 135 182)"/>
      <path d="M156 192 C170 197 184 199 198 200" stroke="${light}" stroke-width="1.2" opacity=".5" fill="none"/>
      <path d="M54 207 C92 213 165 214 198 206" stroke="${accent}" stroke-width="1.4" stroke-dasharray="3 2" opacity=".65" fill="none"/>
      <path d="M170 188 C182 190 191 193 197 197" stroke="${mix(main, '#ffffff', .32)}" stroke-width="3" opacity=".45" fill="none"/>
      <path d="M50 150 C50 138 56 128 70 124 C84 120 96 125 106 132 C118 141 136 146 155 148" stroke="${mix(main, '#ffffff', .22)}" stroke-width="1.2" opacity=".4" fill="none"/>
      ${item.brand ? `<g opacity=".88">${brandLockup(item, 120, 188, accent, { scale: .58 })}</g>` : ''}
    `, id);
  }

  function extendedShoesArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const main = p.main;
    const light = mix(main, '#ffffff', .22);
    const dark = mix(main, '#000000', .34);
    const accent = p.accent;
    const detail = p.detail;
    const metal = `url(#${id}-metal)`;
    const variant = item.variant;
    const soleLayers = { low: 1, mid: 2, high: 3, max: 4 }[item.sole || 'mid'] || 2;
    const soleMarks = Array.from({ length: soleLayers }).map((_, index) => `<path d="M51 ${198 + index * 2.6} C90 ${205 + index * 2.6} 166 ${206 + index * 2.6} 200 ${198 + index * 2.6}" fill="none" stroke="${index % 2 ? light : accent}" stroke-width="1" opacity="${.46 - index * .07}"/>`).join('');
    const upperGrain = item.upper === 'mesh'
      ? Array.from({ length: 14 }).map((_, index) => `<circle cx="${96 + (index % 7) * 6.2}" cy="${158 + Math.floor(index / 7) * 8}" r=".8" fill="${detail}" opacity=".32"/>`).join('')
      : item.upper === 'suede' || item.upper === 'nubuck'
        ? Array.from({ length: 20 }).map((_, index) => `<circle cx="${94 + (index % 10) * 5.4}" cy="${154 + Math.floor(index / 10) * 8 + (index % 2) * 2}" r=".65" fill="${detail}" opacity=".26"/>`).join('')
        : item.upper === 'knit'
          ? `<path d="M94 160 C104 154 114 160 124 154 M98 170 C108 164 118 170 128 164 M132 166 C142 160 152 166 162 160" stroke="${detail}" stroke-width=".7" opacity=".28" fill="none"/>`
          : `<path d="M92 162 C104 155 116 157 127 164 M130 168 C142 161 156 163 168 170" stroke="${light}" stroke-width=".9" opacity=".35" fill="none"/>`;
    let content = '';

    if (variant === 'platform') {
      content = `
        <ellipse cx="120" cy="220" rx="86" ry="10" fill="#5d4732" opacity=".12"/>
        <path d="M60 184 C80 168 98 155 116 149 L140 151 C162 167 182 179 200 184 L204 195 L58 196Z" fill="${main}"/>
        <path d="M78 165 C92 154 108 150 122 157 L128 178 L76 180Z" fill="${accent}" opacity=".9"/>
        <path d="M90 163 C104 158 116 159 124 166" fill="none" stroke="${detail}" stroke-width="2" opacity=".55"/>
        <rect x="84" y="169" width="8" height="6" rx="1" fill="${metal}" transform="rotate(-8 88 172)"/>
        <path d="M60 184 C90 191 166 193 200 184" fill="none" stroke="${light}" stroke-width="1.4" opacity=".5"/>
        <path d="M78 180 C96 187 166 189 198 181" fill="none" stroke="${detail}" stroke-width="1" opacity=".3"/>
        <path d="M42 191 L205 191 L209 201 L42 202Z" fill="${dark}"/>
        <path d="M42 201 L209 201 L208 211 C182 220 66 221 40 212Z" fill="${dark}"/>
        <path d="M45 203 C82 212 170 214 206 204" fill="none" stroke="${light}" stroke-width="2.2" opacity=".32"/>
        <path d="M43 208 L207 208" stroke="${accent}" stroke-width="1.4" opacity=".45"/>
        <path d="M54 184 C64 176 72 170 82 166" stroke="${light}" stroke-width="1" opacity=".4" fill="none"/>
        <circle cx="132" cy="169" r="2" fill="${metal}"/>
      `;
    } else if (variant === 'mule') {
      content = `
        <ellipse cx="120" cy="219" rx="82" ry="9" fill="#5d4732" opacity=".12"/>
        <path d="M62 197 C80 181 94 170 112 164 L136 162 C158 177 180 189 198 194 L201 202 L64 203Z" fill="${main}"/>
        <path d="M86 196 L86 178 L102 178 L102 198Z" fill="${dark}"/>
        <path d="M60 202 L84 202 L82 217 L58 217Z" fill="${dark}"/>
        <path d="M88 199 L102 199 L101 215 L87 215Z" fill="${mix(main, '#000000', .16)}"/>
        <path d="M104 167 C112 158 126 158 134 169 C126 177 112 177 104 167Z" fill="${mix(main, '#000000', .25)}"/>
        <path d="M118 162 C126 154 142 156 148 168" fill="none" stroke="${light}" stroke-width="1.2" opacity=".5"/>
        <path d="M158 188 C174 193 188 198 198 201" stroke="${light}" stroke-width="1.5" opacity=".45" fill="none"/>
        <path d="M104 166 L104 195" stroke="${accent}" stroke-width="2" opacity=".7"/>
        <path d="M138 183 C148 176 158 176 164 184 C155 191 146 190 138 183Z" fill="${accent}" opacity=".8"/>
        <path d="M50 202 C88 211 166 212 199 202" stroke="${dark}" stroke-width="3" opacity=".3" fill="none"/>
        <rect x="67" y="186" width="7" height="5" rx="1" fill="${metal}"/>
        <circle cx="152" cy="184" r="2" fill="${metal}"/>
      `;
    } else if (variant === 'ballet') {
      content = `
        <ellipse cx="120" cy="216" rx="84" ry="9" fill="#5d4732" opacity=".1"/>
        <path d="M54 194 C74 181 92 171 110 166 L136 165 C160 176 180 186 198 191 L201 199 L56 200Z" fill="${main}"/>
        <path d="M78 189 C92 178 106 172 120 170" fill="none" stroke="${light}" stroke-width="1.7" opacity=".55"/>
        <path d="M110 172 C120 163 134 162 144 171" fill="none" stroke="${light}" stroke-width="1.3" opacity=".55"/>
        <path d="M128 182 C136 174 146 174 154 182 C145 190 136 190 128 182Z" fill="${accent}" opacity=".88"/>
        <path d="M136 183 L130 199 M146 183 L154 198" stroke="${accent}" stroke-width="2" opacity=".7"/>
        <path d="M154 192 L154 205 M160 192 L162 204" stroke="${metal}" stroke-width="1"/>
        <path d="M50 198 L201 198 L204 205 L49 206Z" fill="${dark}"/>
        <path d="M52 201 C90 208 166 209 201 201" fill="none" stroke="${light}" stroke-width="1.2" opacity=".38"/>
        <path d="M88 189 C104 196 159 198 190 191" fill="none" stroke="${detail}" stroke-width=".9" opacity=".25"/>
        <circle cx="141" cy="181" r="2" fill="${metal}"/>
      `;
    } else if (variant === 'runner') {
      content = `
        <ellipse cx="120" cy="221" rx="88" ry="10" fill="#5d4732" opacity=".14"/>
        <path d="M80 146 C82 131 93 120 109 117 C118 115 124 120 123 129 L119 155 C105 152 92 155 80 163Z" fill="#efe6d7" opacity=".96"/>
        <path d="M84 140 C92 129 102 124 112 124 M82 148 C91 140 102 136 114 136" stroke="#d3c5b1" stroke-width="1.2" fill="none" opacity=".8"/>
        <path d="M46 192 C68 188 88 182 104 166 L126 168 C148 183 172 189 197 190 L203 203 L44 205Z" fill="${dark}"/>
        <path d="M50 184 C70 179 88 171 104 158 L126 162 C146 176 170 182 197 184 L199 193 L48 195Z" fill="${main}"/>
        <path d="M106 163 C122 173 144 179 168 182" stroke="${light}" stroke-width="2" opacity=".55" fill="none"/>
        <path d="M92 172 C104 170 116 170 126 175" stroke="${detail}" stroke-width="2" opacity=".4" fill="none"/>
        <path d="M92 176 L102 186 M103 172 L113 182 M114 169 L124 179 M125 168 L135 178" stroke="${accent}" stroke-width="2.4"/>
        <path d="M146 184 L157 190 L150 198 L139 193Z" fill="${metal}" opacity=".9"/>
        <path d="M158 183 L169 189 L162 197 L151 192Z" fill="${light}" opacity=".8"/>
        <path d="M170 182 L181 188 L174 196 L163 191Z" fill="${accent}" opacity=".9"/>
        <path d="M62 184 C66 172 76 164 88 162 L96 174 L78 190Z" fill="${light}" opacity=".45"/>
        <path d="M45 204 C90 214 168 214 202 203" stroke="${light}" stroke-width="2" opacity=".3" fill="none"/>
        <path d="M48 197 C92 205 166 206 199 197" stroke="${accent}" stroke-width="1.4" opacity=".55" fill="none"/>
        <path d="M47 193 C88 199 164 200 201 193" stroke="${light}" stroke-width="1.1" stroke-dasharray="3 2" opacity=".8"/>
        <path d="M48 200 C90 207 166 208 200 200" stroke="${accent}" stroke-width="1.2" opacity=".7"/>
        ${soleMarks}
        ${upperGrain}
        ${item.brand ? `<g opacity=".92">${brandLockup(item, 112, 174, accent, { scale: 1.05 })}</g>` : ''}
        <path d="M118 158 L118 168 M102 161 L108 170" stroke="${metal}" stroke-width="1"/>
        <circle cx="126" cy="180" r="2.2" fill="${metal}"/>
      `;
    } else if (variant === 'derby') {
      content = `
        <ellipse cx="120" cy="217" rx="82" ry="9" fill="#5d4732" opacity=".11"/>
        <path d="M60 190 C78 178 94 169 110 165 L136 164 C158 175 178 186 194 191 L197 199 L62 200Z" fill="${main}"/>
        <path d="M100 166 C106 155 120 153 130 162 L125 181 L98 179Z" fill="${dark}" opacity=".45"/>
        <path d="M104 165 L114 175 M112 163 L122 173 M120 162 L130 172" stroke="${metal}" stroke-width="1.1"/>
        <path d="M154 184 C164 179 176 180 186 187 C176 193 164 193 154 184Z" fill="${light}" opacity=".35"/>
        <path d="M158 186 C166 183 174 184 180 188" stroke="${detail}" stroke-width="1" opacity=".4" fill="none"/>
        <circle cx="164" cy="187" r="1.2" fill="${detail}" opacity=".6"/>
        <circle cx="172" cy="188" r="1.2" fill="${detail}" opacity=".6"/>
        <path d="M58 198 L197 198 L200 205 L57 206Z" fill="${dark}"/>
        <path d="M61 202 C94 209 166 210 197 202" fill="none" stroke="${light}" stroke-width="1.2" opacity=".35"/>
        <path d="M76 184 C88 174 100 168 112 166" stroke="${light}" stroke-width="1.1" opacity=".4" fill="none"/>
        <path d="M60 206 L78 206 L76 217 L58 217Z" fill="${dark}"/>
        <path d="M84 189 L84 204" stroke="${detail}" stroke-width="1" opacity=".28"/>
        <circle cx="132" cy="181" r="2.2" fill="${metal}"/>
      `;
    }
    if (item.brand && variant !== 'runner') {
      const brandPositions = { platform: [120, 170], mule: [120, 154], ballet: [120, 152], derby: [120, 152] };
      const [brandX, brandY] = brandPositions[variant] || [120, 160];
      content += `<g opacity=".9">${brandLockup(item, brandX, brandY, accent, { scale: .68 })}</g>`;
    }
    return frame(item, content, id);
  }

  function extendedAccessoryArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const metal = `url(#${id}-metal)`;
    const accent = p.accent;
    const detail = p.detail;
    const variant = item.variant;
    const dial = window.itemArtWatchDial || 'classic';
    const strapId = window.itemArtWatchStrap || 'leather';
    const dialConfig = (window.LUKAP_WATCH_DIALS || []).find((entry) => entry.id === dial) || {
      id: 'classic', face: '#f3e7d2', ink: '#2a2520', accent: '#a88855', style: 'classic'
    };
    const strapConfig = (window.LUKAP_WATCH_STRAPS || []).find((entry) => entry.id === strapId) || {
      id: 'leather', color: '#65402d', metalness: 0.04, roughness: 0.62
    };
    const strap = strapConfig.color;
    const strapHi = mix(strap, '#ffffff', .26);
    const strapDark = mix(strap, '#000000', .3);
    const dialColor = dialConfig.face;
    const handColor = dialConfig.ink;
    const dialAccent = dialConfig.accent;
    const style = dialConfig.style;
    const strapOverlay = strapId === 'twotone'
      ? `<path d="M114 34 L126 34 L126 74 L114 74 M114 166 L126 166 L126 206 L114 206" stroke="#c9a45c" stroke-width="5" opacity=".85"/>`
      : strapId === 'nato'
        ? `<path d="M104 40 L136 40 M104 52 L136 52 M104 64 L136 64 M104 176 L136 176 M104 188 L136 188 M104 200 L136 200" stroke="${strapHi}" stroke-width="3" opacity=".55"/>`
        : strapId === 'rubber'
          ? [44, 56, 68, 178, 190].map((y) => `<circle cx="120" cy="${y}" r="1.4" fill="${strapDark}"/>`).join('')
          : strapId === 'suede'
            ? `<path d="M107 38 L107 72 M133 38 L133 72 M107 168 L107 202 M133 168 L133 202" stroke="${strapHi}" stroke-width=".7" stroke-dasharray="2 2" opacity=".55"/>`
            : '';
    let content = '';

    if (variant === 'watch') {
      const ticks = style === 'digital'
        ? ''
        : Array.from({ length: 12 }).map((_, index) => {
          if (style === 'minimal' && index % 3 !== 0) return '';
          const angle = (index / 12) * Math.PI * 2;
          const x = 120 + Math.sin(angle) * 34;
          const y = 120 - Math.cos(angle) * 34;
          const long = index % 3 === 0;
          return `<rect x="${(x - (long ? 1.2 : .8)).toFixed(1)}" y="${(y - (long ? 4 : 2)).toFixed(1)}" width="${long ? 2.4 : 1.6}" height="${long ? 8 : 4}" rx="1" fill="${long ? dialAccent : handColor}" opacity="${long ? '.95' : '.55'}" transform="rotate(${(index / 12) * 360} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
        }).join('');
      const roman = style === 'roman'
        ? `<g font-family="Georgia, serif" font-size="7.2" font-weight="700" fill="${handColor}" text-anchor="middle"><text x="120" y="92">XII</text><text x="151" y="123">III</text><text x="120" y="156">VI</text><text x="89" y="123">IX</text></g>`
        : '';
      const guilloche = style === 'guilloche'
        ? [11, 17, 23, 29, 35].map((r) => `<circle cx="120" cy="120" r="${r}" fill="none" stroke="${mix(dialColor, '#000000', .2)}" stroke-width=".55" opacity=".5"/>`).join('') + Array.from({ length: 12 }).map((_, i) => `<path d="M120 120 L${120 + Math.cos(i * Math.PI / 6) * 40} ${120 + Math.sin(i * Math.PI / 6) * 40}" stroke="${mix(dialColor, '#ffffff', .28)}" stroke-width=".5" opacity=".35"/>`).join('')
        : '';
      const moon = style === 'moon'
        ? `<circle cx="120" cy="140" r="10" fill="${mix(dialColor, '#ffffff', .16)}" stroke="${dialAccent}" stroke-width=".8"/><path d="M118 132 C113 135 112 143 118 148 C111 147 106 141 108 135 C110 130 114 129 118 132Z" fill="${dialAccent}"/><circle cx="126" cy="137" r="1.1" fill="#f5ead8"/><circle cx="124" cy="144" r=".8" fill="#f5ead8"/>`
        : '';
      const gmt = style === 'gmt'
        ? `<circle cx="120" cy="120" r="40" fill="none" stroke="${dialAccent}" stroke-width=".9" opacity=".55"/>${[0, 90, 180, 270].map((angle) => `<path d="M120 120 L120 80" stroke="${angle % 180 ? '#f0e6d3' : dialAccent}" stroke-width=".8" transform="rotate(${angle} 120 120)" opacity=".65"/>`).join('')}`
        : '';
      const skeleton = style === 'skeleton'
        ? `<g fill="none" stroke="${mix(dialAccent, '#ffffff', .2)}" stroke-width=".8" opacity=".75"><circle cx="107" cy="132" r="10"/><circle cx="107" cy="132" r="4"/><circle cx="133" cy="108" r="7"/><circle cx="133" cy="108" r="2.6"/><circle cx="126" cy="138" r="5"/></g><path d="M100 124 L114 138 M128 102 L137 114" stroke="${dialAccent}" stroke-width=".9" opacity=".6"/>`
        : '';
      const panda = style === 'panda'
        ? `<circle cx="104" cy="110" r="10" fill="#232323" stroke="${handColor}" stroke-width="1"/><circle cx="136" cy="110" r="10" fill="#232323" stroke="${handColor}" stroke-width="1"/><circle cx="120" cy="142" r="9" fill="#232323" stroke="${handColor}" stroke-width="1"/>`
        : '';
      const meteorite = style === 'meteorite'
        ? Array.from({ length: 30 }).map((_, index) => {
          const a = (index * 2.399) % (Math.PI * 2);
          const r = 6 + ((index * 7.3) % 34);
          return `<circle cx="${(120 + Math.cos(a) * r).toFixed(1)}" cy="${(120 + Math.sin(a) * r).toFixed(1)}" r="${(.5 + (index % 3) * .35).toFixed(2)}" fill="${index % 3 ? '#2f2a26' : '#d8cdb8'}" opacity=".4"/>`;
        }).join('')
        : '';
      const sunburst = style === 'sunburst'
        ? Array.from({ length: 36 }).map((_, index) => `<path d="M120 120 L${120 + Math.cos(index * Math.PI / 18) * 41} ${120 + Math.sin(index * Math.PI / 18) * 41}" stroke="${mix(dialColor, '#ffffff', .3)}" stroke-width=".55" opacity=".4"/>`).join('')
        : '';
      const subdials = (style === 'chrono')
        ? `<circle cx="104" cy="110" r="9" fill="#242326" stroke="${dialAccent}" stroke-width="1"/><circle cx="136" cy="110" r="9" fill="#242326" stroke="${dialAccent}" stroke-width="1"/><circle cx="120" cy="142" r="9" fill="#242326" stroke="${dialAccent}" stroke-width="1"/>`
        : '';
      const digital = style === 'digital'
        ? `<rect x="100" y="106" width="40" height="22" rx="3" fill="#1d2622"/><rect x="105" y="112" width="22" height="5" rx="1" fill="${dialConfig.ink}" opacity=".95"/><rect x="105" y="120" width="14" height="2.4" rx="1" fill="${dialConfig.ink}" opacity=".55"/><circle cx="134" cy="116" r="2" fill="${dialAccent}" opacity=".8"/>`
        : '';
      const hands = style === 'digital' ? '' : `
        <path d="M120 120 L112 96" stroke="${handColor}" stroke-width="3.3" stroke-linecap="round"/>
        <path d="M120 120 L142 128" stroke="${handColor}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M120 120 L119 88" stroke="${dialAccent}" stroke-width="1.2" stroke-linecap="round"/>
        ${style === 'gmt' ? `<path d="M120 120 L120 86" stroke="#c75542" stroke-width="1.6" stroke-linecap="round"/><path d="M117 87 L120 82 L123 87Z" fill="#c75542"/>` : ''}
        <circle cx="120" cy="120" r="3" fill="${metal}"/><circle cx="120" cy="120" r="1.2" fill="#f5ead8"/>`;
      content = `
        <path d="M98 34 C98 24 106 18 120 18 C134 18 142 24 142 34 L139 77 L101 77Z" fill="${strap}"/>
        <path d="M101 77 L139 77 L137 94 L103 94Z" fill="${strapDark}" opacity=".55"/>
        <path d="M98 206 C98 216 106 222 120 222 C134 222 142 216 142 206 L139 163 L101 163Z" fill="${strap}"/>
        <path d="M101 146 L139 146 L137 163 L103 163Z" fill="${strapDark}" opacity=".55"/>
        <path d="M104 34 L104 74 M136 34 L136 74 M104 206 L104 166 M136 206 L136 166" stroke="${strapHi}" stroke-width="1" stroke-dasharray="2 3" opacity=".65"/>
        ${strapOverlay}
        <rect x="104" y="48" width="32" height="9" rx="3" fill="${metal}" opacity=".55"/><rect x="109" y="50" width="22" height="2" rx="1" fill="#f6ead8" opacity=".6"/>
        <rect x="104" y="183" width="32" height="9" rx="3" fill="${metal}" opacity=".55"/><rect x="109" y="185" width="22" height="2" rx="1" fill="#f6ead8" opacity=".6"/>
        <circle cx="120" cy="120" r="58" fill="${metal}"/>
        <circle cx="120" cy="120" r="53" fill="#2a2520"/>
        <circle cx="120" cy="120" r="47" fill="${metal}"/>
        <circle cx="120" cy="120" r="43" fill="${dialColor}"/>
        <path d="M89 94 C100 78 132 76 151 94" fill="none" stroke="#ffffff" stroke-width="2" opacity=".28"/>
        ${ticks}
        ${roman}
        ${guilloche}
        ${sunburst}
        ${meteorite}
        ${skeleton}
        ${moon}
        ${gmt}
        ${panda}
        ${subdials}
        ${digital}
        ${hands}
        <rect x="175" y="112" width="9" height="16" rx="3" fill="${metal}"/><rect x="178" y="115" width="3" height="10" rx="1" fill="${strapDark}"/>
        ${dial === 'minimal' ? '<circle cx="120" cy="107" r="2" fill="#a88855"/>' : ''}
        <rect x="102" y="154" width="36" height="5" rx="2" fill="${strapDark}" opacity=".4"/>
        <text x="112" y="166" font-family="Manrope, Arial, sans-serif" font-size="4.2" letter-spacing="1.2" fill="${handColor}" opacity=".55">${item.brand || 'LUKAP'}</text>
      `;
    } else if (variant === 'rings') {
      content = `
        <rect x="52" y="126" width="136" height="84" rx="14" fill="#231d19"/>
        <rect x="56" y="130" width="128" height="76" rx="11" fill="none" stroke="#7c6a59" stroke-width="1" opacity=".5"/>
        <ellipse cx="120" cy="210" rx="64" ry="7" fill="#0f0c0a" opacity=".35"/>
        <g transform="rotate(-12 92 166)">
          <ellipse cx="92" cy="166" rx="22" ry="27" fill="none" stroke="${metal}" stroke-width="5"/>
          <ellipse cx="92" cy="166" rx="14" ry="18" fill="none" stroke="${accent}" stroke-width="2" opacity=".8"/>
          <rect x="81" y="143" width="22" height="17" rx="4" fill="${metal}"/>
          <circle cx="92" cy="151" r="4" fill="${detail}" stroke="${accent}" stroke-width="1"/>
          ${item.brand ? `<g opacity=".85">${brandLockup(item, 92, 156, '#f0e3cd', { scale: .32, word: false })}</g>` : ''}
        </g>
        <g transform="rotate(9 128 168)">
          <ellipse cx="128" cy="168" rx="24" ry="30" fill="none" stroke="${metal}" stroke-width="3"/>
          <ellipse cx="128" cy="168" rx="18" ry="24" fill="none" stroke="${lightMetal(p.metal)}" stroke-width="1.2" opacity=".7"/>
          <circle cx="128" cy="143" r="5" fill="${accent}"/>
          <circle cx="128" cy="143" r="2" fill="#fff4e1" opacity=".8"/>
        </g>
        <g transform="rotate(-6 162 174)">
          <ellipse cx="162" cy="174" rx="17" ry="22" fill="none" stroke="${metal}" stroke-width="4"/>
          <circle cx="162" cy="154" r="7" fill="${mix('#f4e7d7', p.metal, .2)}"/>
          <circle cx="159" cy="151" r="2.4" fill="#fffaf1" opacity=".85"/>
        </g>
        <path d="M72 145 l2 -7 7 -2 -7 -2 -2 -7 -2 7 -7 2 7 2Z" fill="${accent}" opacity=".7"/>
        <path d="M176 146 l1.5 -5 5 -1.5 -5 -1.5 -1.5 -5 -1.5 5 -5 1.5 5 1.5Z" fill="${accent}" opacity=".6"/>
        <text x="92" y="203" font-family="Manrope, Arial, sans-serif" font-size="5" letter-spacing="1.4" fill="#d7c6b5" opacity=".55">LK / RINGS</text>
      `;
    } else if (variant === 'chain') {
      content = `
        <rect x="66" y="50" width="108" height="152" rx="13" fill="#f4ecdf"/>
        <rect x="70" y="54" width="100" height="144" rx="10" fill="none" stroke="#d2c1ad" stroke-width="1"/>
        <path d="M82 76 C70 108 82 144 120 166 C158 144 170 108 158 76" fill="none" stroke="${metal}" stroke-width="3"/>
        <path d="M92 74 C82 103 92 130 120 150 C148 130 158 103 148 74" fill="none" stroke="${metal}" stroke-width="1.8" opacity=".8"/>
        <path d="M80 75 L160 75" stroke="${detail}" stroke-width="1" opacity=".25"/>
        <path d="M120 163 L120 185" stroke="${metal}" stroke-width="2"/>
        <path d="M110 184 C110 174 130 174 130 184 C130 195 120 203 120 203 C120 203 110 195 110 184Z" fill="${accent}" opacity=".9"/>
        <circle cx="120" cy="186" r="4" fill="${detail}" stroke="${metal}" stroke-width="1"/>
        <circle cx="82" cy="76" r="3" fill="${metal}"/><circle cx="158" cy="76" r="3" fill="${metal}"/>
        ${item.brand ? `<g opacity=".8">${brandLockup(item, 120, 190, '#f1e2cd', { scale: .3, word: false })}</g>` : ''}
        <path d="M74 88 l2 -6 6 -2 -6 -2 -2 -6 -2 6 -6 2 6 2Z" fill="${accent}" opacity=".65"/>
        <path d="M166 114 l1.4 -4.5 4.5 -1.4 -4.5 -1.4 -1.4 -4.5 -1.4 4.5 -4.5 1.4 4.5 1.4Z" fill="${accent}" opacity=".5"/>
        <text x="92" y="193" font-family="Manrope, Arial, sans-serif" font-size="4.7" letter-spacing="1.3" fill="#7b6856" opacity=".5">LK / CHAIN</text>
      `;
    } else if (variant === 'pearls') {
      const beads = Array.from({ length: 15 }).map((_, index) => {
        const angle = Math.PI * (0.08 + index * 0.06);
        const x = 120 + Math.cos(angle) * 48;
        const y = 90 + Math.sin(angle) * 46;
        const r = index === 7 ? 7 : 4.6;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${mix('#fbf3e7', p.metal, .18)}" stroke="${mix('#cdbba6', p.metal, .4)}" stroke-width=".6"/><circle cx="${(x - 1.5).toFixed(1)}" cy="${(y - 1.8).toFixed(1)}" r="1.2" fill="#fffaf2" opacity=".8"/>`;
      }).join('');
      content = `
        <rect x="66" y="50" width="108" height="152" rx="13" fill="#f4ecdf"/>
        <rect x="70" y="54" width="100" height="144" rx="10" fill="none" stroke="#d2c1ad" stroke-width="1"/>
        <path d="M76 78 C64 112 82 150 120 166 C158 150 176 112 164 78" fill="none" stroke="${metal}" stroke-width="1.4" opacity=".7"/>
        ${beads}
        <circle cx="120" cy="138" r="8" fill="${mix('#fbf3e7', p.metal, .22)}" stroke="${mix('#cdbba6', p.metal, .4)}" stroke-width=".8"/>
        <circle cx="117" cy="135" r="2.2" fill="#fffaf2" opacity=".85"/>
        ${item.brand ? `<g opacity=".7">${brandLockup(item, 120, 141, '#6f5b46', { scale: .26, word: false })}</g>` : ''}
        <circle cx="76" cy="78" r="3" fill="${metal}"/><circle cx="164" cy="78" r="3" fill="${metal}"/>
        <path d="M156 119 l1.5 -5 5 -1.5 -5 -1.5 -1.5 -5 -1.5 5 -5 1.5 5 1.5Z" fill="${accent}" opacity=".65"/>
        <text x="92" y="192" font-family="Manrope, Arial, sans-serif" font-size="4.7" letter-spacing="1.3" fill="#7b6856" opacity=".5">LK / PEARL</text>
      `;
    } else if (variant === 'earrings') {
      content = `
        <rect x="58" y="54" width="124" height="146" rx="13" fill="#f4ecdf"/>
        <rect x="62" y="58" width="116" height="138" rx="10" fill="none" stroke="#d2c1ad" stroke-width="1"/>
        <g>
          <circle cx="94" cy="120" r="30" fill="none" stroke="${metal}" stroke-width="4"/>
          <circle cx="94" cy="120" r="24" fill="none" stroke="${lightMetal(p.metal)}" stroke-width="1" opacity=".6"/>
          <path d="M94 150 C94 160 102 168 112 170" fill="none" stroke="${metal}" stroke-width="2"/>
          <circle cx="115" cy="171" r="6" fill="${accent}"/>
          <circle cx="113" cy="169" r="2" fill="#fff5e5" opacity=".85"/>
        </g>
        <g>
          <circle cx="148" cy="120" r="30" fill="none" stroke="${metal}" stroke-width="4"/>
          <circle cx="148" cy="120" r="24" fill="none" stroke="${lightMetal(p.metal)}" stroke-width="1" opacity=".6"/>
          <path d="M148 150 C148 160 140 168 130 170" fill="none" stroke="${metal}" stroke-width="2"/>
          <circle cx="127" cy="171" r="6" fill="${accent}"/>
          <circle cx="125" cy="169" r="2" fill="#fff5e5" opacity=".85"/>
        </g>
        <circle cx="94" cy="120" r="4" fill="${accent}"/>
        <circle cx="148" cy="120" r="4" fill="${accent}"/>
        ${item.brand ? `<g opacity=".7">${brandLockup(item, 148, 120, '#f5e8d3', { scale: .24, word: false })}</g>` : ''}
        <path d="M112 88 l2 -6 6 -2 -6 -2 -2 -6 -2 6 -6 2 6 2Z" fill="${accent}" opacity=".7"/>
        <path d="M174 102 l1.4 -4.5 4.5 -1.4 -4.5 -1.4 -1.4 -4.5 -1.4 4.5 -4.5 1.4 4.5 1.4Z" fill="${accent}" opacity=".55"/>
        <text x="90" y="192" font-family="Manrope, Arial, sans-serif" font-size="4.7" letter-spacing="1.3" fill="#7b6856" opacity=".5">LK / EARRINGS</text>
      `;
    }
    return frame(item, content, id);
  }

  function lightMetal(value) {
    return mix(value, '#ffffff', .48);
  }

  function hairArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const hair = p.hair;
    const hi = p.hairHi;
    const skin = '#d2a077';
    const skinShadow = '#a8714d';
    const dark = mix(hair, '#000000', .2);
    const variant = item.variant;
    const texture = window.itemArtTexture || 'straight';
    let hairMarkup = '';
    if (variant === 'curls') {
      if (texture === 'curly') {
        hairMarkup = `
          <path d="M72 106 C63 66 91 40 120 40 C152 40 179 66 169 108 C164 126 156 136 148 140 L92 140 C83 131 76 120 72 106Z" fill="${hair}"/>
          ${[[88,76,20],[108,57,21],[132,54,21],[153,66,19],[166,86,17],[74,92,17],[164,106,14],[83,60,15],[146,46,14],[101,44,13],[139,74,16],[75,116,10],[162,119,9],[96,90,14],[143,90,14],[118,50,15],[158,58,11]].map(([x,y,r], index) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 3 === 0 ? mix(hair, hi, .4) : mix(hair, hi, .22)}"/>`).join('')}
          <path d="M88 92 C95 85 105 83 112 89 M130 89 C139 83 149 85 155 93" stroke="${hi}" stroke-width="1.3" opacity=".65" fill="none"/>
          <path d="M80 74 C85 68 92 69 95 75 M110 55 C116 50 122 52 124 58 M140 58 C146 54 151 56 152 62 M157 88 C162 84 166 87 165 92" stroke="${mix(hi, '#ffffff', .3)}" stroke-width="1.1" opacity=".5" fill="none"/>
        `;
      } else {
        hairMarkup = `
          <path d="M78 102 C72 70 94 46 123 46 C153 46 171 72 162 104 C156 98 150 94 145 92 C137 80 126 76 114 79 C102 82 93 90 88 103 C84 103 81 103 78 102Z" fill="${hair}"/>
          <path d="M80 102 C88 106 96 106 102 100 C113 89 125 85 138 89 C148 92 157 100 162 106 C159 116 155 124 148 130 L91 130 C84 121 81 112 80 102Z" fill="${mix(hair, hi, .2)}" opacity=".8"/>
          <path d="M94 72 C105 59 121 53 135 57 C147 60 156 70 160 84" stroke="${hi}" stroke-width="1.5" opacity=".55" fill="none"/>
          <path d="M83 108 C87 121 88 132 86 139" stroke="${hair}" stroke-width="4" opacity=".8" fill="none"/>
        `;
      }
    } else if (variant === 'mohawk') {
      hairMarkup = `
        <path d="M78 102 C79 84 88 70 101 63 C111 58 130 58 140 64 C155 72 163 86 163 103 C156 95 151 88 147 79 C138 86 124 90 109 89 C95 88 85 91 78 102Z" fill="${hair}" opacity=".92"/>
        <path d="M106 77 C108 52 115 34 123 25 C126 45 132 60 130 78 C122 84 113 84 106 77Z" fill="${hair}"/>
        <path d="M111 70 C114 47 118 38 122 32" stroke="${hi}" stroke-width="2" opacity=".65" fill="none"/>
        <path d="M86 115 C92 108 99 105 106 106 M136 106 C143 105 150 108 155 115" stroke="${skinShadow}" stroke-width="1.2" opacity=".55" fill="none"/>
      `;
    } else if (variant === 'crop') {
      hairMarkup = `
        <path d="M80 96 C80 67 97 47 120 47 C145 47 160 68 160 97 C154 94 149 89 145 82 C137 91 124 96 106 96 C98 96 88 96 80 96Z" fill="${hair}"/>
        <path d="M82 97 C93 101 104 102 114 99 C128 95 141 88 150 78 C155 86 158 92 160 97 C145 105 132 111 112 111 C97 111 86 106 78 99Z" fill="${mix(hair, hi, .3)}" opacity=".9"/>
        <path d="M85 74 C91 61 103 52 118 50 M137 51 C150 56 157 68 158 83" stroke="${hi}" stroke-width="1.4" opacity=".6" fill="none"/>
        <path d="M81 106 L81 120 C76 123 73 116 74 108 M159 106 L159 120 C164 123 167 116 166 108" fill="${mix(skin, skinShadow, .25)}"/>
        <path d="M107 97 C112 100 118 101 124 99 C131 97 137 93 142 87" stroke="${dark}" stroke-width="1.2" opacity=".5" fill="none"/>
      `;
    } else if (variant === 'flow') {
      hairMarkup = `
        <path d="M78 102 C70 70 92 44 121 44 C151 44 171 70 162 102 C155 94 149 87 143 81 C131 89 109 90 97 81 C90 88 83 94 78 102Z" fill="${hair}"/>
        <path d="M78 104 C75 124 80 142 89 151 C84 133 86 114 94 97Z" fill="${hair}"/>
        <path d="M162 104 C165 124 160 142 151 151 C156 133 154 114 146 97Z" fill="${hair}"/>
        <path d="M88 53 C107 34 139 34 157 53 C145 51 133 53 122 60 C111 52 98 51 88 53Z" fill="${hi}" opacity=".7"/>
        <path d="M96 80 C110 68 134 68 148 81 C136 84 124 88 116 94 C108 87 102 82 96 80Z" fill="${mix(hair, hi, .22)}" opacity=".75"/>
        <path d="M90 60 C104 46 137 46 153 61 C137 58 123 62 111 72 C103 65 96 61 90 60Z" fill="${hi}" opacity=".4"/>
        <path d="M98 97 C108 91 122 91 134 97" stroke="${hi}" stroke-width="1.2" opacity=".45" fill="none"/>
        <path d="M89 106 C86 121 88 135 94 145 M151 106 C154 121 152 135 146 145" stroke="${dark}" stroke-width="1" opacity=".35" fill="none"/>
      `;
    } else if (variant === 'fade') {
      hairMarkup = `
        <path d="M82 104 C82 76 98 54 120 54 C144 54 158 76 158 104 C154 95 150 87 146 80 C135 86 126 89 119 89 C109 89 98 85 90 79 C87 88 84 96 82 104Z" fill="${hair}"/>
        <path d="M83 102 C85 118 85 126 82 132 C75 126 73 113 75 101Z" fill="${mix(skin, dark, .35)}"/>
        <path d="M157 102 C155 118 155 126 158 132 C165 126 167 113 165 101Z" fill="${mix(skin, dark, .35)}"/>
        <path d="M92 78 C101 64 112 58 122 57 C136 56 146 63 151 80 C143 74 134 71 123 73 C111 75 99 80 92 78Z" fill="${hi}" opacity=".55"/>
        <path d="M96 94 C104 88 113 86 121 89 C130 92 138 98 143 105" stroke="${dark}" stroke-width="1.1" opacity=".5" fill="none"/>
        <path d="M84 104 L84 118 M156 104 L156 118" stroke="${hi}" stroke-width="1" opacity=".35"/>
      `;
    } else if (variant === 'curtain') {
      hairMarkup = `
        <path d="M78 105 C70 73 91 46 120 46 C150 46 170 73 162 105 C156 97 149 91 141 88 L129 70 C125 79 122 85 120 91 C117 85 114 79 111 70 L99 88 C91 91 84 97 78 105Z" fill="${hair}"/>
        <path d="M105 70 C99 87 95 110 91 133 C83 128 80 119 79 108 C84 93 94 80 105 70Z" fill="${hair}"/>
        <path d="M135 70 C141 87 145 110 149 133 C157 128 160 119 161 108 C156 93 146 80 135 70Z" fill="${hair}"/>
        <path d="M118 66 L120 91 L122 66" stroke="${hi}" stroke-width="1.6" opacity=".55" fill="none"/>
        <path d="M92 86 C102 81 111 83 116 90 M148 86 C138 81 129 83 124 90" stroke="${hi}" stroke-width="1.3" opacity=".55" fill="none"/>
        <path d="M103 112 C109 117 115 119 120 118 C127 119 132 117 137 113" stroke="${dark}" stroke-width="1.2" opacity=".45" fill="none"/>
      `;
    } else if (variant === 'bob') {
      hairMarkup = `
        <path d="M76 108 C70 74 90 46 120 46 C150 46 170 74 164 108 L160 146 C154 154 148 158 141 158 L143 106 C134 99 106 99 97 106 L99 158 C92 158 86 154 80 146Z" fill="${hair}"/>
        <path d="M99 83 C106 74 134 74 141 83 C136 92 128 96 120 96 C112 96 104 92 99 83Z" fill="${mix(hair, hi, .28)}" opacity=".9"/>
        <path d="M101 99 C108 94 132 94 139 99 L140 108 C130 103 110 103 100 108Z" fill="${hi}" opacity=".3"/>
        <path d="M78 112 C76 126 77 138 82 147 M162 112 C164 126 163 138 158 147" stroke="${hi}" stroke-width="1.2" opacity=".35" fill="none"/>
        <path d="M120 96 L120 108" stroke="${dark}" stroke-width="1.2" opacity=".45"/>
        <path d="M88 128 C95 133 103 135 110 133 M152 128 C145 133 137 135 130 133" stroke="${dark}" stroke-width="1" opacity=".35" fill="none"/>
      `;
    } else if (variant === 'pixie') {
      hairMarkup = `
        <path d="M80 98 C80 68 96 47 120 47 C146 47 161 69 159 96 C153 91 147 86 142 80 C132 88 120 92 106 91 C96 90 88 93 80 98Z" fill="${hair}"/>
        <path d="M82 96 C92 101 102 103 113 100 C129 96 144 88 154 78 C159 85 161 92 160 99 C146 106 132 110 114 110 C100 110 88 105 80 98Z" fill="${mix(hair, hi, .24)}" opacity=".85"/>
        <path d="M86 74 C94 60 107 52 121 50 M137 51 C149 57 156 68 158 82" stroke="${hi}" stroke-width="1.2" opacity=".55" fill="none"/>
        <path d="M81 100 L81 114 C76 117 73 111 74 102 M159 100 L159 114 C164 117 167 111 166 102" fill="${mix(skin, dark, .22)}"/>
        <path d="M92 92 C102 96 112 97 122 94 M128 94 C138 96 146 93 152 88" stroke="${dark}" stroke-width="1" opacity=".4" fill="none"/>
        <path d="M103 104 C110 108 118 109 126 106" stroke="${dark}" stroke-width="1" opacity=".35" fill="none"/>
      `;
    } else if (variant === 'mullet') {
      hairMarkup = `
        <path d="M78 100 C77 70 96 46 120 46 C145 46 163 71 161 100 L167 160 C159 167 151 166 147 155 L146 102 L94 102 L93 155 C89 166 81 167 73 160Z" fill="${hair}"/>
        <path d="M80 96 C88 102 98 104 108 101 C122 97 140 89 154 79 C158 86 160 93 160 100 C146 107 132 111 114 111 C100 111 88 106 80 99Z" fill="${mix(hair, hi, .24)}" opacity=".85"/>
        <path d="M75 145 C80 153 85 158 92 160 M165 145 C160 153 155 158 148 160" stroke="${hi}" stroke-width="1.1" opacity=".4" fill="none"/>
        <path d="M84 78 C94 61 108 53 124 51" stroke="${hi}" stroke-width="1.3" opacity=".5" fill="none"/>
        <path d="M94 108 C104 113 117 115 128 112" stroke="${dark}" stroke-width="1" opacity=".4" fill="none"/>
        <path d="M81 101 L81 116 C76 119 73 112 74 104 M159 101 L159 116 C164 119 167 112 166 104" fill="${mix(skin, dark, .25)}"/>
      `;
    } else if (variant === 'wolf') {
      hairMarkup = `
        <path d="M76 108 C68 73 90 46 121 46 C152 46 172 73 164 108 L169 150 C160 160 152 160 146 150 L148 104 L92 104 L94 150 C88 160 80 160 71 150Z" fill="${hair}"/>
        <path d="M80 96 C88 103 99 106 110 102 C124 98 140 89 155 77 C160 85 163 93 162 101 C149 108 134 114 115 114 C100 114 87 108 79 99Z" fill="${mix(hair, hi, .25)}" opacity=".9"/>
        <path d="M96 80 C106 67 120 60 135 59 C147 62 155 71 159 83" stroke="${hi}" stroke-width="1.2" opacity=".5" fill="none"/>
        <path d="M94 109 C104 114 116 116 127 112 M114 121 C122 125 131 125 138 121" stroke="${dark}" stroke-width="1" opacity=".38" fill="none"/>
        <path d="M72 144 C78 155 85 160 94 162 M168 144 C162 155 155 160 146 162" stroke="${hair}" stroke-width="6" opacity=".85" fill="none"/>
        <path d="M80 100 L80 116 C75 119 72 112 73 104 M160 100 L160 116 C165 119 168 112 167 104" fill="${mix(skin, dark, .25)}"/>
      `;
    } else {
      hairMarkup = `
        <path d="M78 102 C72 70 94 46 123 46 C153 46 171 72 162 104 C157 98 151 94 145 92 C137 80 126 76 114 79 C102 82 93 90 88 103 C84 103 81 103 78 102Z" fill="${hair}"/>
        <path d="M80 102 C88 106 96 106 102 100 C113 89 125 85 138 89 C148 92 157 100 162 106 C159 116 155 124 148 130 L91 130 C84 121 81 112 80 102Z" fill="${mix(hair, hi, .2)}" opacity=".8"/>
        <path d="M94 72 C105 59 121 53 135 57 C147 60 156 70 160 84" stroke="${hi}" stroke-width="1.5" opacity=".55" fill="none"/>
        <path d="M102 94 C115 87 129 89 140 99" stroke="${hi}" stroke-width="1.3" opacity=".5" fill="none"/>
        <path d="M83 108 C87 121 88 132 86 139" stroke="${hair}" stroke-width="4" opacity=".8" fill="none"/>
      `;
    }
    const textureMarkup = texture === 'curly'
      ? `
        <g>
          ${[
            [78, 108, 7], [76, 94, 9], [80, 80, 10], [88, 66, 11], [100, 56, 12],
            [114, 50, 13], [128, 50, 12], [142, 56, 11], [153, 68, 10], [159, 82, 9],
            [162, 97, 8], [160, 112, 7], [154, 125, 6], [146, 133, 5],
            [86, 119, 5], [94, 128, 4.5], [134, 135, 5], [128, 128, 4.5],
            [96, 76, 7], [108, 68, 8], [122, 64, 8], [136, 68, 7], [146, 78, 6],
            [82, 103, 6], [158, 103, 6], [90, 88, 7], [150, 88, 7]
          ].map(([x, y, r], index) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 4 === 0 ? hi : hair}" opacity="${index % 3 === 0 ? '.72' : '.96'}"/>`).join('')}
          ${[
            [86, 72, 4.4], [102, 61, 4.6], [119, 55, 4.8], [137, 60, 4.4], [152, 72, 4],
            [81, 91, 3.6], [160, 91, 3.4], [94, 80, 3.8], [145, 80, 3.6],
            [88, 112, 3.2], [154, 114, 3], [101, 49, 3.2], [136, 49, 3]
          ].map(([x, y, r], index) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${index % 2 ? hi : mix(hair, hi, .42)}" opacity="${index % 2 ? '.66' : '.78'}"/>`).join('')}
          <path d="M83 86 C78 97 83 108 78 119 M96 69 C91 80 97 90 92 101 M113 58 C107 70 113 81 108 92 M132 58 C138 70 132 82 138 93 M148 69 C154 81 148 93 153 105" stroke="${hi}" stroke-width="1.25" opacity=".48" fill="none"/>
          <path d="M87 75 C91 71 96 72 98 77 M121 54 C126 50 131 52 132 57 M150 85 C155 82 159 85 158 90" stroke="${mix(hi, '#ffffff', .35)}" stroke-width="1" opacity=".5" fill="none"/>
        </g>`
      : texture === 'wavy'
        ? `<path d="M84 72 C78 82 88 92 82 104 M100 56 C94 68 104 80 98 92 M118 50 C112 64 122 76 116 88 M138 54 C132 68 142 80 136 92 M154 70 C148 82 158 94 152 106" stroke="${hi}" stroke-width="1.3" opacity=".65" fill="none"/><path d="M82 106 C78 118 86 128 82 138 M158 106 C162 118 154 128 158 138" stroke="${dark}" stroke-width="1" opacity=".35" fill="none"/>`
        : `<path d="M92 60 C88 78 86 96 84 114 M108 52 C104 72 102 92 100 110 M134 54 C138 74 140 94 142 112 M152 68 C156 84 158 100 160 118" stroke="${hi}" stroke-width="1.2" opacity=".5" fill="none"/><path d="M116 55 C114 74 114 94 114 108 M126 57 C128 76 128 94 128 108" stroke="${hair}" stroke-width="1" opacity=".4" fill="none"/>`;
    return frame(item, `
      <path d="M86 240 C88 198 99 178 120 178 C141 178 152 198 154 240Z" fill="#f1e8da"/>
      <path d="M104 151 L104 187 C104 195 113 201 120 201 C127 201 136 195 136 187 L136 151Z" fill="${skin}"/>
      <ellipse cx="120" cy="108" rx="45" ry="53" fill="${skin}"/>
      <ellipse cx="76" cy="113" rx="9" ry="15" fill="${skin}"/>
      <ellipse cx="164" cy="113" rx="9" ry="15" fill="${skin}"/>
      <path d="M86 194 C98 186 108 182 120 182 C132 182 142 186 154 194" fill="none" stroke="${skinShadow}" stroke-width="1" opacity=".45"/>
      ${hairMarkup}
      ${textureMarkup}
    `, id);
  }

  function accessoryArt(item) {
    const p = item.palette;
    const id = nextArtId(item);
    const metal = `url(#${id}-metal)`;
    const accent = p.accent;
    const detail = p.detail;
    if (item.variant === 'visor') {
      return frame(item, `
        <path d="M50 100 C84 82 156 82 190 100 L184 134 C154 147 86 147 56 134Z" fill="#211c19"/>
        <path d="M58 104 C88 91 152 91 182 104 L178 122 C150 132 90 132 62 122Z" fill="${mix(p.main, '#000000', .35)}"/>
        <path d="M50 100 C84 82 156 82 190 100" stroke="${metal}" stroke-width="5"/>
        <path d="M56 130 C90 141 150 141 184 130" stroke="${detail}" stroke-width="4" opacity=".9"/>
        <path d="M64 97 L48 78 M176 97 L192 78" stroke="${metal}" stroke-width="5" stroke-linecap="round"/>
        <path d="M64 78 L48 78 M176 78 L192 78" stroke="${metal}" stroke-width="3" opacity=".7"/>
        <path d="M80 112 C100 106 122 106 140 112" stroke="${accent}" stroke-width="1.2" opacity=".6" fill="none"/>
        <path d="M170 101 C187 111 195 131 193 156" fill="none" stroke="${metal}" stroke-width="2"/>
        <circle cx="193" cy="159" r="4" fill="${detail}"/>
        ${item.brand ? `<g opacity=".9">${brandLockup(item, 158, 140, accent, { scale: .55 })}</g>` : ''}
      `, id);
    }
    if (item.variant === 'glasses' && item.shape === 'rect') {
      return frame(item, `
        <path d="M54 94 C54 86 60 82 68 82 L104 82 C112 82 118 88 118 96 L116 118 C115 128 108 134 98 134 L72 134 C61 134 55 127 55 117Z" fill="#211b18"/>
        <path d="M122 94 C122 86 128 82 136 82 L172 82 C181 82 186 88 186 96 L185 117 C185 127 178 134 167 134 L141 134 C131 134 124 128 123 118Z" fill="#211b18"/>
        <path d="M54 94 C54 86 60 82 68 82 L104 82 C112 82 118 88 118 96 L116 118 C115 128 108 134 98 134 L72 134 C61 134 55 127 55 117Z" fill="none" stroke="${metal}" stroke-width="4.2"/>
        <path d="M122 94 C122 86 128 82 136 82 L172 82 C181 82 186 88 186 96 L185 117 C185 127 178 134 167 134 L141 134 C131 134 124 128 123 118Z" fill="none" stroke="${metal}" stroke-width="4.2"/>
        <path d="M116 102 C118 98 122 98 124 102" fill="none" stroke="${metal}" stroke-width="3.4"/>
        <path d="M55 97 L41 92 M186 97 L200 92" stroke="${metal}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M64 90 C74 86 88 86 101 90" stroke="${accent}" stroke-width="1.5" opacity=".5" fill="none"/>
        <path d="M132 90 C146 86 160 86 174 90" stroke="${accent}" stroke-width="1.5" opacity=".5" fill="none"/>
        <path d="M73 102 L98 102" stroke="#7b8f95" stroke-width="1" opacity=".25"/>
        <path d="M130 102 L160 102" stroke="#7b8f95" stroke-width="1" opacity=".25"/>
        ${item.brand ? `<g transform="rotate(-16 178 150)">${brandLockup(item, 170, 150, accent, { scale: .55 })}</g>` : ''}
      `, id);
    }
    if (item.variant === 'glasses' && item.shape === 'cat') {
      return frame(item, `
        <path d="M52 112 C54 96 66 84 84 84 C104 84 116 96 118 112 C109 126 92 134 74 130 C61 127 53 121 52 112Z" fill="#211b18"/>
        <path d="M122 112 C124 96 136 84 154 84 C174 84 186 96 188 112 C187 121 178 127 164 130 C146 134 130 126 122 112Z" fill="#211b18"/>
        <path d="M52 112 C54 96 66 84 84 84 C104 84 116 96 118 112 C109 126 92 134 74 130 C61 127 53 121 52 112Z" fill="none" stroke="${metal}" stroke-width="4.2"/>
        <path d="M122 112 C124 96 136 84 154 84 C174 84 186 96 188 112 C187 121 178 127 164 130 C146 134 130 126 122 112Z" fill="none" stroke="${metal}" stroke-width="4.2"/>
        <path d="M116 104 C118 100 122 100 124 104" fill="none" stroke="${metal}" stroke-width="3.4"/>
        <path d="M52 112 L39 126 M188 112 L201 126" stroke="${metal}" stroke-width="3.2" stroke-linecap="round"/>
        <path d="M57 110 C54 103 56 96 63 90 M183 110 C186 103 184 96 177 90" stroke="${accent}" stroke-width="1.4" opacity=".55" fill="none"/>
        <path d="M65 101 C76 96 88 97 98 104 M132 104 C143 97 155 96 166 101" stroke="${accent}" stroke-width="1.2" opacity=".45" fill="none"/>
        <path d="M72 111 C82 108 94 109 104 114 M134 114 C145 109 156 108 168 111" stroke="#7b8f95" stroke-width="1" opacity=".22" fill="none"/>
        ${item.brand ? `<g transform="rotate(-16 178 152)">${brandLockup(item, 170, 152, accent, { scale: .55 })}</g>` : ''}
      `, id);
    }
    const gold = item.variant === 'gold';
    return frame(item, `
      <path d="M60 110 C60 86 75 68 99 68 C123 68 138 86 138 110 C138 134 123 152 99 152 C75 152 60 134 60 110Z" fill="#211b18"/>
      <path d="M102 110 C102 86 117 68 141 68 C165 68 180 86 180 110 C180 134 165 152 141 152 C117 152 102 134 102 110Z" fill="#211b18"/>
      <path d="M60 110 C60 86 75 68 99 68 C123 68 138 86 138 110 C138 134 123 152 99 152 C75 152 60 134 60 110Z" fill="none" stroke="${metal}" stroke-width="6"/>
      <path d="M102 110 C102 86 117 68 141 68 C165 68 180 86 180 110 C180 134 165 152 141 152 C117 152 102 134 102 110Z" fill="none" stroke="${metal}" stroke-width="6"/>
      <path d="M137 104 C139 98 146 98 149 104" stroke="${metal}" stroke-width="4" fill="none"/>
      <path d="M60 104 L45 100 M180 104 L195 100" stroke="${metal}" stroke-width="5" stroke-linecap="round"/>
      <path d="M74 84 C84 77 96 78 105 87" stroke="${accent}" stroke-width="2" opacity=".55" fill="none"/>
      <path d="M118 85 C129 78 142 79 151 88" stroke="${accent}" stroke-width="2" opacity=".55" fill="none"/>
      <path d="M180 108 C195 122 204 146 200 166" stroke="${metal}" stroke-width="2"/>
      <circle cx="200" cy="169" r="4" fill="${metal}"/>
      <path d="M189 156 C197 166 197 176 189 184" fill="none" stroke="${metal}" stroke-width="1.5" opacity=".6"/>
      ${gold ? `
        <circle cx="60" cy="181" r="18" fill="none" stroke="${metal}" stroke-width="5"/>
        <path d="M48 168 L72 168 L76 181 L44 181Z" fill="${accent}" opacity=".85"/>
        <circle cx="60" cy="181" r="4" fill="${metal}"/>
        <circle cx="173" cy="190" r="13" fill="none" stroke="${accent}" stroke-width="3"/>
        <circle cx="173" cy="190" r="4" fill="${metal}"/>
      ` : `
        <path d="M178 170 C192 179 198 192 194 203" stroke="${metal}" stroke-width="2" fill="none"/>
        <circle cx="193" cy="206" r="4" fill="${detail}"/>
      `}
      ${item.brand ? `<g transform="rotate(-16 180 152)">${brandLockup(item, 170, 152, accent, { scale: .55 })}</g>` : ''}
    `, id);
  }

  window.itemArt = function itemArt(item) {
    if (!item || !item.palette) return '';
    if (item.slot === 'top') {
      if (['tee', 'tank', 'longsleeve', 'shirt', 'bomber', 'vest'].includes(item.variant)) return extendedTopArt(item);
      return topArt(item);
    }
    if (item.slot === 'bottom') {
      if (['flare', 'baggy', 'parachute', 'track', 'skirt', 'jorts', 'wide'].includes(item.variant)) return extendedBottomArt(item);
      return bottomArt(item);
    }
    if (item.slot === 'shoes') {
      if (['platform', 'mule', 'ballet', 'runner', 'derby'].includes(item.variant)) return extendedShoesArt(item);
      return shoesArt(item);
    }
    if (item.slot === 'hair') return hairArt(item);
    if (['rings', 'chain', 'pearls', 'earrings', 'watch'].includes(item.variant)) return extendedAccessoryArt(item);
    return accessoryArt(item);
  };
})();
