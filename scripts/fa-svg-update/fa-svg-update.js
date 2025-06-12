import path from 'node:path';
import fs from 'node:fs/promises';
import { checkIcons } from '../../src/module/system/enrichers/check.js';
import { createSVGWindow } from 'svgdom';
import { SVG, G, registerWindow } from '@svgdotjs/svg.js';

// script parameters
const root = path.resolve(import.meta.dirname, '../..');
const iconPath = path.join(root, 'static/icons/fa-svg');
const iconScale = 0.95;
const iconUrlBase = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/refs/heads/6.x/svgs/solid';

function iconUrl(slug) {
    if (slug.startsWith('fa-')) {
        slug = slug.substring(3);
    }
    return `${iconUrlBase}/${slug}.svg`;
}

const window = createSVGWindow();
registerWindow(window, window.document);

let maxDim = 1;
const icons = [];
for (const icon of Object.values(checkIcons)) {
    const svgRequest = await fetch(iconUrl(icon));
    if (svgRequest.status !== 200) {
        console.error("Request failed", svgRequest);
    } else {
        const svg = SVG(await svgRequest.text());
        const viewbox = svg.viewbox();
        maxDim = Math.max(maxDim, viewbox.width, viewbox.height);
        icons.push({
            svg: svg,
            dest: path.join(iconPath, `${icon}.svg`)
        });
    }
}

for (const { svg, dest } of icons) {
    const viewbox = svg.viewbox();
    const glyph = svg.findOne('path');
    if (glyph) {
        glyph.remove();
        glyph.fill("#ffffff");

        const group = new G();
        group.add(glyph);
        group.transform({
            origin: 'top left',
            translateX: 0.5 * (maxDim - iconScale * viewbox.width),
            translateY: 0.5 * (maxDim - iconScale * viewbox.height),
            scale: iconScale
        });

        svg.add(group);
        svg.viewbox(0, 0, maxDim, maxDim);

        await fs.writeFile(dest, svg.node.outerHTML);
    }
}
