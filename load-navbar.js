document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("site-navbar");
  if (!mount) {
    console.warn("#site-navbar not found");
    return;
  }

  try {
    const response = await fetch(`/navbar.fragment?v=${Date.now()}`, {
    cache: "no-store"
    });

    console.log("navbar fetch status:", response.status, response.url);

    const html = await response.text();
    console.log("served file has advisory:", html.includes('data-panel="advisory"'));
    console.log("served file has affiliates:", html.includes('data-panel="affiliates"'));

    mount.innerHTML = html;

    console.log("bottomNav found:", !!document.getElementById("bottomNav"));
    console.log("bottomNavMenu found:", !!document.getElementById("bottomNavMenu"));
    console.log("served file has marker:", html.includes("TEST MARKER ADVISORY-123"));

    initNavbar();
  } catch (err) {
    console.error("Failed to load navbar:", err);
  }
});