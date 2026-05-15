/* ============================================
   DEVVIT FOR NOOBS — Minimal JS
   - Active nav tracking on scroll
   - Mobile hamburger toggle
   - Smooth section highlighting
   ============================================ */

(function () {
  'use strict';

  // --- Mobile hamburger toggle ---
  var sidebar = document.querySelector('.sidebar');
  var toggle = document.querySelector('.mobile-nav-toggle');

  if (toggle && sidebar) {
    toggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking a nav link on mobile
    sidebar.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
        }
      });
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', function (e) {
      if (window.innerWidth <= 768 &&
          !sidebar.contains(e.target) &&
          !toggle.contains(e.target) &&
          sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
      }
    });
  }

  // --- Active nav tracking on scroll ---
  var sections = document.querySelectorAll('.section');
  var navLinks = document.querySelectorAll('.sidebar-nav a');

  if (sections.length && navLinks.length) {
    var scrollTimeout;

    window.addEventListener('scroll', function () {
      // Throttle scroll handling
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(function () {
        scrollTimeout = null;

        var scrollPos = window.scrollY + 100;

        sections.forEach(function (section) {
          var top = section.offsetTop;
          var bottom = top + section.offsetHeight;

          if (scrollPos >= top && scrollPos < bottom) {
            var id = section.getAttribute('id');
            navLinks.forEach(function (link) {
              link.classList.remove('active');
              if (link.getAttribute('href') === '#' + id) {
                link.classList.add('active');
              }
            });
          }
        });
      }, 50);
    });

    // Initial active state
    var hash = window.location.hash;
    if (hash) {
      navLinks.forEach(function (link) {
        if (link.getAttribute('href') === hash) {
          link.classList.add('active');
        }
      });
    } else {
      navLinks[0] && navLinks[0].classList.add('active');
    }
  }
})();
