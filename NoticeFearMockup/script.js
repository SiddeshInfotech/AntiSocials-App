/* ==========================================================================
   Notice Fear Case Study - JavaScript Interactivity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Particle Canvas Renderer
    initParticles();

    // 2. Interactive Screen States
    initScreenInteractions();

    // 3. Zoom / Details Modal Functionality
    initZoomModal();
});

/* ==========================================================================
   Canvas Particles Animation
   ========================================================================== */
function initParticles() {
    const canvases = document.querySelectorAll('.particles-canvas');
    
    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        
        // Resize canvas to match display size
        function resize() {
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
            ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
        }
        
        resize();
        
        // Particle template
        const particles = [];
        const maxParticles = 20;
        
        for (let i = 0; i < maxParticles; i++) {
            particles.push({
                x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
                y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
                radius: Math.random() * 1.5 + 0.5,
                color: 'rgba(255, 255, 255, ' + (Math.random() * 0.4 + 0.1) + ')',
                vx: (Math.random() - 0.5) * 0.15,
                vy: (Math.random() - 0.5) * 0.15 - 0.15 // drift upwards slightly
            });
        }
        
        function animate() {
            const w = canvas.width / (window.devicePixelRatio || 1);
            const h = canvas.height / (window.devicePixelRatio || 1);
            ctx.clearRect(0, 0, w, h);
            
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                
                // Move particle
                p.x += p.vx;
                p.y += p.vy;
                
                // Wrap around edges
                if (p.x < 0) p.x = w;
                if (p.x > w) p.x = 0;
                if (p.y < 0) p.y = h;
                if (p.y > h) p.y = h;
            });
            
            animationFrameId = requestAnimationFrame(animate);
        }
        
        animate();
        
        // Save resize event or handle it gracefully
        window.addEventListener('resize', resize);
    });
}

/* ==========================================================================
   Screen Interactions Logic
   ========================================================================== */
function initScreenInteractions() {
    
    // We use event delegation on document body to handle clicks
    // that happen in both the normal grid view and the modal view
    document.body.addEventListener('click', (e) => {
        
        // A. SCREEN 4: Intensity Number Selectors
        const numPill = e.target.closest('.num-pill');
        if (numPill) {
            const val = parseInt(numPill.getAttribute('data-val'));
            const screen = numPill.closest('.screen-content');
            
            // Toggle active pill
            screen.querySelectorAll('.num-pill').forEach(btn => btn.classList.remove('active'));
            numPill.classList.add('active');
            
            // Update Center Number
            const numGlow = screen.querySelector('.intensity-number');
            if (numGlow) numGlow.textContent = val;
            
            // Update Ring Value (via CSS stroke-dashoffset transition)
            const ringFill = screen.querySelector('.ring-fill');
            if (ringFill) {
                // Class update matches the level
                ringFill.className.baseVal = `ring-fill level-${val}`;
            }

            // Update Label
            const label = screen.querySelector('.intensity-label');
            if (label) {
                const labels = ['', 'Mild', 'Moderate', 'Noticeable', 'Strong', 'Overwhelming'];
                label.textContent = labels[val] || 'Strong';
            }
            return;
        }

        // B. SCREEN 5: Body Map Hotspots
        const hotspot = e.target.closest('.hotspot');
        if (hotspot) {
            const part = hotspot.getAttribute('data-part');
            const screen = hotspot.closest('.screen-content');
            
            // Toggle active hotspot
            screen.querySelectorAll('.hotspot').forEach(item => item.classList.remove('active'));
            hotspot.classList.add('active');
            
            // Reset labels to normal spans
            screen.querySelectorAll('.hotspot-label').forEach(label => {
                const innerLabelText = label.textContent.trim();
                label.className = `hotspot-label ${label.classList.contains('left-label') ? 'left-label' : label.classList.contains('right-label-short') ? 'right-label-short' : 'right-label'}`;
                label.textContent = innerLabelText;
            });

            // Update selected label to chip style
            const labelElement = hotspot.querySelector('.hotspot-label');
            if (labelElement) {
                labelElement.className = 'hotspot-label right-label-chip';
            }
            return;
        }

        // C. SCREEN 6: Observe Chip Tags
        const glassChip = e.target.closest('.glass-chip');
        if (glassChip) {
            const screen = glassChip.closest('.screen-content');
            
            // Toggle active state for this chip (can select one or multiple, here we make it single select)
            screen.querySelectorAll('.glass-chip').forEach(c => c.classList.remove('active'));
            glassChip.classList.add('active');
            return;
        }

        // D. SCREEN 7: Shape Metaphor Selectors
        const shapeItem = e.target.closest('.shape-grid-item');
        if (shapeItem) {
            const screen = shapeItem.closest('.screen-content');
            const selectedShape = shapeItem.getAttribute('data-shape');
            
            screen.querySelectorAll('.shape-grid-item').forEach(c => c.classList.remove('active'));
            shapeItem.classList.add('active');
            
            // Animate shape illustration
            const smokeSmall = screen.querySelector('.smoke-cloud-small');
            if (smokeSmall) {
                // Change smoke color gradient depending on shape
                if (selectedShape === 'fire') {
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(239, 68, 68, 0.45) 0%, rgba(245, 158, 11, 0.15) 50%, transparent 80%)';
                } else if (selectedShape === 'wave') {
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.45) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)';
                } else if (selectedShape === 'rock') {
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(148, 163, 184, 0.45) 0%, transparent 80%)';
                } else if (selectedShape === 'storm') {
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.45) 0%, rgba(59, 130, 246, 0.2) 50%, transparent 80%)';
                } else if (selectedShape === 'shadow') {
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.6) 0%, transparent 80%)';
                } else {
                    // default cloud
                    smokeSmall.style.background = 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.35) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 80%)';
                }
            }
            return;
        }

        // E. SCREEN 9: Reminder Cards
        const reminderCard = e.target.closest('.reminder-card');
        if (reminderCard) {
            const screen = reminderCard.closest('.screen-content');
            screen.querySelectorAll('.reminder-card').forEach(c => c.classList.remove('active'));
            reminderCard.classList.add('active');
            return;
        }

        // F. SCREEN 9: Add Your Own Reminder Button
        const addReminderBtn = e.target.closest('.btn-outline');
        if (addReminderBtn) {
            const screen = addReminderBtn.closest('.screen-content');
            const customText = prompt("Enter your personal reminder affirmation:", "I breathe through this moment.");
            if (customText && customText.trim()) {
                const list = screen.querySelector('.reminder-cards-list');
                if (list) {
                    // Create element
                    const newCard = document.createElement('div');
                    newCard.className = 'reminder-card active';
                    newCard.innerHTML = `
                        <span class="card-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/></svg>
                        </span>
                        <span class="card-text">${escapeHtml(customText)}</span>
                    `;
                    
                    // Remove previous active state
                    list.querySelectorAll('.reminder-card').forEach(c => c.classList.remove('active'));
                    list.appendChild(newCard);
                }
            }
            return;
        }

        // G. SCREEN 10: Reflection Checklist Cards
        const checklistCard = e.target.closest('.checklist-card');
        if (checklistCard) {
            checklistCard.classList.toggle('active');
            return;
        }

        // H. SCREEN 2: Tap Orb Interaction
        const orb = e.target.closest('.fear-orb');
        if (orb) {
            orb.style.animation = 'none';
            void orb.offsetWidth; // trigger reflow
            orb.style.animation = 'orbPulse 1s ease-in-out';
            setTimeout(() => {
                orb.style.animation = 'orbPulse 6s infinite alternate ease-in-out';
            }, 1000);
        }
    });
}

