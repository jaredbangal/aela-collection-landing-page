/**
 * Aela Collection — landing page behaviour.
 *
 * Port of the DCLogic class in "Aela Collection Landing Page.dc.html".
 * The design's editable props become `config` below; its component state
 * (active tab, discount rail) becomes plain DOM state here.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Props — these were the design's editor-exposed controls.
     --------------------------------------------------------------------- */

  var config = {
    tileShape: 'arch',           // 'arch' | 'rounded' | 'circle'
    showAnnouncementBar: true,
    secondaryCtaStyle: 'on-dark' // 'on-dark' | 'secondary' | 'ghost'
  };

  /* ---------------------------------------------------------------------
     Content
     --------------------------------------------------------------------- */

  var categories = [
    { id: 'cat-furniture', label: 'Furniture' },
    { id: 'cat-lighting',  label: 'Lighting' },
    { id: 'cat-textiles',  label: 'Textiles' },
    { id: 'cat-ceramics',  label: 'Ceramics & Tableware' }
  ];

  var collections = [
    {
      id: 'new',
      label: 'New Arrivals',
      products: [
        { id: 'n1', name: 'Amble Lounge Chair',      meta: 'Reclaimed Oak & Boiled Wool | Handmade in Vermont', price: '$680' },
        { id: 'n2', name: 'Solstice Table Lamp',     meta: 'Blown Glass & Brass | Made in Portland',            price: '$210' },
        { id: 'n3', name: 'Furrow Wool Rug, Natural',meta: 'Undyed Wool | Handknotted in Oaxaca',               price: '$560' },
        { id: 'n4', name: 'Ember Pendant Light',     meta: 'Hand-blown Glass | Made in Seattle',                price: '$265' },
        { id: 'n5', name: 'Loom Woven Basket',       meta: 'Seagrass | Woven in Ghana',                         price: '$58'  },
        { id: 'n6', name: 'Tide Ceramic Bowl Set',   meta: 'Stoneware | Thrown in Vermont',                     price: '$72'  }
      ]
    },
    {
      id: 'best',
      label: 'Best Sellers',
      products: [
        { id: 'b1', name: 'Hearth Ceramic Vase',      meta: 'Stoneware, Wood-fired | Thrown in Oaxaca',      price: '$96'  },
        { id: 'b2', name: 'Kiln Dinner Set, 4-Piece', meta: 'Glazed Stoneware | Made in North Carolina',     price: '$145' },
        { id: 'b3', name: 'Wayfare Linen Throw',      meta: 'Belgian Flax Linen | Woven in Portugal',        price: '$88'  },
        { id: 'b4', name: 'Bramble Side Table',       meta: 'Solid Ash | Turned in Asheville',               price: '$420' },
        { id: 'b5', name: 'Grove Wooden Stool',       meta: 'Solid Beech | Turned in Sweden',                price: '$180' },
        { id: 'b6', name: 'Petal Table Runner',       meta: 'Organic Cotton | Woven in India',               price: '$42'  }
      ]
    },
    {
      id: 'made',
      label: 'Made to Order',
      products: [
        { id: 'm1', name: 'Drift Dining Table',   meta: 'FSC Walnut | Built in Asheville',                price: '$1,850' },
        { id: 'm2', name: 'Harbor Sofa, 3-Seat',  meta: 'Linen & Oak Frame | Upholstered in Maine',       price: '$2,400' },
        { id: 'm3', name: 'Loam Planter, Large',  meta: 'Terracotta | Handbuilt in Santa Fe',             price: '$135'   },
        { id: 'm4', name: 'Meridian Bookshelf',   meta: 'Reclaimed Pine | Built in Vermont',              price: '$890'   },
        { id: 'm5', name: 'Cove Armchair',        meta: 'Boucle & Oak | Upholstered in North Carolina',   price: '$1,240' },
        { id: 'm6', name: 'Ridge Console Table',  meta: 'Reclaimed Teak | Built in Bali',                 price: '$980'   }
      ]
    }
  ];

  var announcements = [
    'Free shipping on orders over $150',
    'Ships direct from the maker',
    'Handmade in small-batch runs',
    '30-day returns, no questions asked'
  ];

  // [topPercent, variant, scrollDuration, pulseDuration]
  var marqueeFields = {
    hero: [
      [0, 'a', 44, 6], [9, 'b', 52, 7], [18, 'a', 40, 5.5], [27, 'b', 48, 6.5],
      [36, 'a', 38, 7.5], [45, 'b', 46, 5], [55, 'a', 42, 6.8], [64, 'b', 50, 7.2],
      [73, 'a', 44, 6.2], [82, 'b', 52, 7.8], [91, 'a', 40, 5.8], [100, 'b', 48, 6.6]
    ],
    testimonials: [
      [0, 'a', 44, 6.2], [12.5, 'b', 52, 7.8], [25, 'a', 38, 5.8], [37.5, 'b', 46, 6.6],
      [50, 'a', 40, 7.4], [62.5, 'b', 48, 5.2], [75, 'a', 42, 6], [87.5, 'b', 50, 7],
      [100, 'a', 36, 5.5]
    ]
  };

  var MARQUEE_REPEATS = 12; // must stay even — the -50% loop assumes two identical halves

  /**
   * Photography, keyed by slot id. In the design file these were <image-slot>
   * elements filled by drag-and-drop and persisted to .image-slots.state.json.
   *
   * Each entry is either a path, or an object carrying the slot's framing:
   *   'cat-furniture': 'images/cat-furniture.webp'
   *   'cat-furniture': { src: 'images/cat-furniture.webp', scale: 1, x: 0, y: -10 }
   * where scale/x/y mirror the s/x/y the canvas stored for pan and zoom.
   *
   * `tools/extract-slot-images.py` writes this block for you from a full
   * .image-slots.state.json — see README. Any slot left out renders the
   * placeholder. Slot ids: cat-furniture, cat-lighting, cat-textiles,
   * cat-ceramics, editorial-workshop, prod-n1…n6, prod-b1…b6, prod-m1…m6.
   */
  /* IMAGES:START */
  var images = {
    'cat-furniture': { src: 'images/cat-furniture.webp', y: -10.0802 },
    'cat-lighting': { src: 'images/cat-lighting.webp', y: -10.0802 },
    'cat-textiles': 'images/cat-textiles.webp',
    'cat-ceramics': 'images/cat-ceramics.webp',
    'editorial-workshop': { src: 'images/editorial-workshop.webp', y: -1.29163 },
    'prod-n1': 'images/prod-n1.webp',
    'prod-n2': 'images/prod-n2.webp',
    'prod-n3': 'images/prod-n3.webp',
    'prod-n4': 'images/prod-n4.webp',
    'prod-n5': 'images/prod-n5.webp',
    'prod-n6': 'images/prod-n6.webp',
    'prod-b1': 'images/prod-b1.webp',
    'prod-b2': 'images/prod-b2.webp',
    'prod-b3': 'images/prod-b3.webp',
    'prod-b4': 'images/prod-b4.webp',
    'prod-b5': 'images/prod-b5.webp',
    'prod-b6': 'images/prod-b6.webp',
    'prod-m1': 'images/prod-m1.webp',
    'prod-m2': 'images/prod-m2.webp',
    'prod-m3': 'images/prod-m3.webp',
    'prod-m4': 'images/prod-m4.webp',
    'prod-m5': 'images/prod-m5.webp',
    'prod-m6': 'images/prod-m6.webp',
  };
  /* IMAGES:END */

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function svgUse(id, size) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  /**
   * Build an image slot: the photo named in `images` if there is one, and a
   * placeholder that shows whenever there isn't (or the file fails to load).
   */
  function buildSlot(node, id, label, shape) {
    var wasRevealed = node.classList.contains('reveal');
    node.className = 'slot slot--' + (shape || 'rounded') + (wasRevealed ? ' reveal' : '');

    var entry = images[id];
    if (typeof entry === 'string') entry = { src: entry };

    if (entry && entry.src) {
      var img = el('img', 'slot__img');
      img.src = entry.src;
      img.alt = label;
      img.loading = 'lazy';
      img.decoding = 'async';

      // Reapply the pan/zoom the slot was framed with in the design canvas.
      // Set as custom properties so the hover zoom composes with it rather
      // than being overridden by an inline transform.
      var x = entry.x || 0;
      var y = entry.y || 0;

      // Translating a cover-fitted image drags its edge into frame, leaving a
      // strip of background. Scale up enough to keep the slot covered: shifting
      // by t% needs 2t% of extra size to close the gap on the trailing edge.
      var minScale = 1 + 2 * Math.max(Math.abs(x), Math.abs(y)) / 100;
      var scale = Math.max(entry.scale == null ? 1 : entry.scale, minScale);

      if (scale !== 1) img.style.setProperty('--slot-scale', scale);
      if (x) img.style.setProperty('--slot-tx', x + '%');
      if (y) img.style.setProperty('--slot-ty', y + '%');

      img.addEventListener('error', function () {
        node.classList.add('is-empty');
        img.alt = '';
      });
      node.appendChild(img);
    } else {
      node.classList.add('is-empty');
    }

    var placeholder = el('div', 'slot__placeholder');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.appendChild(svgUse('icon-diamond-tick', 9));
    placeholder.appendChild(el('span', null, label));
    node.appendChild(placeholder);

    return node;
  }

  /* ---------------------------------------------------------------------
     Renderers
     --------------------------------------------------------------------- */

  function renderAnnouncementBar() {
    var bar = document.querySelector('[data-announce]');
    if (!bar) return;
    if (!config.showAnnouncementBar) { bar.remove(); return; }

    var track = bar.querySelector('[data-announce-track]');
    for (var pass = 0; pass < 2; pass++) {
      announcements.forEach(function (message) {
        track.appendChild(el('span', null, message));
        var tick = el('span', 'marquee-row__tick');
        tick.appendChild(svgUse('icon-diamond-tick', 7));
        track.appendChild(tick);
      });
    }
    bar.hidden = false;
  }

  function renderMarqueeFields() {
    Object.keys(marqueeFields).forEach(function (name) {
      var field = document.querySelector('[data-marquee-field="' + name + '"]');
      if (!field) return;

      marqueeFields[name].forEach(function (spec) {
        var row = el('div', 'marquee-row marquee-row--' + spec[1]);
        row.style.top = spec[0] + '%';
        row.style.animationDuration = spec[2] + 's, ' + spec[3] + 's';
        for (var i = 0; i < MARQUEE_REPEATS; i++) row.appendChild(el('span', null, 'AELA COLLECTION'));
        field.appendChild(row);
      });
    });
  }

  function renderCategories() {
    var grid = document.querySelector('[data-categories]');
    if (!grid) return;

    categories.forEach(function (category) {
      var card = el('a', 'glass-card cat-card reveal');
      card.href = '#the-edit';

      var slot = buildSlot(el('div'), category.id, category.label, config.tileShape);
      card.appendChild(slot);
      card.appendChild(el('span', 'cat-card__label', category.label));
      grid.appendChild(card);
    });
  }

  function renderTheEdit() {
    var tablist = document.querySelector('[data-tabs]');
    var railHost = document.querySelector('[data-rails]');
    if (!tablist || !railHost) return;

    var tabs = [];
    var rails = [];

    collections.forEach(function (collection, index) {
      var tab = el('button', 'tab', collection.label);
      tab.type = 'button';
      tab.id = 'tab-' + collection.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', 'rail-' + collection.id);
      tab.setAttribute('aria-selected', String(index === 0));
      tab.tabIndex = index === 0 ? 0 : -1;
      tablist.appendChild(tab);
      tabs.push(tab);

      var rail = el('div', 'rail');
      rail.id = 'rail-' + collection.id;
      rail.setAttribute('role', 'tabpanel');
      rail.setAttribute('aria-labelledby', tab.id);
      rail.hidden = index !== 0;

      collection.products.forEach(function (product) {
        // Mirrors the design system's ProductCard: the whole tile is the link.
        var card = el('a', 'product');
        card.href = '#';
        card.appendChild(buildSlot(el('div'), 'prod-' + product.id, product.name, 'rect'));
        card.appendChild(el('h3', 'product__name', product.name));
        card.appendChild(el('p', 'product__meta', product.meta));
        card.appendChild(el('p', 'product__price', product.price));
        rail.appendChild(card);
      });

      railHost.appendChild(rail);
      rails.push(rail);
    });

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        tab.setAttribute('aria-selected', String(i === index));
        tab.tabIndex = i === index ? 0 : -1;
        rails[i].hidden = i !== index;
      });
      if (focus) tabs[index].focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(index); });
      tab.addEventListener('keydown', function (event) {
        var next = event.key === 'ArrowRight' ? index + 1
                 : event.key === 'ArrowLeft'  ? index - 1
                 : event.key === 'Home'       ? 0
                 : event.key === 'End'        ? tabs.length - 1
                 : null;
        if (next === null) return;
        event.preventDefault();
        select((next + tabs.length) % tabs.length, true);
      });
    });
  }

  function renderStandaloneSlots() {
    document.querySelectorAll('[data-slot]').forEach(function (node) {
      var shape = node.classList.contains('slot--rect') ? 'rect'
                : node.classList.contains('slot--circle') ? 'circle'
                : node.classList.contains('slot--arch') ? 'arch'
                : 'rounded';
      buildSlot(node, node.dataset.slot, node.dataset.label || '', shape);
    });
  }

  function applySecondaryCta() {
    var node = document.querySelector('[data-variant-slot="secondaryCta"]');
    if (node) node.classList.add('ds-btn--' + config.secondaryCtaStyle);
  }

  /* ---------------------------------------------------------------------
     Behaviour
     --------------------------------------------------------------------- */

  function initReveal() {
    var targets = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-in-view'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    targets.forEach(function (t) { observer.observe(t); });
  }

  function initDiscountRail() {
    var rail = document.querySelector('[data-discount]');
    if (!rail) return;

    var DISMISSED = 'aela:discount-dismissed';
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(DISMISSED) === '1'; } catch (e) { /* private mode */ }
    if (dismissed) { rail.remove(); return; }

    rail.hidden = false;
    rail.querySelector('[data-discount-close]').addEventListener('click', function () {
      rail.hidden = true;
      try { sessionStorage.setItem(DISMISSED, '1'); } catch (e) { /* ignore */ }
    });
  }

  function initNewsletter() {
    var form = document.querySelector('[data-newsletter]');
    if (!form) return;
    var note = document.querySelector('[data-newsletter-note]');
    var input = form.querySelector('input[type="email"]');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!input.value || !input.checkValidity()) {
        note.textContent = 'Please enter a valid email address.';
        note.classList.remove('is-success');
        input.focus();
        return;
      }
      // No backend wired up — swap this for the real subscribe endpoint.
      note.textContent = "You're on the list. Watch for the next drop.";
      note.classList.add('is-success');
      form.reset();
    });
  }

  /* ---------------------------------------------------------------------
     Boot
     --------------------------------------------------------------------- */

  function init() {
    renderAnnouncementBar();
    renderMarqueeFields();
    renderCategories();
    renderTheEdit();
    renderStandaloneSlots();
    applySecondaryCta();
    initReveal();
    initDiscountRail();
    initNewsletter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
