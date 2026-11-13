document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".menu-toggle");
  var links = document.querySelector(".topbar-links");

  toggle.addEventListener("click", function () {
    links.classList.toggle("open");
  });

  // Section popout
  var expandedSection = null;
  var overlay = null;
  var closeBtn = null;
  var placeholder = null;

  function closeExpanded() {
    if (!expandedSection) return;
    var section = expandedSection;
    var savedPlaceholder = placeholder;
    expandedSection = null;
    placeholder = null;

    section.classList.remove('expanded');
    section.classList.add('collapsing');

    function finishCollapse() {
      section.classList.remove('collapsing');
      section.style.top = '';
      if (savedPlaceholder) savedPlaceholder.remove();
    }
    section.addEventListener('animationend', function handler() {
      section.removeEventListener('animationend', handler);
      finishCollapse();
    });
    setTimeout(finishCollapse, 400);

    if (closeBtn) { closeBtn.remove(); closeBtn = null; }

    if (overlay) {
      var savedOverlay = overlay;
      overlay = null;
      savedOverlay.classList.add('fading-out');
      savedOverlay.addEventListener('animationend', function () { savedOverlay.remove(); });
      setTimeout(function () { savedOverlay.remove(); }, 400);
    }
  }

  document.querySelectorAll('.section').forEach(function (section) {
    section.addEventListener('click', function (e) {
      if (expandedSection) return;
      if (e.target.closest('.section-close')) return;
      if (e.target.closest('.section-phone')) return;

      // Position expanded panel at current viewport location, same as the template
      section.style.top = (window.scrollY + window.innerHeight * 0.13) + 'px';

      // Placeholder holds the section's space so the layout doesn't collapse
      var rect = section.getBoundingClientRect();
      placeholder = document.createElement('div');
      placeholder.style.cssText =
        'height:' + rect.height + 'px;' +
        'flex-shrink:0;';
      section.parentNode.insertBefore(placeholder, section);

      overlay = document.createElement('div');
      overlay.className = 'section-popout-overlay';
      overlay.addEventListener('click', closeExpanded);
      document.body.appendChild(overlay);

      section.classList.add('expanded');
      expandedSection = section;

      closeBtn = document.createElement('button');
      closeBtn.className = 'section-close';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', closeExpanded);
      section.appendChild(closeBtn);
    });
  });

  // Stop section-phone taps from bubbling up to the section expand handler
  document.querySelectorAll('.section-phone').forEach(function (bar) {
    bar.addEventListener('click', function (e) { e.stopPropagation(); });
  });

  // Sidebar link color animation
  var sidebarLinks = document.querySelectorAll('.sidebar-link');
  var linkCount = sidebarLinks.length;
  var angle = 0;

  function animateLinks() {
    angle += 0.02;
    sidebarLinks.forEach(function (link, i) {
      var offset = (Math.PI * 2 / linkCount) * i;
      var lightness = 30 + Math.sin(angle + offset) * 30;
      link.style.setProperty('--lightness', lightness);
    });
    requestAnimationFrame(animateLinks);
  }
  animateLinks();

  // Gallery carousel
  var slides = document.querySelectorAll('.carousel-slide');
  var current = 0;

  if (slides.length > 1) {
    setInterval(function () {
      slides[current].classList.remove('active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('active');
    }, 3500);
  }

  // Gallery lightbox
  document.querySelectorAll('.gallery-thumb').forEach(function (thumb) {
    thumb.addEventListener('click', function (e) {
      e.stopPropagation();
      var lb = document.createElement('div');
      lb.className = 'lightbox';
      var img = document.createElement('img');
      img.src = thumb.src;
      img.alt = thumb.alt;
      lb.appendChild(img);
      lb.addEventListener('click', function () { lb.remove(); });
      document.body.appendChild(lb);
    });
  });
});
