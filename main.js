/**
 * STARK PORTFOLIO - INTERACTIVE ENGINE
 * Canvas Particle Constellation + Scroll Theme Inversion
 * Ayush Kumar Raunak
 */

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initScrollInversion();
  initTextAnimations();
});

/* ----------------------------------------------------
   SCROLL INTERPOLATION ENGINE (GREYSCALE TO DARK MODE)
---------------------------------------------------- */
function initScrollInversion() {
  const checkScroll = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    
    const rawPercent = window.scrollY / maxScroll;
    
    // Soft shaded progression: transition begins after 10% scroll, peaks at 75% scroll
    const start = 0.1;
    const end = 0.75;
    let factor = 0;
    
    if (rawPercent > start) {
      factor = Math.min((rawPercent - start) / (end - start), 1);
    }
    
    // Interpolate background RGB from White (255, 255, 255) to Dark Grey (18, 18, 18)
    const bgR = Math.round(255 - (255 - 18) * factor);
    const bgG = Math.round(255 - (255 - 18) * factor);
    const bgB = Math.round(255 - (255 - 18) * factor);
    const bgString = `rgb(${bgR}, ${bgG}, ${bgB})`;
    
    // Interpolate text RGB from Black (0, 0, 0) to Off-White (240, 240, 240)
    const textR = Math.round(0 + (240 - 0) * factor);
    const textG = Math.round(0 + (240 - 0) * factor);
    const textB = Math.round(0 + (240 - 0) * factor);
    const textString = `rgb(${textR}, ${textG}, ${textB})`;
    
    // Apply variables to root element so borders and elements transition dynamically
    document.documentElement.style.setProperty('--color-bg', bgString);
    document.documentElement.style.setProperty('--color-text', textString);
    
    // Apply background color to html element so body canvas sits on top of background but behind text
    document.documentElement.style.backgroundColor = bgString;
    document.body.style.backgroundColor = 'transparent';
    
    const header = document.querySelector('header');
    if (header) header.style.backgroundColor = bgString;
    
    const footer = document.querySelector('footer');
    if (footer) footer.style.backgroundColor = bgString;
  };

  window.addEventListener('scroll', checkScroll, { passive: true });
  window.addEventListener('resize', checkScroll);
  checkScroll(); // Initial evaluation
}

/* ----------------------------------------------------
   PARTICLE BACKGROUND ENGINE
---------------------------------------------------- */
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null, active: false };
  let animationFrameId = null;

  // Configuration
  const connectionDistance = 90;
  const mouseInteractionRadius = 185;
  let particleCount = window.innerWidth < 768 ? 45 : 85;

  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height : -10;
      this.vx = (Math.random() - 0.5) * 1.2;
      this.vy = (Math.random() - 0.5) * 1.2;
      this.radius = Math.random() * 3.5 + 2.5;
      this.nearMouse = false;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Handle screen wrap/bounce
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

      // Mouse attraction & interaction
      if (mouse.active && mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouseInteractionRadius) {
          this.nearMouse = true;
          // Apply magnetic acceleration towards mouse
          const force = (mouseInteractionRadius - distance) / mouseInteractionRadius;
          this.x += (dx / distance) * force * 1.6;
          this.y += (dy / distance) * force * 1.6;
        } else {
          this.nearMouse = false;
        }
      } else {
        this.nearMouse = false;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      if (this.nearMouse) {
        ctx.fillStyle = '#ff0000'; // Violent Red near cursor
      } else {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
        let factor = 0;
        const start = 0.1;
        const end = 0.75;
        if (scrollPercent > start) {
          factor = Math.min((scrollPercent - start) / (end - start), 1);
        }
        // Interpolate particle color value from 0 (black) to 255 (white)
        const val = Math.round(0 + 255 * factor);
        // Interpolate opacity from 0.65 (light bg) to 0.45 (dark bg)
        const alpha = 0.65 - 0.20 * factor;
        ctx.fillStyle = `rgba(${val}, ${val}, ${val}, ${alpha})`;
      }
      
      ctx.fill();
    }
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Adjust particle density dynamically
    const newCount = window.innerWidth < 768 ? 40 : 80;
    if (newCount !== particleCount) {
      particleCount = newCount;
      createParticles();
    }
  }

  function createParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function drawConnections() {
    // Pre-calculate connection color and scroll factor based on scroll position
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight || 1);
    let factor = 0;
    const start = 0.1;
    const end = 0.75;
    if (scrollPercent > start) {
      factor = Math.min((scrollPercent - start) / (end - start), 1);
    }
    const colorVal = Math.round(0 + 255 * factor);
    const maxAlpha = 0.35 - 0.15 * factor;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.hypot(dx, dy);

        if (distance < connectionDistance) {
          const ratio = (1 - distance / connectionDistance);
          const alpha = ratio * maxAlpha;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);

          // If either particle is near the mouse, highlight the link in red
          if (particles[i].nearMouse || particles[j].nearMouse) {
            ctx.strokeStyle = `rgba(255, 0, 0, ${ratio * 0.75})`;
            ctx.lineWidth = 1.0;
          } else {
            ctx.strokeStyle = `rgba(${colorVal}, ${colorVal}, ${colorVal}, ${alpha})`;
            ctx.lineWidth = 0.7;
          }
          
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    
    drawConnections();

    // Draw magnetic cursor indicator target
    if (mouse.active && mouse.x !== null && mouse.y !== null) {
      // 1. Center solid dot
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();

      // 2. Interactive inner ring
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 22, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 3. Wide halo ring
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 45, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.12)';
      ctx.lineWidth = 1.0;
      ctx.stroke();
    }
    
    animationFrameId = requestAnimationFrame(animate);
  }

  // Mouse Listeners
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
    mouse.active = false;
  });

  window.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
      mouse.active = true;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      mouse.x = e.touches[0].clientX;
      mouse.y = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
    mouse.active = false;
  });

  // Init
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  createParticles();
  animate();
}

