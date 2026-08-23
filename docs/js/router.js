/**
 * SPA Router - history.pushState based (GitHub Pages compatible)
 * Changes the browser URL on section navigation so that:
 *   - GTM can track distinct pageviews via dataLayer push
 *   - Salesforce Data360 SDK can match distinct pageTypes in the sitemap
 *   - Browser back/forward buttons work correctly
 *   - Works with GitHub Pages 404.html redirect trick
 */
(function () {
  'use strict';

  // ─── GitHub Pages base path ───────────────────────────────────
  // e.g. for matefernandezcc.github.io/Salesforce/ → basePath = '/Salesforce'
  var BASE_PATH = '/Salesforce';

  // Route → section mapping
  var ROUTES = {
    '/': 'hero',
    '/about': 'about',
    '/menu': 'menu',
    '/chefs': 'chefs',
    '/reservation': 'reservation',
    '/reviews': 'testimonials',
    '/contact': 'contact-section',
    '/blog': 'blog',
    '/gallery': 'gallery',
    '/history': 'history',
    '/hours': 'hours',
    '/special': 'special',
    '/newsletter': 'newsletter'
  };

  // Section → route (reverse lookup)
  var SECTION_TO_ROUTE = {};
  Object.keys(ROUTES).forEach(function (route) {
    SECTION_TO_ROUTE[ROUTES[route]] = route;
  });

  // Page titles per route
  var TITLES = {
    '/': 'Srappi - Fast Food & Restaurant',
    '/about': 'About Us - Srappi',
    '/menu': 'Our Menu - Srappi',
    '/chefs': 'Our Chefs - Srappi',
    '/reservation': 'Reservation - Srappi',
    '/reviews': 'Reviews - Srappi',
    '/contact': 'Contact Us - Srappi',
    '/blog': 'Blog - Srappi',
    '/gallery': 'Gallery - Srappi',
    '/history': 'Our History - Srappi',
    '/hours': 'Opening Hours - Srappi',
    '/special': 'Special Offers - Srappi',
    '/newsletter': 'Newsletter - Srappi'
  };

  var currentRoute = null;

  // ─── GitHub Pages 404 redirect recovery ───────────────────────
  // The 404.html redirects to index.html?p=about (for /Salesforce/about)
  // We need to read that, restore the proper URL, and clean up
  function recoverRedirectedRoute() {
    var params = new URLSearchParams(window.location.search);
    var redirectedPath = params.get('p');
    if (redirectedPath) {
      // Restore the clean URL
      redirectedPath = '/' + redirectedPath.replace(/~and~/g, '&');
      // Remove trailing slash
      if (redirectedPath !== '/' && redirectedPath.endsWith('/')) {
        redirectedPath = redirectedPath.slice(0, -1);
      }
      // Clean URL: replace ?p=... with the actual path
      var cleanUrl = window.location.protocol + '//' + window.location.host +
        BASE_PATH + redirectedPath + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
      return redirectedPath;
    }
    return null;
  }

  /**
   * Resolve the current route from the URL
   */
  function getCurrentRouteFromURL() {
    var path = window.location.pathname;
    // Strip basePath
    if (BASE_PATH && path.indexOf(BASE_PATH) === 0) {
      path = path.slice(BASE_PATH.length);
    }
    // Normalize
    if (!path || path === '/' || path === '/index.html') path = '/';
    if (path !== '/' && path.endsWith('/')) path = path.slice(0, -1);
    return ROUTES[path] ? path : '/';
  }

  /**
   * Build a full URL path including the base
   */
  function buildFullPath(route) {
    return BASE_PATH + (route === '/' ? '/' : route);
  }

  /**
   * Navigate to a route
   */
  function navigateTo(route, pushState) {
    if (pushState === undefined) pushState = true;

    var sectionId = ROUTES[route];
    if (!sectionId) {
      route = '/';
      sectionId = 'hero';
    }

    var title = TITLES[route] || 'Srappi';
    document.title = title;

    // Push state (only if it's a new route)
    if (pushState && route !== currentRoute) {
      window.history.pushState({ route: route }, title, buildFullPath(route));
    }

    currentRoute = route;

    // Update active nav link
    document.querySelectorAll('[data-route]').forEach(function (link) {
      if (link.classList.contains('nav-link') || link.closest('.flinks')) {
        link.classList.remove('active');
        if (link.getAttribute('data-route') === route) {
          link.classList.add('active');
        }
      }
    });

    // Close Bootstrap mobile navbar if open
    var navCollapse = document.getElementById('navmenu');
    if (navCollapse && navCollapse.classList.contains('show')) {
      var bsCollapse = bootstrap.Collapse.getInstance(navCollapse);
      if (bsCollapse) {
        bsCollapse.hide();
      } else {
        navCollapse.classList.remove('show');
      }
    }

    // Scroll to section
    var section = document.getElementById(sectionId);
    if (section) {
      var offset = route === '/' ? 0 : section.offsetTop - 78;
      setTimeout(function () {
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }, 80);
    }

    // Push virtual pageview to GTM dataLayer
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'spa_pageview',
      page: {
        path: route,
        title: title,
        url: window.location.origin + buildFullPath(route)
      }
    });

    // Dispatch custom event for Salesforce Data360 SDK
    window.dispatchEvent(new CustomEvent('spa:pageview', {
      detail: {
        route: route,
        sectionId: sectionId,
        title: title,
        url: window.location.origin + buildFullPath(route)
      }
    }));

    console.log('[Router] Navigated to:', route, '→ section:', sectionId);
  }

  /**
   * Handle clicks on route links
   */
  function handleRouteClick(e) {
    var link = e.target.closest('[data-route]');
    if (!link) return;

    // Don't intercept if modifier keys held (open in new tab, etc.)
    if (e.ctrlKey || e.metaKey || e.shiftKey) return;

    e.preventDefault();
    var route = link.getAttribute('data-route');
    navigateTo(route);
  }

  /**
   * Handle browser back/forward
   */
  window.addEventListener('popstate', function (e) {
    var route = '/';
    if (e.state && e.state.route) {
      route = e.state.route;
    } else {
      route = getCurrentRouteFromURL();
    }
    navigateTo(route, false);
  });

  /**
   * Update route on scroll (keeps URL in sync with visible section)
   */
  var scrollTimeout;

  function updateRouteOnScroll() {
    var sections = document.querySelectorAll('section[id]');
    var found = null;

    sections.forEach(function (sec) {
      var top = sec.offsetTop - 150;
      var bot = top + sec.offsetHeight;
      if (window.scrollY >= top && window.scrollY < bot) {
        found = sec.id;
      }
    });

    if (found && SECTION_TO_ROUTE[found]) {
      var route = SECTION_TO_ROUTE[found];
      if (route !== currentRoute) {
        currentRoute = route;
        var title = TITLES[route] || 'Srappi';
        document.title = title;
        window.history.replaceState({ route: route }, title, buildFullPath(route));

        // Update active nav link
        document.querySelectorAll('[data-route]').forEach(function (link) {
          if (link.classList.contains('nav-link') || link.closest('.flinks')) {
            link.classList.remove('active');
            if (link.getAttribute('data-route') === route) {
              link.classList.add('active');
            }
          }
        });

        // Push virtual pageview to GTM dataLayer
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: 'spa_pageview',
          page: {
            path: route,
            title: title,
            url: window.location.origin + buildFullPath(route)
          }
        });

        // Dispatch custom event for Salesforce Data360 SDK
        window.dispatchEvent(new CustomEvent('spa:pageview', {
          detail: {
            route: route,
            sectionId: found,
            title: title,
            url: window.location.origin + buildFullPath(route)
          }
        }));

        console.log('[Router] Scroll → route updated:', route);
      }
    }
  }

  window.addEventListener('scroll', function () {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(updateRouteOnScroll, 150);
  });

  /**
   * Init
   */
  function init() {
    // Check if we arrived from a 404 redirect
    var recoveredRoute = recoverRedirectedRoute();

    // Bind all route link clicks
    document.addEventListener('click', handleRouteClick);

    // Initial navigation
    var initialRoute = recoveredRoute || getCurrentRouteFromURL();
    navigateTo(initialRoute, false);

    // Set initial history state
    window.history.replaceState({ route: initialRoute }, document.title, buildFullPath(initialRoute));

    console.log('[Router] Initialized | basePath:', BASE_PATH, '| route:', initialRoute);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
