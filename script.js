// Echo Station – Global JS Utilities

(function(){
    const doc = document;

    // Mobile menu toggle (W3CSS hide/show)
    const menuToggle = doc.getElementById('menuToggle');
    const mobileMenu = doc.getElementById('mobileMenu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            const hidden = mobileMenu.classList.contains('w3-hide');
            mobileMenu.classList.toggle('w3-hide');
            menuToggle.setAttribute('aria-expanded', String(hidden));
        });
    }

    // Active nav link highlighter
    (function highlightActive() {
        const path = location.pathname.split('/').pop() || 'index.html';
        const links = Array.from(doc.querySelectorAll('#main-nav .nav-link'));
        links.forEach(a => {
            const isActive = a.getAttribute('href') === path;
            if (isActive) a.classList.add('active');
        });
    })();

    // Smooth scrolling helper
    function smoothScrollTo(target) {
        try {
            doc.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) { /* noop */ }
    }
    doc.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const anchor = t.closest('a[href^="#"]');
        if (anchor) {
            const id = anchor.getAttribute('href');
            if (id && id.length > 1) {
                e.preventDefault();
                smoothScrollTo(id);
            }
        }
    });

    // Modal system (open/close via data attributes)
    const modalOverlay = doc.getElementById('globalModal');
    const body = doc.body;
    let lastFocused = null;
    const modalHistory = [];

    function openModal(content) {
        if (!modalOverlay) return;
        lastFocused = doc.activeElement;
        const bodyEl = modalOverlay.querySelector('.modal-body');
        if (bodyEl) {
            const prev = bodyEl.innerHTML;
            if (prev && prev.trim().length) {
                modalHistory.push(prev);
            }
            if (content) bodyEl.innerHTML = content;
        }
        body.classList.add('modal-open');
        modalOverlay.removeAttribute('aria-hidden');
        const firstBtn = modalOverlay.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstBtn instanceof HTMLElement) firstBtn.focus();
    }

    function closeModal() {
        if (!modalOverlay) return;
        body.classList.remove('modal-open');
        modalOverlay.setAttribute('aria-hidden', 'true');
        modalHistory.length = 0;
        if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function backModal() {
        if (!modalOverlay) return;
        const bodyEl = modalOverlay.querySelector('.modal-body');
        if (!bodyEl) return;
        const prev = modalHistory.pop();
        if (prev !== undefined) {
            bodyEl.innerHTML = prev;
            const firstBtn = modalOverlay.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (firstBtn instanceof HTMLElement) firstBtn.focus();
        } else {
            closeModal();
        }
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        modalOverlay.querySelector('[data-modal-close]')?.addEventListener('click', closeModal);
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        doc.addEventListener('keydown', (e) => {
            if (!body.classList.contains('modal-open') || e.key !== 'Tab') return;
            const focusables = modalOverlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            const list = Array.from(focusables).filter(el => el instanceof HTMLElement);
            if (list.length === 0) return;
            const first = list[0];
            const last = list[list.length - 1];
            const active = doc.activeElement;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    // Export minimal modal API to window for demos
    window.EchoModal = { open: openModal, close: closeModal, back: backModal };

    // Local storage helpers (namespaced)
    const storeNs = 'echo-station:';
    function storageSet(key, value) {
        try {
            localStorage.setItem(storeNs + key, JSON.stringify(value));
        } catch (e) { /* noop */ }
    }
    function storageGet(key, fallback) {
        try {
            const v = localStorage.getItem(storeNs + key);
            return v ? JSON.parse(v) : fallback;
        } catch (e) {
            return fallback;
        }
    }
    window.EchoStore = { set: storageSet, get: storageGet };

    // Simple local data loader
    function loadLocalData(payload) {
        if (typeof payload === 'string') {
            try {
                return JSON.parse(payload);
            } catch (e) {
                return null;
            }
        }
        if (typeof payload === 'object') return payload;
        return null;
    }
    window.EchoData = { load: loadLocalData };

    // subtle parallax for elements with data-parallax attribute
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReduced) {
        const parallaxNodes = Array.from(doc.querySelectorAll('[data-parallax]'));
        if (parallaxNodes.length) {
            window.addEventListener('scroll', () => {
                const y = window.scrollY;
                parallaxNodes.forEach(el => {
                    const depth = parseFloat(el.getAttribute('data-parallax')) || 0.15;
                    el.style.transform = `translateY(${Math.round(y * -depth)}px)`;
                });
            }, { passive: true });
        }
    }

    // Dim focus on hero when hovering content
    const hero = doc.querySelector('.hero');
    const heroContent = hero?.querySelector('.content');
    if (hero && heroContent) {
        heroContent.addEventListener('mouseenter', () => hero.classList.add('focus'));
        heroContent.addEventListener('mouseleave', () => hero.classList.remove('focus'));
    }

    // COMMUNITY: client-side notes preloaded notes
    const feedEl = doc.getElementById('noteFeed');
    function getNotes() { return window.EchoStore.get('communityNotes', []); }
    function setNotes(arr) { window.EchoStore.set('communityNotes', arr); }
    function seedNotesIfEmpty() {
        const existing = getNotes();
        if (existing && existing.length) return;
        const now = new Date();
        const samples = [
            { user: '', text: '“This track reminded me of when I missed the 12:47 and walked across town under orange lamps.”', time: now.toLocaleDateString(undefined, { month:'short', day:'2-digit' }) + ' • 23:41', rot: (Math.random()*4-2).toFixed(2), link: 'https://open.spotify.com/playlist/quiet-lamps' },
            { user: 'anon', text: '“Quiet music and empty carriages are the safest place in the world.”', time: now.toLocaleDateString(undefined, { month:'short', day:'2-digit' }) + ' • 00:12', rot: (Math.random()*4-2).toFixed(2), img: 'assets/images/playlists/cover-1.jpg' },
            { user: '', text: '“Today was heavy. This song held me anyway.”', time: now.toLocaleDateString(undefined, { month:'short', day:'2-digit' }) + ' • 01:08', rot: (Math.random()*4-2).toFixed(2) },
            { user: 'm', text: '“Windows fogged, tapes spinning, city breathing slow.”', time: now.toLocaleDateString(undefined, { month:'short', day:'2-digit' }) + ' • 02:03', rot: (Math.random()*4-2).toFixed(2), img: 'assets/images/artists/portrait-2.jpg', link: 'https://youtu.be/night-train' }
        ];
        setNotes(samples);
    }
    function renderNotes() {
        if (!feedEl) return;
        const notes = getNotes();
        feedEl.innerHTML = notes.map(n => `
            <article class="note-card" style="--rot:${n.rot}deg">
                <div class="meta">${n.user ? n.user + ' • ' : ''}${n.time || ''}</div>
                <div class="message">${n.text}</div>
                ${n.img || n.link ? `
                <div class="note-attach">
                    ${n.img ? `<img src="${n.img}" alt="attached image" loading="lazy" onerror="this.style.display='none'">` : ''}
                    ${n.link ? `<a href="#" data-note-link="${encodeURIComponent(n.link)}">Open playlist link</a>` : ''}
                </div>` : ''}
            </article>`).join('');
    }
    seedNotesIfEmpty();
    renderNotes();
    const openWrite = doc.getElementById('openWrite');
    if (openWrite) {
        openWrite.addEventListener('click', () => {
            window.EchoModal.open(`
                <div class="sheet">
                    <h3>Write a note</h3>
                    <p class="tip">share a feeling, a moment, a memory</p>
                    <input id="noteUser" class="pencil" placeholder="Name (optional)" style="min-height:40px" />
                    <textarea id="noteText" class="pencil mt-s" placeholder="Your note..." ></textarea>
                    <input id="noteImage" class="pencil mt-s" placeholder="Include an image (optional)" style="min-height:40px" />
                    <input id="noteLink" class="pencil mt-s" placeholder="Link a playlist (optional)" style="min-height:40px" />
                    <p id="noteError" class="tip" style="color:#c06060; font-style: normal; display:none; margin-top:8px"> </p>
                    <div class="sheet-actions">
                        <button class="service-btn" id="noteSubmit">Pin note</button>
                        <button class="service-btn" data-modal-close>Cancel</button>
                    </div>
                </div>
            `);
            setTimeout(() => {
                const submit = doc.getElementById('noteSubmit');
                submit?.addEventListener('click', async () => {
                    const userEl = doc.getElementById('noteUser');
                    const textEl = doc.getElementById('noteText');
                    const imgEl = doc.getElementById('noteImage');
                    const linkEl = doc.getElementById('noteLink');
                    const errEl = doc.getElementById('noteError');
                    const user = userEl && 'value' in userEl ? String(userEl.value).trim() : '';
                    const text = textEl && 'value' in textEl ? String(textEl.value).trim() : '';
                    const img = imgEl && 'value' in imgEl ? String(imgEl.value).trim() : '';
                    const link = linkEl && 'value' in linkEl ? String(linkEl.value).trim() : '';
                    if (!text) return;
                    // validation
                    const imgOk = !img || (/^https?:\/\//i.test(img) && /\.(jpe?g|png|gif|webp)$/i.test(img));
                    const linkOk = !link || /^https?:\/\/(open\.spotify\.com|music\.youtube\.com|www\.youtube\.com|youtube\.com|youtu\.be)\/.+/i.test(link);
                    if (!imgOk || !linkOk) {
                        if (errEl) {
                            errEl.textContent = !imgOk ? 'Image must be a full URL ending in .jpg, .jpeg, .png, .gif, or .webp' : 'Playlist link must start with https://open.spotify.com or a YouTube URL';
                            errEl.style.display = 'block';
                        }
                        return;
                    }
                    if (errEl) {
                        errEl.style.display = 'none';
                        errEl.textContent = '';
                    }
                    // checks if image exists: try to load image, if it fails, hide image but still post note
                    async function imageExists(url) {
                        return await new Promise((resolve) => {
                            if (!url) return resolve(false);
                            try {
                                const pic = new Image();
                                const timer = setTimeout(() => { resolve(false); }, 3000);
                                pic.onload = () => { clearTimeout(timer); resolve(true); };
                                pic.onerror = () => { clearTimeout(timer); resolve(false); };
                                pic.src = url;
                            } catch (e) { resolve(false); }
                        });
                    }
                    let finalImg = img;
                    if (img) {
                        const ok = await imageExists(img);
                        if (!ok) finalImg = '';
                    }
                    const now = new Date();
                    const time = now.toLocaleString(undefined, { hour: '2-digit', minute:'2-digit', day:'2-digit', month:'short' });
                    const rot = (Math.random()*4-2).toFixed(2);
                    const next = [{ user, text, time, rot, img: finalImg, link }, ...getNotes()].slice(0, 60);
                    setNotes(next);
                    renderNotes();
                    window.EchoModal.close();
                });
            }, 0);
        });
    }

    // MAP: hover card and navigation
    const stations = doc.querySelectorAll('.station');
    if (stations.length) {
        const wrap = doc.querySelector('.map-wrap');
        const card = doc.getElementById('mapCard');
        function showCard(x, y, title, mood) {
            if (!card || !wrap) return;
            card.innerHTML = `<h4>${title}</h4><p>“${mood}”</p>`;
            const wrapRect = wrap.getBoundingClientRect();
            card.style.left = `${x - wrapRect.left}px`;
            card.style.top = `${y - wrapRect.top - 10}px`;
            card.classList.add('show');
            card.setAttribute('aria-hidden', 'false');
        }
        function hideCard() {
            if (!card) return;
            card.classList.remove('show');
            card.setAttribute('aria-hidden', 'true');
        }
        stations.forEach(s => {
            s.addEventListener('click', () => {
                const href = s.getAttribute('data-href');
                if (href) location.href = href;
            });
            s.addEventListener('mouseenter', () => {
                const label = s.getAttribute('data-label') || '';
                const mood = s.getAttribute('data-mood') || '';
                const node = s.querySelector('.node');
                if (!(node instanceof SVGCircleElement)) return;
                const rect = node.getBoundingClientRect();
                const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
                showCard(cx, cy, label, mood);
            });
            s.addEventListener('mouseleave', hideCard);
        });
    }

    // global click delegation for modal close and note link preview
    doc.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const closeBtn = t.closest('[data-modal-close]');
        if (closeBtn) {
            e.preventDefault();
            window.EchoModal.close();
            return;
        }
        const noteLink = t.closest('[data-note-link]');
        if (noteLink) {
            e.preventDefault();
            const url = decodeURIComponent(noteLink.getAttribute('data-note-link'));
            window.EchoModal.open(`<div class="sheet"><p class="muted" style="margin:0 0 8px 0">This would open:</p><p>${url}</p><div class="sheet-actions mt-s"><button class="service-btn" data-modal-close>Close</button></div></div>`);
        }
    });

    // Build and open Playlist modal from a .tape element
    function openPlaylistFrom(el) {
        const title = el.getAttribute('data-title') || 'Mixtape';
        const mood = el.getAttribute('data-mood') || '';
        const image = el.getAttribute('data-image') || '';
        const desc = el.getAttribute('data-description') || el.getAttribute('data-synopsis') || 'A late-night journey through soft synth haze and hazier memory.';
        const spotifyUrl = el.getAttribute('data-spotify') || '';
        const youtubeUrl = el.getAttribute('data-youtube') || '';
        const tracksRaw = el.getAttribute('data-tracks') || '';
        let tracks = [];
        if (tracksRaw) {
            try {
                tracks = JSON.parse(tracksRaw);
            } catch (e) {
                tracks = tracksRaw.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        if (tracks.length === 0) {
            tracks = ['Echoes Under Neon', 'Last Platform Light', 'Rolling Midnight', 'Rain On The Window'];
        }
        const tracksHTML = tracks.map(t => `<li>${t}</li>`).join('');
        const spotifyBtn = `<button class="service-btn spotify" data-service="spotify" data-title="${title}"${spotifyUrl ? ` data-spotify-url="${encodeURIComponent(spotifyUrl)}"` : ''}>Play on Spotify</button>`;
        const youtubeBtn = `<button class="service-btn youtube" data-service="youtube" data-title="${title}"${youtubeUrl ? ` data-youtube-url="${encodeURIComponent(youtubeUrl)}"` : ''}>Play on YouTube</button>`;
        const content = `
            <div class="drawer">
                <div class="art-lg"><img src="${image}" alt="Cassette tape cover art: ${title}"></div>
                <div class="desc">
                    <h3>${title}</h3>
                    <p class="emotional">${desc}</p>
                    <p class="muted">${mood}</p>
                </div>
                <div class="content">
                    <ol class="tracks">
                        ${tracksHTML}
                    </ol>
                    <div class="service-actions">
                        ${spotifyBtn}
                        ${youtubeBtn}
                    </div>
                </div>
            </div>`;
        window.EchoModal.open(content);
    }

    // Build and open Artist modal from a .poster element
    function openArtistFrom(el) {
        const name = el.getAttribute('data-name') || 'Artist';
        const genre = el.getAttribute('data-genre') || '';
        const image = el.getAttribute('data-image') || '';
        const synopsis = el.getAttribute('data-synopsis') || 'Sketches from a notebook: fragments of nights and city lights.';
        const spotifyUrl = el.getAttribute('data-spotify') || '';
        const tracksRaw = el.getAttribute('data-tracks') || '';
        let tracks = [];
        if (tracksRaw) {
            try {
                tracks = JSON.parse(tracksRaw);
            } catch (e) {
                tracks = tracksRaw.split(',').map(t => t.trim()).filter(Boolean);
            }
        }
        if (tracks.length === 0) {
            tracks = ['Platform Reverie', 'Soft Fluorescent', 'Still Train, Moving Heart'];
        }
        const tracksHTML = tracks.map(t => `<li>${t}</li>`).join('');
        const spotifyBtn = spotifyUrl ? `
                    <div class="service-actions">
                        <button class="service-btn spotify" data-service="spotify" data-spotify-url="${encodeURIComponent(spotifyUrl)}" data-title="${name}">View on Spotify</button>
                    </div>` : '';
        const content = `
            <div class="drawer">
                <div class="art-lg"><img src="${image}" alt="Indie artist portrait in dim purple station light: ${name}"></div>
                <div class="desc">
                    <h3>${name}</h3>
                    <p class="emotional">${synopsis}</p>
                    <p class="muted">${genre}</p>
                </div>
                <div class="content">
                    <ol class="tracks">
                        ${tracksHTML}
                    </ol>
                    ${spotifyBtn}
                </div>
            </div>`;
        window.EchoModal.open(content);
    }

    // Click handlers for playlists and artists
    doc.addEventListener('click', (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const tape = t.closest('.tape');
        if (tape) {
            e.preventDefault();
            openPlaylistFrom(tape);
            return;
        }
        const poster = t.closest('.poster');
        if (poster) {
            e.preventDefault();
            openArtistFrom(poster);
            return;
        }
        const backBtn = t.closest('[data-modal-back]');
        if (backBtn) {
            e.preventDefault();
            window.EchoModal.back();
            return;
        }
        const serviceBtn = t.closest('[data-service]');
        if (serviceBtn) {
            e.preventDefault();
            const service = serviceBtn.getAttribute('data-service');
            const title = serviceBtn.getAttribute('data-title') || 'Playlist';
            const spotifyUrl = serviceBtn.getAttribute('data-spotify-url');
            const youtubeUrl = serviceBtn.getAttribute('data-youtube-url');
            const pretty = service === 'spotify' ? 'Spotify' : 'YouTube';
            const chosenUrl = service === 'spotify' ? spotifyUrl : youtubeUrl;
            const urlDisplay = chosenUrl ? decodeURIComponent(chosenUrl) : '';
            const urlText = urlDisplay ? `<p class="muted" style="margin-top:8px; font-size:12px; word-break:break-all;">${urlDisplay}</p>` : '';
            window.EchoModal.open(`
                <div class="pad-m">
                    <h3 style="margin-top:0">Open in ${pretty}</h3>
                    <p class="muted">This would open ${pretty}${title ? ` to view "${title}"` : ''}. For the prototype, we're showing this dialog instead.</p>
                    ${urlText}
                    <div class="service-actions">
                        <button class="service-btn" data-modal-back>Back</button>
                    </div>
                </div>
            `);
            return;
        }
    });
    // Reveal on scroll (fade-in animation)
    const toReveal = Array.from(doc.querySelectorAll('.reveal'));
    if ('IntersectionObserver' in window && toReveal.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });
        toReveal.forEach(el => io.observe(el));
    } else {
        toReveal.forEach(el => el.classList.add('revealed'));
    }

    // Toggle train ambient audio (off by default)
    const ambientBtn = doc.getElementById('ambientToggle');
    const ambientAudio = doc.getElementById('ambientAudio');
    if (ambientBtn && ambientAudio instanceof HTMLAudioElement) {
        ambientAudio.volume = 0.75;
        let enabled = false;
        ambientBtn.addEventListener('click', async () => {
            enabled = !enabled;
            ambientBtn.setAttribute('aria-pressed', String(enabled));
            ambientBtn.textContent = enabled ? 'Ambient on' : 'Ambient off';
            try {
                if (enabled) {
                    await ambientAudio.play();
                } else {
                    ambientAudio.pause();
                }
            } catch (e) { /* autoplay block safe */ }
        });
    }
})();


