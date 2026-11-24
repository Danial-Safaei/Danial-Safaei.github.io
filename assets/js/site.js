/*
 * site.js: behaviour and live data for danial-safaei.github.io
 *
 * The HTML is complete on its own: every number, card and figure is in the
 * committed page, and the reading level works without JavaScript in modern
 * browsers. This script only adds:
 *   - the theme toggle and the reading-level memory (both kept in this
 *     browser only, under "theme" and "level"),
 *   - the animated explainer, figure animations and the scroll watermark,
 *   - live data, each failing silently back to the committed HTML:
 *       data/scholar.json, data/publications.json, posts/posts.json,
 *       api.github.com (repository cards, date of the last site update).
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var GITHUB_USER = "Danial-Safaei";
  var REPO_NAMES = ["DFF", "handheld-pedestrian-forecasts", "RealTraj"];
  var LEVEL_NAMES = { 1: "Anyone", 2: "Student", 3: "Manager", 4: "Engineer", 5: "ML engineer", 6: "Researcher", 7: "Specialist" };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function store(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode: fine */ } }
  function parseDate(v) {
    var d = /^\d{4}-\d{2}-\d{2}$/.test(String(v)) ? new Date(v + "T00:00:00") : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  function fmtDay(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function onView(el, cb, threshold) {
    if (!el) return;
    if (reduceMotion || !("IntersectionObserver" in window)) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } });
    }, { threshold: threshold || 0.3 });
    io.observe(el);
  }

  /* ---------------- basics ---------------- */
  function setYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }
  function hardenLinks() {
    $$('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute("rel") || "").split(/\s+/).filter(Boolean);
      ["noopener", "noreferrer"].forEach(function (r) { if (rel.indexOf(r) < 0) rel.push(r); });
      a.setAttribute("rel", rel.join(" "));
    });
  }

  /* ---------------- theme ---------------- */
  function effectiveTheme() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  function setupTheme() {
    var btn = document.getElementById("toggle-dark");
    if (!btn) return;
    var label = function () {
      btn.setAttribute("aria-label", effectiveTheme() === "dark" ? "Switch to light theme" : "Switch to dark theme");
    };
    label();
    btn.addEventListener("click", function () {
      var next = effectiveTheme() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("theme", next);
      label();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mq.addEventListener) mq.addEventListener("change", label);
    }
  }

  /* ---------------- reading level ---------------- */
  function setupLevels() {
    var radios = $$(".lvl-radio");
    if (!radios.length) return;
    var picks = $$("label.pick");
    var status = document.getElementById("level-status");
    var anchoring = window.CSS && CSS.supports && CSS.supports("overflow-anchor", "auto");

    function apply(n, opts) {
      opts = opts || {};
      // keep the reader's place when text above them changes length
      var anchor = null, before = 0;
      if (!anchoring && opts.keepPlace) {
        var probe = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight * 0.4, 360));
        anchor = probe && probe.closest ? probe.closest("section, figure, article, li, p, div") : null;
        if (anchor) before = anchor.getBoundingClientRect().top;
      }
      root.setAttribute("data-level", n);
      radios.forEach(function (r) { r.checked = r.value === n; });
      picks.forEach(function (p) { p.setAttribute("aria-pressed", String(p.htmlFor === "lv-" + n)); });
      if (anchor) window.scrollBy(0, anchor.getBoundingClientRect().top - before);
      if (opts.save) store("level", n);
      if (opts.announce && status) {
        status.textContent = "Reading level " + n + ", " + LEVEL_NAMES[n] + ". The text on this page has changed to match.";
      }
    }
    var start = root.getAttribute("data-level");
    if (!/^[1-7]$/.test(start || "")) start = "3";
    apply(start, {});

    radios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (r.checked) apply(r.value, { save: true, announce: true, keepPlace: true });
      });
    });
    // the large reader cards are labels; make them keyboard buttons too
    picks.forEach(function (p) {
      p.setAttribute("tabindex", "0");
      p.setAttribute("role", "button");
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.click(); }
      });
    });
  }

  /* ---------------- animated explainer ---------------- */
  function setupExplainer() {
    var fig = document.getElementById("explainer");
    if (!fig) return;
    var stage = $(".ex-stage", fig);
    var steps = $$(".ex-step", fig);
    var controls = $(".ex-controls", fig);
    var toggle = $('[data-ex="toggle"]', fig);
    var restart = $('[data-ex="restart"]', fig);
    var bar = $(".ex-progress i", fig);
    var toggleText = toggle ? $("span", toggle) : null;
    var DUR = [5200, 5200, 4600, 7000, 6200, 7000, 5200];
    var step = 7, playing = false, ended = false, t0 = 0, elapsed = 0, raf = 0, autoplayed = false, visible = false, wasPlaying = false;

    fig.classList.add("is-js");
    if (controls) controls.hidden = false;

    function show(n) {
      step = n;
      stage.style.setProperty("--k", String(n));
      steps.forEach(function (li, i) {
        var cur = i + 1 === n;
        li.classList.toggle("is-current", cur);
        var b = $(".ex-jump", li);
        if (b) { if (cur) b.setAttribute("aria-current", "step"); else b.removeAttribute("aria-current"); }
      });
    }
    function label() {
      fig.classList.toggle("is-playing", playing);
      if (toggleText) toggleText.textContent = playing ? "Pause" : (ended ? "Play again" : "Play");
    }
    function frame(now) {
      if (!playing) return;
      var spent = elapsed + (now - t0);
      var d = DUR[step - 1];
      if (bar) bar.style.width = Math.min(100, (spent / d) * 100) + "%";
      if (spent >= d) {
        if (step >= 7) { playing = false; ended = true; elapsed = 0; label(); return; }
        show(step + 1); elapsed = 0; t0 = now;
      }
      raf = requestAnimationFrame(frame);
    }
    function play() {
      if (ended || (step === 7 && elapsed === 0)) { show(1); ended = false; elapsed = 0; }
      playing = true; t0 = performance.now(); label();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    }
    function pause() {
      if (!playing) return;
      elapsed += performance.now() - t0; playing = false; label();
      cancelAnimationFrame(raf);
    }
    if (toggle) toggle.addEventListener("click", function () { if (playing) pause(); else play(); });
    if (restart) restart.addEventListener("click", function () { show(1); ended = false; elapsed = 0; play(); });
    $$(".ex-jump", fig).forEach(function (b) {
      b.addEventListener("click", function () {
        var n = Number(b.getAttribute("data-step"));
        show(n); elapsed = 0; ended = false; t0 = performance.now();
        if (bar) bar.style.width = playing ? "0%" : "100%";
        if (!playing) label();
      });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && playing) { wasPlaying = true; pause(); }
      else if (!document.hidden && wasPlaying && visible) { wasPlaying = false; play(); }
    });
    show(7);
    label();
    if (bar) bar.style.width = "100%";
    if (reduceMotion || !("IntersectionObserver" in window)) return;   // reader drives it by hand
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible = e.isIntersecting;
        if (visible && !autoplayed) { autoplayed = true; show(1); elapsed = 0; play(); }
        else if (!visible && playing) { wasPlaying = true; pause(); }
        else if (visible && wasPlaying) { wasPlaying = false; play(); }
      });
    }, { threshold: 0.45 });
    io.observe(stage);
  }

  /* ---------------- figures, pipeline, watermark ---------------- */
  function setupFigures() {
    $$(".grow").forEach(function (f) { onView(f, function () { f.classList.add("is-in"); }, 0.35); });
    var pipe = $(".pipe");
    if (pipe) onView(pipe, function () { pipe.classList.add("is-in"); }, 0.25);
    var chart = document.getElementById("cite-chart");
    if (chart) onView(chart, function () { chart.classList.add("is-in"); }, 0.4);
  }
  function setupWatermark() {
    var wm = $(".watermark");
    if (!wm) return;
    var ticking = false;
    function update() {
      ticking = false;
      var room = document.documentElement.scrollHeight - window.innerHeight;
      var v = room < 320 ? 0.8 : Math.max(0, Math.min(1, (window.scrollY - 140) / 520));
      root.style.setProperty("--wm", v.toFixed(3));
    }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }
  function setupToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;
    var ticking = false;
    function update() { ticking = false; btn.classList.toggle("is-visible", window.scrollY > 900); }
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }
  function setupActiveNav() {
    var links = $$('.nav a[href^="#"]');
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("is-active"); });
        var a = map[e.target.id];
        if (a) a.classList.add("is-active");
      });
    }, { rootMargin: "-35% 0px -60% 0px" });
    $$("main > section").forEach(function (s) { io.observe(s); });   // the hero clears the highlight
  }
  function setupVideos() {
    var vids = $$("video");
    vids.forEach(function (v) {
      v.addEventListener("play", function () { vids.forEach(function (o) { if (o !== v && !o.paused) o.pause(); }); });
    });
  }
  function setupMenu() {
    var menu = $("details.menu");
    if (!menu) return;
    $$("a", menu).forEach(function (a) { a.addEventListener("click", function () { menu.open = false; }); });
    document.addEventListener("click", function (e) { if (menu.open && !menu.contains(e.target)) menu.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.open) { menu.open = false; $("summary", menu).focus(); } });
  }
  function setupCopyEmail() {
    var btn = document.getElementById("copy-email");
    var addr = document.getElementById("email-addr");
    var status = document.getElementById("copy-status");
    if (!btn || !addr) return;
    btn.hidden = false;
    var text = $("span", btn);
    function done(msg) {
      if (text) text.textContent = msg;
      if (status) status.textContent = msg === "Copied" ? "Email address copied." : "Select the address to copy it.";
      setTimeout(function () { if (text) text.textContent = "Copy"; }, 2200);
    }
    function selectIt() {
      var r = document.createRange(); r.selectNodeContents(addr);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    btn.addEventListener("click", function () {
      var value = addr.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(function () { done("Copied"); }, function () { selectIt(); done("Selected"); });
      } else { selectIt(); done("Selected"); }
    });
  }
  function setupPrint() {
    var btn = document.getElementById("print-cv");
    if (!btn) return;
    btn.hidden = false;
    btn.addEventListener("click", function () { window.print(); });
  }

  /* ---------------- live data ---------------- */
  function fetchJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }
  function setNumber(id, v) {
    var el = document.getElementById(id);
    if (!el || typeof v !== "number" || !isFinite(v)) return;
    if (el.hasAttribute("data-target")) el.setAttribute("data-target", String(v));
    el.textContent = String(v);
  }
  function setText(id, v) { var el = document.getElementById(id); if (el && v) el.textContent = v; }

  function loadScholar() {
    if (!document.getElementById("m-citations") && !document.getElementById("cv-citations")) return;
    fetchJson("data/scholar.json").then(function (d) {
      if (!d || typeof d.citations !== "number") return;
      setNumber("m-citations", d.citations); setNumber("m-h", d.hIndex); setNumber("m-i10", d.i10Index);
      setNumber("cv-citations", d.citations); setNumber("cv-h", d.hIndex); setNumber("cv-i10", d.i10Index);
      var u = parseDate(d.updated);
      if (u) { setText("scholar-updated", MONTHS[u.getMonth()] + " " + u.getFullYear()); setText("cv-scholar-date", MONTHS_LONG[u.getMonth()] + " " + u.getFullYear()); }
      var chart = document.getElementById("cite-chart");
      var per = d.perYear || {};
      var years = Object.keys(per).sort().slice(-4);
      if (!chart || !years.length) return;
      var thisYear = String(new Date().getFullYear());
      var peak = Math.max.apply(null, years.map(function (y) { return per[y]; }).concat([1]));
      var wasIn = chart.classList.contains("is-in");
      chart.innerHTML = years.map(function (y) {
        var h = Math.max(Math.round((per[y] / peak) * 100), 4);
        return '<div class="cite-col"><span class="cite-val">' + esc(per[y]) + "</span>" +
          '<span class="cite-bar' + (y === thisYear ? " ytd" : "") + '" style="--h: ' + h + '"></span>' +
          '<span class="cite-year">' + esc(y) + "</span></div>";
      }).join("");
      chart.setAttribute("aria-label", "Citations per year: " + years.map(function (y) { return per[y] + " in " + y; }).join(", ") + ". Source: Google Scholar.");
      if (wasIn) chart.classList.add("is-in");
    }).catch(function () { /* keep the committed numbers */ });
  }

  function renderPub(p) {
    var tags = (p.tags || []).map(function (t) { return '<span class="tag tag-' + esc(t.type) + '">' + esc(t.label) + "</span>"; }).join("");
    var authors = esc(p.authors).replace(/D\. Safaei/g, '<span class="me">D. Safaei</span>');
    var links = (p.links || []).map(function (l) {
      var ext = /^https?:/i.test(l.href);
      return '<a href="' + esc(l.href) + '"' + (ext ? ' target="_blank" rel="noopener noreferrer"' : "") + ">" + esc(l.label) + "</a>";
    }).join("");
    var n = Number(p.cites);
    var cites = isFinite(n) && n > 0 && p.cites !== null ? '<span class="pub-cites">' + n + " citation" + (n === 1 ? "" : "s") + "</span>" : "";
    var first = p.links && p.links[0] ? p.links[0].href : null;
    var title = first ? '<a href="' + esc(first) + '" target="_blank" rel="noopener noreferrer">' + esc(p.title) + "</a>" : esc(p.title);
    return '<li class="pub"><div class="pub-tags"><span class="pub-year">' + esc(p.year) + "</span>" + tags + "</div>" +
      '<h4 class="pub-title">' + title + '</h4><p class="pub-authors">' + authors + "</p>" +
      '<p class="pub-venue">' + p.venue + '</p><p class="pub-links">' + links + cites + "</p></li>";
  }
  function loadPublications() {
    var rootEl = document.getElementById("pub-root");
    var wantsCount = document.getElementById("m-works") || document.getElementById("cv-works");
    if (!rootEl && !wantsCount) return;
    fetchJson("data/publications.json").then(function (d) {
      var pubs = (d && d.publications) || [];
      if (!pubs.length) return;
      setNumber("m-works", pubs.length); setNumber("cv-works", pubs.length);
      if (!rootEl) return;
      var peer = pubs.filter(function (p) { return p.group === "peer"; });
      var pre = pubs.filter(function (p) { return p.group === "preprint"; });
      var recent = pre.filter(function (p) { return Number(p.year) >= 2026; });
      var older = pre.filter(function (p) { return Number(p.year) < 2026; });
      var cnt = function (n) { return n + " work" + (n === 1 ? "" : "s"); };
      var openOlder = rootEl.querySelector("details.pub-group") && rootEl.querySelector("details.pub-group").open;
      var html = "";
      if (peer.length) html += '<div class="pub-group"><div class="pub-group-head"><h3>Peer-reviewed</h3><span class="pub-group-count">' + cnt(peer.length) + '</span></div><ol class="pub-list">' + peer.map(renderPub).join("") + "</ol></div>";
      if (recent.length) html += '<div class="pub-group"><div class="pub-group-head"><h3>Preprints</h3><span class="pub-group-count">' + cnt(recent.length) + '</span></div><ol class="pub-list">' + recent.map(renderPub).join("") + "</ol></div>";
      if (older.length) html += '<details class="pub-group"' + (openOlder ? " open" : "") + '><summary class="pub-group-head"><h3>Earlier preprints, 2023 to 2024</h3><span class="pub-group-count">' + cnt(older.length) + '</span></summary><ol class="pub-list">' + older.map(renderPub).join("") + "</ol></details>";
      html += '<p class="pub-note">The earlier preprints are collaborative machine-learning work in biomedicine, from 2023 to 2024.</p>';
      rootEl.innerHTML = html;
    }).catch(function () { /* keep the committed list */ });
  }

  function loadRepos() {
    var rootEl = document.getElementById("repo-root");
    if (!rootEl) return;
    fetchJson("https://api.github.com/users/" + GITHUB_USER + "/repos?per_page=100&sort=updated").then(function (repos) {
      if (!Array.isArray(repos)) return;
      var by = {};
      repos.forEach(function (r) { by[r.name] = r; });
      var chosen = REPO_NAMES.map(function (n) { return by[n]; }).filter(Boolean);
      if (!chosen.length) return;
      rootEl.innerHTML = chosen.map(function (r) {
        var u = parseDate(r.pushed_at);
        return '<a class="repo-card" href="' + esc(r.html_url) + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="repo-name">' + esc(r.name) + '</span><span class="repo-desc">' + esc(r.description || "") + "</span>" +
          '<span class="repo-meta">' + (r.language ? "<span>" + esc(r.language) + "</span>" : "") +
          (r.stargazers_count ? "<span>★ " + esc(r.stargazers_count) + "</span>" : "") +
          (u ? "<span>updated " + esc(fmtDay(u)) + "</span>" : "") + "</span></a>";
      }).join("");
    }).catch(function () { /* keep the committed cards */ });
  }

  function loadHomePosts() {
    var rootEl = document.getElementById("home-posts");
    if (!rootEl) return;
    fetchJson("posts/posts.json").then(function (posts) {
      if (!Array.isArray(posts) || !posts.length) return;
      var latest = posts.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }).slice(0, 3);
      rootEl.innerHTML = latest.map(function (p) {
        var d = parseDate(p.date);
        return '<a class="home-post" href="blog.html?post=' + encodeURIComponent(p.slug) + '">' +
          '<span class="post-date">' + (d ? fmtDay(d) : esc(p.date)) + "</span><h3>" + esc(p.title) + "</h3><p>" + esc(p.summary || "") + "</p></a>";
      }).join("");
    }).catch(function () { /* keep the committed cards */ });
  }

  function loadSiteUpdated() {
    var el = document.getElementById("site-updated");
    if (!el) return;
    fetchJson("https://api.github.com/repos/" + GITHUB_USER + "/" + GITHUB_USER + ".github.io/commits?per_page=1").then(function (c) {
      var when = c && c[0] && c[0].commit && c[0].commit.committer && c[0].commit.committer.date;
      var d = when ? parseDate(when) : null;
      if (d) el.textContent = (el.getAttribute("data-prefix") || "Site updated") + " " + fmtDay(d);
    }).catch(function () { /* keep the static date */ });
  }

  /* ---------------- start ---------------- */
  function start() {
    [setYear, hardenLinks, setupTheme, setupLevels, setupExplainer, setupFigures, setupWatermark,
      setupToTop, setupActiveNav, setupVideos, setupMenu, setupCopyEmail, setupPrint].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error(e); }
    });
    [loadScholar, loadPublications, loadRepos, loadHomePosts, loadSiteUpdated].forEach(function (fn) {
      try { fn(); } catch (e) { if (window.console) console.error(e); }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