// Helper to escape HTML and prevent injection
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/* ==========================================================================
   Zoom Details Modal Manager
   ========================================================================== */
const screenMetaData = {
    1: {
        title: "01. Introduction Screen",
        description: "Greets the user with a calming, dark cosmic night sky and mountain silhouette. It prompts the user with the central comforting philosophy: 'Fear is only a visitor. You don't have to become it.' The Begin button glows softly, inviting the user to start."
    },
    2: {
        title: "02. Fear Orb Representation",
        description: "Visualizes the user's fear as a glowing, floating violet orb surrounded by interstellar mist. Tapping the orb pulses it outwards, metaphorically representing externalizing the feeling and examining it from a safe distance."
    },
    3: {
        title: "03. Fear Articulation Input",
        description: "An open, translucent glassmorphic card inviting the user to type their fear. Writing down fear triggers language processing in the prefrontal cortex, transforming abstract anxiety into concrete words."
    },
    4: {
        title: "04. Intensity Evaluation",
        description: "A slider-based prompt asking how strong the sensation is. Features a gorgeous circular progress ring and dynamic pill buttons. It helps the user calibrate and normalize their response non-judgmentally."
    },
    5: {
        title: "05. Body Mapping",
        description: "A minimal body silhouette with interactive hotspots (Head, Chest, Stomach, Legs). The user maps where their fear manifests physically. Chest is highlighted in a vibrant rounded purple tag."
    },
    6: {
        title: "06. Physical Qualities Observation",
        description: "Prompts the user to look closer. A floating nebula represents the smoke cloud of fear. Users choose from structured descriptors (Heavy, Cold, Tight, Fast) to categorize the sensation without trying to run from it."
    },
    7: {
        title: "07. Shape Metaphor",
        description: "Asks the user to classify the fear as a shape (Cloud, Wave, Fire, Rock, Storm, Shadow). The selected item (Cloud) is decorated with a glowing border and triggers an atmospheric smoke vector illustration beneath."
    },
    8: {
        title: "08. Drift and Pass Animation",
        description: "Reinforces impermanence. A purple smoke cloud drifts from right to left across the screen, fading away in motion-blur. The text states: 'Watch it pass... Even fear changes.'"
    },
    9: {
        title: "09. Affirmation Anchoring",
        description: "Offers the user grounding reminders: safety in the moment, temporariness, and self-capacity. Includes beautiful customized icons and an button to add a custom affirmation."
    },
    10: {
        title: "10. Reflection Checklist",
        description: "A retrospective checklist. Tapping the cards highlights their achievements in showing up. Emphasizes acknowledging fear, staying present, and letting go of the urge to control it."
    },
    11: {
        title: "11. Observation Complete",
        description: "A neon-halo ring enclosing a checkmark confirms completion. Highlights the realization that fear does not need to be defeated or ignored, simply noticed."
    },
    12: {
        title: "12. Sunrise Success Affirmation",
        description: "A gorgeous, warm sunrise gradient representing hope and light over mountain silhouettes. The user is rewarded with a Finish button and the warm sign-off: 'You showed up for yourself. That's something to be proud of.'"
    }
};