/* ----------------------------------------------------
   TEXT REVEAL / SCROLL ANIMATION ENGINE
---------------------------------------------------- */
function splitTextIntoCharacters(element) {
  const text = element.textContent.trim();
  if (!text) return;
  const words = text.split(/\s+/);
  element.innerHTML = ''; // Clear original content
  element.classList.add('text-split');

  words.forEach((word, wordIdx) => {
    const wordSpan = document.createElement('span');
    wordSpan.className = 'word-wrap';
    
    // Convert word to characters
    Array.from(word).forEach((char) => {
      const charWrap = document.createElement('span');
      charWrap.className = 'char-wrap';
      
      const charSpan = document.createElement('span');
      charSpan.className = 'char';
      charSpan.textContent = char;
      
      charWrap.appendChild(charSpan);
      wordSpan.appendChild(charWrap);
    });

    element.appendChild(wordSpan);

    // Insert spaces between words
    if (wordIdx < words.length - 1) {
      const space = document.createTextNode(' ');
      element.appendChild(space);
    }
  });
}

function initTextAnimations() {
  // 1. Process headings for kinetic character split reveal
  const splitTargets = document.querySelectorAll('h1, h2');
  splitTargets.forEach(el => {
    if (!el.classList.contains('text-split')) {
      splitTextIntoCharacters(el);
      
      // Select the split characters and apply staggered delay
      const chars = el.querySelectorAll('.char');
      chars.forEach((char, index) => {
        char.style.transitionDelay = `${index * 0.03}s`;
      });
    }
  });

  // 2. Query all animation elements to observe
  const targets = document.querySelectorAll(
    'h1, h2, h3, p:not(.copyright), .hero-subtitle, .sidebar-section, .project-item, .contact-feedback-section, .sidebar-list li, .project-tech li'
  );

  const observerOptions = {
    root: null,
    rootMargin: '120px 0px 120px 0px', // Trigger elements 120px before they enter viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      } else {
        // Remove class to reload animation when scrolling up/down
        entry.target.classList.remove('reveal-active');
      }
    });
  }, observerOptions);

  targets.forEach(el => {
    // Add base class for animation
    el.classList.add('reveal-on-scroll');

    // Stagger delays for sequential block-level siblings (excluding children of split elements)
    if (!el.classList.contains('text-split') && !el.closest('h1') && !el.closest('h2')) {
      const siblingIndex = Array.from(el.parentNode.children).indexOf(el);
      if (siblingIndex > 0 && siblingIndex <= 5) {
        el.classList.add(`delay-${siblingIndex}`);
      }
    }

    observer.observe(el);
  });
}


