// script.js
// Custom cursor logic + AI line creation (straight lines with 90-degree turns)
// Lines start from screen edge, travel to avatar, signal at head of line.
// Multiple lines at once, random intervals. Avatar glows when reached.

document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.custom-cursor');
    cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

window.addEventListener('load', () => {
    const svg = document.querySelector('.ai-lines-svg');
    const avatar = document.querySelector('.hero-image');
    const AVATAR_RECT = avatar.getBoundingClientRect();
    const avatarX = AVATAR_RECT.left + AVATAR_RECT.width / 2;
    const avatarY = AVATAR_RECT.top + AVATAR_RECT.height / 2;

    // Adjust for scroll offset
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const avatarAbsoluteX = avatarX + scrollX;
    const avatarAbsoluteY = avatarY + scrollY;

    const LINE_INTERVAL_MIN = 1000;  // minimum 1s between new lines
    const LINE_INTERVAL_MAX = 3000;  // max 3s between new lines
    const LINE_SPEED = 4; // seconds for signal to travel line length
    const MAX_TURNS = 2; // up to 2 right-angle turns

    // Add glow filter
    addGlowFilter(svg);

    function createLine() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Random start edge
        // Edges: top(0,y), bottom(height,y), left(x,0), right(x,width)
        let startX, startY;
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
            case 0: // top
                startX = Math.random() * width;
                startY = 0;
                break;
            case 1: // right
                startX = width;
                startY = Math.random() * height;
                break;
            case 2: // bottom
                startX = Math.random() * width;
                startY = height;
                break;
            case 3: // left
                startX = 0;
                startY = Math.random() * height;
                break;
        }

        // Create a path with up to 2 right-angle turns
        // We'll generate intermediate points to form straight segments.
        const points = [{x:startX, y:startY}];

        const turns = Math.floor(Math.random() * (MAX_TURNS + 1)); 
        // We'll create that many intermediate points that turn 90 degrees towards avatar
        let currentX = startX;
        let currentY = startY;

        for (let i=0; i<turns; i++) {
            if (Math.random() < 0.5) {
                // move horizontally towards avatarX
                currentX = (currentX < avatarAbsoluteX) ? avatarAbsoluteX * Math.random() : avatarAbsoluteX + (currentX - avatarAbsoluteX)*Math.random();
            } else {
                // move vertically towards avatarY
                currentY = (currentY < avatarAbsoluteY) ? avatarAbsoluteY * Math.random() : avatarAbsoluteY + (currentY - avatarAbsoluteY)*Math.random();
            }
            points.push({x:currentX, y:currentY});
        }

        // Final point is avatar location
        points.push({x: avatarAbsoluteX, y: avatarAbsoluteY});

        // Create a path string
        let d = `M ${points[0].x},${points[0].y}`;
        for (let i=1; i<points.length; i++) {
            const p = points[i];
            if (i===points.length-1) {
                // go straight to avatar
                d += ` L ${p.x},${p.y}`;
            } else {
                // add a straight line
                d += ` L ${p.x},${p.y}`;
            }
        }

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#e50914");
        path.setAttribute("stroke-width", "2");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("filter", "url(#glow)");

        svg.appendChild(path);

        const pathLength = path.getTotalLength();
        // We'll animate the stroke-dashoffset so it looks like signal is drawing the line
        path.style.strokeDasharray = pathLength;
        path.style.strokeDashoffset = pathLength;

        // Create the signal (circle)
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", "5");
        circle.setAttribute("fill", "#ffffff");
        circle.setAttribute("filter", "url(#glow)");
        svg.appendChild(circle);

        const pathID = setPathID(path);

        // Animate signal along path
        const animateMotion = document.createElementNS("http://www.w3.org/2000/svg", "animateMotion");
        animateMotion.setAttribute("dur", `${LINE_SPEED}s`);
        animateMotion.setAttribute("repeatCount", "1");
        animateMotion.setAttribute("fill", "freeze");

        const mpath = document.createElementNS("http://www.w3.org/2000/svg", "mpath");
        mpath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${pathID}`);
        animateMotion.appendChild(mpath);
        circle.appendChild(animateMotion);

        // Animate the line drawing in sync with the signal
        // We'll use a JS-driven animation frame to match signal progress:
        let startTime = null;
        function animateLineDraw(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = (timestamp - startTime)/1000; // in seconds
            const progress = Math.min(elapsed / LINE_SPEED, 1);
            const offset = pathLength - (pathLength * progress);
            path.style.strokeDashoffset = offset;
            if (progress < 1) {
                requestAnimationFrame(animateLineDraw);
            }
        }

        requestAnimationFrame(animateLineDraw);
        animateMotion.beginElement();

        animateMotion.addEventListener('endEvent', () => {
            // Signal reached avatar
            // Glow avatar briefly
            avatar.classList.add('glow');
            setTimeout(() => {avatar.classList.remove('glow');}, 500);

            // Remove line and circle
            // Fade out line quickly
            const fadeInterval = 20;
            const fadeSteps = 20;
            let currentStep = 0;
            const fadeTimer = setInterval(() => {
                currentStep++;
                const alpha = 1 - (currentStep/fadeSteps);
                path.setAttribute("stroke", `rgba(229,9,20,${alpha})`);
                circle.setAttribute("fill", `rgba(255,255,255,${alpha})`);
                if (currentStep >= fadeSteps) {
                    clearInterval(fadeTimer);
                    if (circle.parentNode) svg.removeChild(circle);
                    if (path.parentNode) svg.removeChild(path);
                }
            }, fadeInterval);
        });
    }

    // Random intervals for line creation
    function scheduleNextLine() {
        const delay = Math.random() * (LINE_INTERVAL_MAX - LINE_INTERVAL_MIN) + LINE_INTERVAL_MIN;
        setTimeout(() => {
            createLine();
            scheduleNextLine();
        }, delay);
    }

    scheduleNextLine();

    function setPathID(path) {
        const id = 'path_' + Math.random().toString(36).substr(2, 9);
        path.setAttribute("id", id);
        return id;
    }

    function addGlowFilter(svg) {
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "glow");
        filter.innerHTML = `
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur"/>
            <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        `;
        defs.appendChild(filter);
        svg.appendChild(defs);
    }
});