function initZoomModal() {
    const modal = document.getElementById('zoomModal');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    const container = modal.querySelector('.modal-iphone-container');
    const prevBtn = document.getElementById('prevScreenBtn');
    const nextBtn = document.getElementById('nextScreenBtn');
    const screenTitle = document.getElementById('screenTitle');
    const screenDesc = document.getElementById('screenDetailDesc');
    
    let currentActiveIndex = 1;
    
    // Open Modal on Grid Click
    const wrappers = document.querySelectorAll('.screen-wrapper');
    wrappers.forEach(wrapper => {
        wrapper.addEventListener('click', () => {
            const idx = parseInt(wrapper.getAttribute('data-screen-index'));
            openModalForIndex(idx);
        });
    });
    
    function openModalForIndex(idx) {
        currentActiveIndex = idx;
        modal.classList.add('active');
        
        // Find corresponding iPhone mockup and clone it
        const originalPhone = document.querySelector(`.screen-wrapper[data-screen-index="${idx}"] .iphone-16-pro`);
        
        // Clear previous cloned phone
        container.innerHTML = '';
        
        // Clone phone content
        const clonedPhone = originalPhone.cloneNode(true);
        container.appendChild(clonedPhone);
        
        // Bind dynamic inputs or listeners on cloned canvas particles
        const canvas = clonedPhone.querySelector('.particles-canvas');
        if (canvas) {
            // Re-render canvas loop on cloned canvas
            initClonedCanvasParticles(canvas);
        }
        
        // Update Side text
        updateSidebar(idx);
    }
    
    function updateSidebar(idx) {
        const meta = screenMetaData[idx] || { title: `Screen ${idx}`, description: "" };
        screenTitle.textContent = meta.title;
        screenDesc.textContent = meta.description;
        
        // Disable nav buttons at boundaries
        prevBtn.style.opacity = (idx === 1) ? "0.4" : "1";
        prevBtn.style.pointerEvents = (idx === 1) ? "none" : "auto";
        
        nextBtn.style.opacity = (idx === 12) ? "0.4" : "1";
        nextBtn.style.pointerEvents = (idx === 12) ? "none" : "auto";
    }
    
    // Close Modal
    function closeModal() {
        modal.classList.remove('active');
        container.innerHTML = '';
    }
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    
    // Keyboard navigation (Esc to close, Left/Right arrow keys)
    window.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeModal();
        } else if (e.key === 'ArrowLeft' && currentActiveIndex > 1) {
            openModalForIndex(currentActiveIndex - 1);
        } else if (e.key === 'ArrowRight' && currentActiveIndex < 12) {
            openModalForIndex(currentActiveIndex + 1);
        }
    });
    
    // Prev / Next button clicks
    prevBtn.addEventListener('click', () => {
        if (currentActiveIndex > 1) {
            openModalForIndex(currentActiveIndex - 1);
        }
    });
    
    nextBtn.addEventListener('click', () => {
        if (currentActiveIndex < 12) {
            openModalForIndex(currentActiveIndex + 1);
        }
    });
}

// Particle rendering on the cloned Modal canvas
function initClonedCanvasParticles(canvas) {
    const ctx = canvas.getContext('2d');
    let frameId;
    
    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * (window.devicePixelRatio || 1);
        canvas.height = rect.height * (window.devicePixelRatio || 1);
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
    
    resize();
    
    const particles = [];
    const maxParticles = 25; // slightly denser particles inside modal zoom
    
    for (let i = 0; i < maxParticles; i++) {
        particles.push({
            x: Math.random() * (canvas.width / (window.devicePixelRatio || 1)),
            y: Math.random() * (canvas.height / (window.devicePixelRatio || 1)),
            radius: Math.random() * 1.8 + 0.6,
            color: 'rgba(255, 255, 255, ' + (Math.random() * 0.45 + 0.15) + ')',
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2 - 0.2
        });
    }
    
    function animate() {
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        ctx.clearRect(0, 0, w, h);
        
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            
            p.x += p.vx;
            p.y += p.vy;
            
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = h;
        });
        
        frameId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Stop loop when canvas is removed from DOM (modal changes)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
                if (node.contains(canvas) || node === canvas) {
                    cancelAnimationFrame(frameId);
                    observer.disconnect();
                }
            });
        });
    });
    
    observer.observe(canvas.parentNode, { childList: true });
}
