function randomize_everything() {
    const random_containers = document.querySelectorAll('.random');

    random_containers.forEach(container => {
        const all_elements = container.querySelectorAll('*');

        all_elements.forEach(element => {
            // Add transition for smooth animation
            element.style.transition = 'all 1.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';

            const fonts = ['Helvetica', 'Times New Roman', 'Arial', 'Courier New', 'Georgia', 'Verdana'];
            element.style.fontFamily = fonts[Math.floor(Math.random() * fonts.length)];

            const styles = ['normal', 'italic', 'oblique'];
            element.style.fontStyle = styles[Math.floor(Math.random() * styles.length)];

            const weights = ['100', '300', '400', '500', '700', '900'];
            element.style.fontWeight = weights[Math.floor(Math.random() * weights.length)];

            element.style.fontSize = (10 + Math.random() * 90) + 'px';

            const positions = ['static', 'relative', 'absolute', 'fixed'];
            const position = positions[Math.floor(Math.random() * positions.length)];
            element.style.position = position;

            if (position !== 'static') {
                element.style.top = (Math.random() * 200 - 100) + 'px';
                element.style.left = (Math.random() * 200 - 100) + 'px';
                element.style.zIndex = Math.floor(Math.random() * 1000);
            }

            const rotate = Math.random() * 360 - 180; // -180 to 180 degrees
            const skewX = Math.random() * 60 - 30; // -30 to 30 degrees
            const skewY = Math.random() * 60 - 30;
            const scaleX = 0.5 + Math.random() * 1.5; // 0.5 to 2
            const scaleY = 0.5 + Math.random() * 1.5;
            const translateX = Math.random() * 100 - 50; // -50 to 50px
            const translateY = Math.random() * 100 - 50;

            element.style.transform = `
                rotate(${rotate}deg)
                skewX(${skewX}deg)
                skewY(${skewY}deg)
                scale(${scaleX}, ${scaleY})
                translate(${translateX}px, ${translateY}px)
            `;

            const random_color = () => {
                return `rgb(${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 200)}, ${Math.floor(Math.random() * 256)})`;
            };

            element.style.color = random_color();
            element.style.backgroundColor = random_color();
            element.style.borderColor = random_color();

            element.style.borderWidth = Math.floor(Math.random() * 20) + 'px';
            const border_styles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
            element.style.borderStyle = border_styles[Math.floor(Math.random() * border_styles.length)];
            element.style.borderRadius = Math.floor(Math.random() * 50) + 'px';

            const shadow_x = Math.random() * 40 - 20;
            const shadow_y = Math.random() * 40 - 20;
            const shadow_blur = Math.random() * 50;
            const shadow_spread = Math.random() * 20;
            element.style.boxShadow = `${shadow_x}px ${shadow_y}px ${shadow_blur}px ${shadow_spread}px ${random_color()}`;
            element.style.textShadow = `${shadow_x}px ${shadow_y}px ${shadow_blur}px ${random_color()}`;

            element.style.opacity = 0.4 + Math.random() * 0.6; // 0.3 to 1

            element.style.margin = `${Math.random() * 50}px ${Math.random() * 50}px ${Math.random() * 50}px ${Math.random() * 50}px`;
            element.style.padding = `${Math.random() * 50}px ${Math.random() * 50}px ${Math.random() * 50}px ${Math.random() * 50}px`;

            const decorations = ['none', 'underline', 'overline', 'line-through', 'underline overline'];
            element.style.textDecoration = decorations[Math.floor(Math.random() * decorations.length)];

            element.style.letterSpacing = (Math.random() * 20 - 5) + 'px';
            element.style.wordSpacing = (Math.random() * 30 - 10) + 'px';

            element.style.lineHeight = (0.5 + Math.random() * 2.5); // 0.5 to 3

            const aligns = ['left', 'right', 'center', 'justify'];
            element.style.textAlign = aligns[Math.floor(Math.random() * aligns.length)];

            const blur = Math.random() * 5;
            const brightness = 0.5 + Math.random() * 1.5;
            const contrast = 0.5 + Math.random() * 1.5;
            const hue_rotate = Math.random() * 360;
            const saturate = Math.random() * 3;
            const invert = Math.random();

            element.style.filter = `
                blur(${blur}px)
                brightness(${brightness})
                contrast(${contrast})
                hue-rotate(${hue_rotate}deg)
                saturate(${saturate})
                invert(${invert})
            `;

            const overflows = ['visible', 'hidden', 'scroll', 'auto'];
            element.style.overflow = overflows[Math.floor(Math.random() * overflows.length)];

            const displays = ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'];
            const display = displays[Math.floor(Math.random() * (displays.length - 1))]; // exclude 'none' usually
            element.style.display = display;

            if (Math.random() > 0.3) {
                element.style.width = (50 + Math.random() * 200) + 'px';
                element.style.height = (20 + Math.random() * 100) + 'px';
            }

            element.onmouseenter = () => {
                element.style.transform = `
                    rotate(${Math.random() * 360}deg)
                    scale(${0.5 + Math.random() * 2})
                `;
                element.style.backgroundColor = random_color();
                element.style.color = random_color();
            };

            element.onmouseleave = () => {
                element.style.transform = `
                    rotate(${rotate}deg)
                    skewX(${skewX}deg)
                    skewY(${skewY}deg)
                    scale(${scaleX}, ${scaleY})
                    translate(${translateX}px, ${translateY}px)
                `;
            };

            const animation_duration = 1 + Math.random() * 5; // 1-6 seconds
            const animation_delay = Math.random() * 2; // 0-2 seconds
            element.style.animationDuration = animation_duration + 's';
            element.style.animationDelay = animation_delay + 's';
            element.style.animationIterationCount = 'infinite';

            const transforms = ['none', 'uppercase', 'lowercase', 'capitalize'];
            element.style.textTransform = transforms[Math.floor(Math.random() * transforms.length)];

            if (Math.random() > 0.8) {
                const writing_modes = ['horizontal-tb', 'vertical-rl', 'vertical-lr'];
                element.style.writingMode = writing_modes[Math.floor(Math.random() * writing_modes.length)];
            }

            const blend_modes = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'];
            element.style.mixBlendMode = blend_modes[Math.floor(Math.random() * blend_modes.length)];

            element.style.pointerEvents = Math.random() > 0.5 ? 'auto' : 'none';
        });
    });
}

randomize_everything();

setInterval(randomize_everything, 2000);
