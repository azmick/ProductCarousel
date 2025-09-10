(function () {
    const CONFIG = {
      TITLE: "Beğenebileceğinizi düşündüklerimiz",
      PRODUCTS_URL: "https://gist.githubusercontent.com/sevindi/8bcbde9f02c1d4abe112809c974e1f49/raw/9bf93b58df623a9b16f1db721cd0a7a539296cf0/products.json",
      STORAGE_KEYS: {
        PRODUCTS: "myCarouselProducts",
        FAVORITES: "myCarouselFavorites"
      },
      STYLE_ID: "my-carousel-style",
      BREAKPOINTS: {
        DESKTOP: 1280,
        TABLET: 992
      }
    };
  
    const state = {
      products: [],
      favorites: new Set(),
      currentIndex: 0,
      dom: {
        container: null,
        inner: null,
        leftBtn: null,
        rightBtn: null
      }
    };
  
    const utils = {
      debounce: (fn, wait = 150) => {
        let timeout;
        return (...args) => {
          clearTimeout(timeout);
          timeout = setTimeout(() => fn(...args), wait);
        };
      },
  
      storage: {
        get: (key, fallback = null) => {
          try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : fallback;
          } catch {
            return fallback;
          }
        },
        set: (key, value) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.warn('Failed to save to localStorage:', error);
          }
        }
      },
  
      formatPrice: (value) => {
        const num = Number(value);
        return isFinite(num) ? `${num.toFixed(2)} TL` : "";
      },
  
      getProductKey: (product) => {
        return String(
          product.id ?? 
          product.productId ?? 
          product.sku ?? 
          product.code ?? 
          product.url ?? 
          product.link ?? 
          product.name ?? 
          JSON.stringify(product)
        );
      },
  
      getProductUrl: (product) => {
        return product.url || product.link || product.productUrl || product.href || null;
      },
  
      splitBrandName: (product) => {
        if (product.brand) {
          return { 
            brand: String(product.brand), 
            name: String(product.name || "") 
          };
        }
        
        const full = String(product.name || "");
        const parts = full.split(" - ");
        
        if (parts.length > 1) {
          return { 
            brand: parts[0], 
            name: parts.slice(1).join(" - ") 
          };
        }
        
        return { brand: "", name: full };
      }
    };
  
    const isHomePage = () => {
        try {
          const { hostname } = window.location;
          const validHosts = ["www.e-bebek.com", "e-bebek.com"];
          
          return validHosts.includes(hostname);
        } catch {
          return false;
        }
      };
  
    const getVisibleCount = () => {
      const width = window.innerWidth;
      if (width >= CONFIG.BREAKPOINTS.DESKTOP) return 4;
      if (width >= CONFIG.BREAKPOINTS.TABLET) return 3;
      return 2;
    };
  
    const favorites = {
      load: () => {
        const arr = utils.storage.get(CONFIG.STORAGE_KEYS.FAVORITES, []);
        state.favorites = Array.isArray(arr) ? new Set(arr) : new Set();
      },
      
      save: () => {
        utils.storage.set(CONFIG.STORAGE_KEYS.FAVORITES, Array.from(state.favorites));
      },
      
      toggle: (key) => {
        if (state.favorites.has(key)) {
          state.favorites.delete(key);
        } else {
          state.favorites.add(key);
        }
        favorites.save();
      }
    };
  
    const data = {
      async fetchProducts() {
        let cached = utils.storage.get(CONFIG.STORAGE_KEYS.PRODUCTS, null);
        
        if (cached && Array.isArray(cached) && cached.length) {
          state.products = cached;
        } else {
          try {
            const response = await fetch(CONFIG.PRODUCTS_URL, {
              method: "GET",
              credentials: "omit",
              cache: "no-store"
            });
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            state.products = await response.json();
            utils.storage.set(CONFIG.STORAGE_KEYS.PRODUCTS, state.products);
          } catch (error) {
            console.error('Failed to fetch products:', error);
            state.products = [];
          }
        }
        
        state.currentIndex = 0;
        render.renderProducts();
      }
    };
  
    const render = {
      createProductCard(product) {
        const key = utils.getProductKey(product);
        const hasOriginal = product.original_price != null && 
                           Number(product.original_price) !== Number(product.price);
        
        const discountAmount = hasOriginal ? 
          (Number(product.original_price) - Number(product.price)) : 0;
        
        const discountPercent = hasOriginal && Number(product.original_price) > 0
          ? Math.round((discountAmount / Number(product.original_price)) * 100)
          : 0;
        
        const isFavorite = state.favorites.has(key);
        const url = utils.getProductUrl(product);
        const { brand, name } = utils.splitBrandName(product);
  
        return `
          <div class="product-card" data-key="${key}" ${url ? `data-url="${url}"` : ""}>
            <button class="fav-btn ${isFavorite ? "active" : ""}" 
                    aria-label="Favori" 
                    type="button">
              <svg class="heart-svg" 
                   width="15" 
                   height="15" 
                   viewBox="0 0 24 24" 
                   aria-hidden="true" 
                   focusable="false">
                <path d="M12 21C12 21 4 13.36 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.36 16 21 16 21H12Z"
                      fill="${isFavorite ? "#ff7a00" : "none"}"
                      stroke="${isFavorite ? "transparent" : "#bbb"}"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round" />
              </svg>
            </button>
            
            <div class="product-img-wrap">
              <img src="${product.img}" 
                   alt="${product.name}" 
                   loading="lazy" />
            </div>
            
            <div class="product-info">
              <div class="product-title-line">
                ${brand ? `<span class="product-brand">${brand}</span>` : ""}
                ${brand ? `<span class="dash-sep">-</span>` : ""}
                <span class="product-name">${name}</span>
              </div>
              
              <div class="product-price">
                ${hasOriginal ? `
                  <div class="price-top-row">
                    <span class="original-price">${utils.formatPrice(product.original_price)}</span>
                    <span class="percent-badge">${discountPercent}%</span>
                  </div>
                  <div class="price-bottom-row">
                    <span class="current-price-large">${utils.formatPrice(product.price)}</span>
                  </div>
                ` : `
                  <div class="price-row">
                    <span class="current-price">${utils.formatPrice(product.price)}</span>
                  </div>
                `}
              </div>
            </div>
          </div>
        `;
      },
  
      renderProducts() {
        if (!state.dom.inner) return;
        
        const visibleCount = getVisibleCount();
        const maxStart = Math.max(state.products.length - visibleCount, 0);
        
        state.currentIndex = Math.max(0, Math.min(state.currentIndex, maxStart));
        
        const visibleProducts = state.products.slice(
          state.currentIndex, 
          state.currentIndex + visibleCount
        );
        
        state.dom.inner.innerHTML = visibleProducts
          .map(render.createProductCard)
          .join("");
        
        controls.updateButtonStates();
      }
    };
  
    const controls = {
      updateButtonStates() {
        if (!state.dom.leftBtn || !state.dom.rightBtn) return;
        
        const visibleCount = getVisibleCount();
        const maxStart = Math.max(state.products.length - visibleCount, 0);
        
        state.dom.leftBtn.disabled = state.currentIndex <= 0;
        state.dom.rightBtn.disabled = state.currentIndex >= maxStart;
      },
  
      addButtonListeners() {
        if (!state.dom.leftBtn || !state.dom.rightBtn) return;
  
        state.dom.leftBtn.addEventListener("click", () => {
          if (state.currentIndex === 0) return;
          state.currentIndex = Math.max(state.currentIndex - 1, 0);
          render.renderProducts();
        });
  
        state.dom.rightBtn.addEventListener("click", () => {
          const visibleCount = getVisibleCount();
          const maxStart = Math.max(state.products.length - visibleCount, 0);
          if (state.currentIndex >= maxStart) return;
          state.currentIndex = Math.min(state.currentIndex + 1, maxStart);
          render.renderProducts();
        });
      },
  
      addDelegatedListeners() {
        if (!state.dom.inner) return;
  
        state.dom.inner.addEventListener("click", (e) => {
          const favBtn = e.target.closest(".fav-btn");
          if (!favBtn) return;
          
          e.stopPropagation();
          e.preventDefault();
          
          const card = favBtn.closest(".product-card");
          if (!card) return;
          
          const key = card.getAttribute("data-key");
          favorites.toggle(key);
          render.renderProducts();
        });
  
        state.dom.inner.addEventListener("click", (e) => {
          if (e.target.closest(".fav-btn")) return;
          
          const card = e.target.closest(".product-card");
          if (!card) return;
          
          const url = card.getAttribute("data-url");
          if (url) {
            window.open(url, "_blank", "noopener,noreferrer");
          }
        });
      }
    };
  
    const dom = {
      buildHTML() {
        if (document.querySelector(".my-carousel-container")) return;
  
        const container = document.createElement("div");
        container.className = "my-carousel-container";
        container.innerHTML = `
          <h2 class="my-carousel-title">${CONFIG.TITLE}</h2>
          <div class="carousel">
            <button class="carousel-btn left" aria-label="Geri">&#8592;</button>
            <div class="carousel-inner"></div>
            <button class="carousel-btn right" aria-label="İleri">&#8594;</button>
          </div>
        `;
  
        const heroBanner = document.querySelector(".hero.banner");
        if (heroBanner) {
          heroBanner.insertAdjacentElement("afterend", container);
        } else {
          console.error("Hero banner not found!");
          document.body.prepend(container);
        }
      },
  
      buildCSS() {
        if (document.getElementById(CONFIG.STYLE_ID)) return;
  
        const css = `
          .my-carousel-container { 
            max-width: 1240px; 
            margin: 24px auto 0; 
            padding: 0 16px; 
          }
          
          .my-banner { 
            background: #fff; 
            border-radius: 12px; 
            border: 1px solid #f3f3f3; 
            padding: 24px 20px 20px; 
          }
          
          .my-carousel-title { 
            font-size: 22px; 
            font-weight: 700; 
            color: #222; 
            margin: 0 0 20px 50px; 
            text-align: left; 
          }
          
          .carousel { 
            display: flex; 
            align-items: center; 
            gap: 16px; 
          }
          
          .carousel-btn { 
            background: #fff; 
            border: 1px solid #e0e0e0; 
            border-radius: 50%; 
            width: 40px; 
            height: 40px; 
            font-size: 22px; 
            color: #222; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            transition: box-shadow 0.2s, transform 0.1s; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.08); 
          }
          
          .carousel-btn:hover { 
            box-shadow: 0 4px 14px rgba(0,0,0,0.12); 
          }
          
          .carousel-btn:disabled { 
            opacity: 1; 
            cursor: default; 
          }
          
          .carousel-inner { 
            display: flex; 
            gap: 16px; 
            flex: 1; 
            justify-content: flex-start; 
          }
  
          .product-card { 
            position: relative; 
            flex: 0 0 auto; 
            width: 300px; 
            height: 400px; 
            background: #fff; 
            border: 1px solid #ededed; 
            border-radius: 10px; 
            box-shadow: none; 
            display: flex; 
            flex-direction: column; 
            padding: 16px 14px 14px; 
            cursor: pointer; 
          }
          
          .product-img-wrap { 
            width: 100%; 
            height: 180px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 10px; 
          }
          
          .product-img-wrap img { 
            max-width: 100%; 
            max-height: 100%; 
            object-fit: contain; 
          }
  
          .product-info { 
            width: 100%; 
            text-align: left; 
            display: flex; 
            flex-direction: column; 
            flex: 1; 
          }
          
          .product-title-line { 
            display: block; 
            margin-bottom: 8px; 
            line-height: 1.35; 
            white-space: normal; 
            overflow: visible; 
            text-overflow: initial; 
            font-size: 12px; 
          }
          
          .product-brand { 
            display: inline; 
            font-size: 12px; 
            font-weight: 700; 
            color: #222; 
          }
          
          .dash-sep { 
            display: inline; 
            font-size: 12px; 
            font-weight: 400; 
            color: #666; 
          }
          
          .product-name { 
            display: inline; 
            font-size: 12px; 
            font-weight: 400; 
            color: #333; 
          }
  
          .product-price { 
            font-size: 15px; 
            color: #666; 
            margin-top: auto; 
          }
          
          .price-row, .price-top-row { 
            display: flex; 
            gap: 8px; 
            align-items: baseline; 
            justify-content: flex-start; 
          }
          
          .price-bottom-row { 
            display: flex; 
            justify-content: flex-start; 
            margin-top: 2px; 
          }
          
          .current-price { 
            font-weight: 700; 
            color: #00a862; 
          }
          
          .current-price-large { 
            font-weight: 800; 
            color: #00a862; 
            font-size: 18px; 
          }
          
          .original-price { 
            color: #999; 
            text-decoration: line-through; 
            font-size: 14px; 
          }
          
          .percent-badge { 
            background: #00a862; 
            color: #fff; 
            border-radius: 999px; 
            padding: 2px 8px; 
            font-size: 12px; 
            font-weight: 700; 
            display: inline-block; 
          }
  
          .fav-btn { 
            position: absolute; 
            top: 10px; 
            right: 10px; 
            border: none; 
            background: #fff; 
            width: 32px; 
            height: 32px; 
            display: inline-flex; 
            align-items: center; 
            justify-content: center; 
            cursor: pointer; 
          }
          
          .fav-btn .heart-svg { 
            width: 15px; 
            height: 15px; 
          }
          
          .fav-btn .heart-svg path { 
            transition: fill 0.15s, stroke 0.15s; 
          }
          
          .fav-btn.active .heart-svg path { 
            fill: #ff7a00; 
            stroke: transparent; 
          }
  
          @media (max-width: 1279px) and (min-width: 992px) { 
            .product-card { 
              width: 260px; 
              height: 380px; 
            } 
          }
          
          @media (max-width: 991px) {
            .carousel-inner { 
              gap: 12px; 
            }
            .product-card { 
              width: 70vw; 
              max-width: 300px; 
              height: 380px; 
            }
            .my-carousel-title { 
              font-size: 18px; 
              margin-left: 0; 
            }
          }
        `;
  
        const style = document.createElement("style");
        style.id = CONFIG.STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
      }
    };
  
    const init = () => {
      if (!isHomePage()) {
        console.log("wrong page");
        return;
      }
  
      state.dom.container = document.querySelector(".my-carousel-container");
      if (!state.dom.container) {
        dom.buildHTML();
        dom.buildCSS();
        state.dom.container = document.querySelector(".my-carousel-container");
      }
  
      state.dom.inner = state.dom.container.querySelector(".carousel-inner");
      state.dom.leftBtn = state.dom.container.querySelector(".carousel-btn.left");
      state.dom.rightBtn = state.dom.container.querySelector(".carousel-btn.right");
  
      favorites.load();
      data.fetchProducts();
  
      if (!state.dom.container.dataset.bound) {
        controls.addButtonListeners();
        controls.addDelegatedListeners();
        window.addEventListener("resize", utils.debounce(render.renderProducts, 150));
        state.dom.container.dataset.bound = "1";
      }
    };
  
    init();
  })();