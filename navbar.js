const DROPDOWN_ALIGNMENT_MIN = 1600;
const MOBILE_BREAKPOINT = 860;

function shouldUsePerItemDropdownAlignment() {
  return window.innerWidth >= DROPDOWN_ALIGNMENT_MIN;
}

function isMobileNav() {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

function syncDropdownLinksStart(triggerItem = null) {
  const wrap = document.querySelector(".topbar-nav-wrap");
  if (!wrap) return;

  const wrapRect = wrap.getBoundingClientRect();

  // large screens: align to hovered/open item
  if (shouldUsePerItemDropdownAlignment() && triggerItem) {
    const itemRect = triggerItem.getBoundingClientRect();
    const start = itemRect.left - wrapRect.left;
    document.documentElement.style.setProperty("--dropdown-links-start", `${start}px`);
    return;
  }

  // smaller screens: use original first-link alignment
  const firstLink = document.querySelector(".topbar-nav__links .topbar-nav__link");
  if (!firstLink) return;

  const linkRect = firstLink.getBoundingClientRect();
  const start = linkRect.left - wrapRect.left;
  document.documentElement.style.setProperty("--dropdown-links-start", `${start}px`);
}

function runDropdownSync(triggerItem = null) {
  syncDropdownLinksStart(triggerItem);

  requestAnimationFrame(() => {
    syncDropdownLinksStart(triggerItem);

    requestAnimationFrame(() => {
      syncDropdownLinksStart(triggerItem);
    });
  });
}

function initTopbarVersion() {
  const wrap = document.querySelector(".topbar-nav-wrap");
  if (!wrap) return false;
  if (wrap.dataset.initialized === "true") return true;
  wrap.dataset.initialized = "true";

  const dropdownItems = wrap.querySelectorAll(".topbar-nav__item.has-dd");
  const simpleItems = wrap.querySelectorAll(".topbar-nav__item:not(.has-dd)");
  const dropdowns = wrap.querySelectorAll(".topbar-dropdown");

  const menuBtn = document.getElementById("topbarMenuBtn");

  const mobileMenu = document.getElementById("topbarMobileMenu");
  const mobileScreens = mobileMenu ? mobileMenu.querySelectorAll(".topbar-mobile-menu__screen") : [];
  const mobileOpenButtons = mobileMenu ? mobileMenu.querySelectorAll("[data-mobile-open]") : [];
  const mobileBackButtons = mobileMenu ? mobileMenu.querySelectorAll("[data-mobile-back]") : [];

  const desktopMenu = document.getElementById("topbarDesktopMenu");
  const desktopMainItems = desktopMenu ? desktopMenu.querySelectorAll("[data-desktop-menu]") : [];
  const desktopPanels = desktopMenu ? desktopMenu.querySelectorAll("[data-desktop-panel]") : [];

  let closeTimer = null;
  let activeDropdownItem = null;
  let mobileMenuOpen = false;
  let desktopMenuOpen = false;

  function clearCloseTimer() {
    if (closeTimer) {
      clearTimeout(closeTimer);
      closeTimer = null;
    }
  }

  function closeAllDropdowns() {
    activeDropdownItem = null;

    dropdownItems.forEach((item) => item.classList.remove("is-open"));
    dropdowns.forEach((panel) => panel.classList.remove("is-open"));

    runDropdownSync();
  }

function openPanel(name) {
  clearCloseTimer();

  let matchedItem = null;
  let matchedPanel = null;

  dropdownItems.forEach((item) => {
    const isActive = item.dataset.dd === name;
    item.classList.toggle("is-open", isActive);
    if (isActive) matchedItem = item;
  });

  dropdowns.forEach((panel) => {
    const isActive = panel.dataset.panel === name;
    panel.classList.toggle("is-open", isActive);
    if (isActive) matchedPanel = panel;
  });

if (matchedItem && matchedPanel) {
  const wrapRect = wrap.getBoundingClientRect();
  const link = matchedItem.querySelector(".topbar-nav__link");
  const linkRect = link.getBoundingClientRect();

  const INNER_PAD_LEFT = 28; // must match CSS padding-left
  const left = (linkRect.left - wrapRect.left) - INNER_PAD_LEFT;

  matchedPanel.style.left = `${left}px`;
}

  activeDropdownItem = matchedItem;
}
  function scheduleClose(delay = 90) {
    clearCloseTimer();
    closeTimer = setTimeout(closeAllDropdowns, delay);
  }

  function showMobileScreen(name) {
    if (!mobileMenu) return;

    mobileScreens.forEach((screen) => {
      screen.classList.toggle("is-active", screen.dataset.screen === name);
    });
  }

  function openMobileMenu() {
    if (!mobileMenu) return;

    mobileMenuOpen = true;
    wrap.classList.add("is-mobile-menu-open");
    document.body.classList.add("topbar-mobile-lock");
    menuBtn?.setAttribute("aria-label", "Close menu");
    menuBtn?.setAttribute("aria-expanded", "true");
    mobileMenu.setAttribute("aria-hidden", "false");

    showMobileScreen("main");
    closeAllDropdowns();
    closeDesktopMenu();
  }

  function closeMobileMenu() {
    if (!mobileMenu) return;

    mobileMenuOpen = false;
    wrap.classList.remove("is-mobile-menu-open");
    document.body.classList.remove("topbar-mobile-lock");
    mobileMenu.setAttribute("aria-hidden", "true");

    if (!desktopMenuOpen) {
      menuBtn?.setAttribute("aria-label", "Open menu");
      menuBtn?.setAttribute("aria-expanded", "false");
    }

    showMobileScreen("main");
  }

  function toggleMobileMenu() {
    if (mobileMenuOpen) closeMobileMenu();
    else openMobileMenu();
  }

  function setDesktopActive(name) {
    if (!desktopMenu) return;

    desktopMainItems.forEach((item) => {
      const active = item.dataset.desktopMenu === name;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
    });

    desktopPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.desktopPanel === name);
    });
  }

  function openDesktopMenu() {
    if (!desktopMenu) return;

    desktopMenuOpen = true;
    wrap.classList.add("is-desktop-menu-open");
    menuBtn?.setAttribute("aria-label", "Close menu");
    menuBtn?.setAttribute("aria-expanded", "true");
    desktopMenu.setAttribute("aria-hidden", "false");

    setDesktopActive("consulting");
    closeAllDropdowns();
    closeMobileMenu();
  }

  function closeDesktopMenu() {
    if (!desktopMenu) return;

    desktopMenuOpen = false;
    wrap.classList.remove("is-desktop-menu-open");
    desktopMenu.setAttribute("aria-hidden", "true");

    if (!mobileMenuOpen) {
      menuBtn?.setAttribute("aria-label", "Open menu");
      menuBtn?.setAttribute("aria-expanded", "false");
    }
  }

  function toggleDesktopMenu() {
    if (desktopMenuOpen) closeDesktopMenu();
    else openDesktopMenu();
  }

  dropdownItems.forEach((item) => {
    const name = item.dataset.dd;

    item.addEventListener("mouseenter", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      openPanel(name);
    });

    item.addEventListener("mouseleave", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      scheduleClose();
    });

    item.addEventListener("focusin", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      openPanel(name);
    });
  });

  simpleItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      closeAllDropdowns();
    });

    item.addEventListener("focusin", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      closeAllDropdowns();
    });
  });

  dropdowns.forEach((panel) => {
    panel.addEventListener("mouseenter", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      clearCloseTimer();
    });

    panel.addEventListener("mouseleave", () => {
      if (isMobileNav() || desktopMenuOpen) return;
      scheduleClose();
    });
  });

  wrap.addEventListener("mouseleave", () => {
    if (isMobileNav() || desktopMenuOpen) return;
    scheduleClose(0);
  });

  wrap.addEventListener("mouseenter", () => {
    if (isMobileNav() || desktopMenuOpen) return;
    clearCloseTimer();
  });

  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      if (isMobileNav()) {
        if (desktopMenuOpen) closeDesktopMenu();
        toggleMobileMenu();
      } else {
        if (mobileMenuOpen) closeMobileMenu();
        toggleDesktopMenu();
      }
    });
  }

  mobileOpenButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const screen = btn.dataset.mobileOpen;
      if (!screen) return;
      showMobileScreen(screen);
    });
  });

  mobileBackButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      showMobileScreen("main");
    });
  });

  desktopMainItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      const name = item.dataset.desktopMenu;
      if (!name) return;
      setDesktopActive(name);
    });

    item.addEventListener("focusin", () => {
      const name = item.dataset.desktopMenu;
      if (!name) return;
      setDesktopActive(name);
    });

    item.addEventListener("click", () => {
      const name = item.dataset.desktopMenu;
      if (!name) return;
      setDesktopActive(name);
    });
  });

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) {
      closeAllDropdowns();

      if (mobileMenuOpen) closeMobileMenu();
      if (desktopMenuOpen) closeDesktopMenu();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllDropdowns();

      if (mobileMenuOpen) closeMobileMenu();
      if (desktopMenuOpen) closeDesktopMenu();
    }
  });

  const currentPath = window.location.pathname.endsWith("/")
    ? window.location.pathname + "index.html"
    : window.location.pathname;

  const currentFile = currentPath.split("/").pop();

  wrap.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    const hrefFile = href.split("/").pop();
    if (hrefFile === currentFile) {
      link.classList.add("is-active");
    }
  });

  function rerunActiveSync() {
    if (!isMobileNav() && !desktopMenuOpen) {
      runDropdownSync(activeDropdownItem);
    }
  }

  function handleResize() {
    if (!isMobileNav() && mobileMenuOpen) {
      closeMobileMenu();
    }

    if (isMobileNav() && desktopMenuOpen) {
      closeDesktopMenu();
    }

    rerunActiveSync();
  }

  runDropdownSync();

  window.addEventListener("load", rerunActiveSync);
  window.addEventListener("resize", handleResize);

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(rerunActiveSync).catch(() => {});
  }

  return true;
}

function waitForTopbarInit() {
  if (initTopbarVersion()) return;

  const observer = new MutationObserver(() => {
    if (initTopbarVersion()) {
      observer.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

document.addEventListener("DOMContentLoaded", waitForTopbarInit);
window.addEventListener("load", waitForTopbarInit);

